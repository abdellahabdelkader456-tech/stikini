
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getStorageFile(
  imageUrl: string | null | undefined,
): { bucket: string; path: string } | null {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);

    const match = url.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    );

    if (!match) return null;

    const bucket = match[1];

    if (!["salon-images", "barber-images"].includes(bucket)) {
      return null;
    }

    const path = match[2]
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");

    return path ? { bucket, path } : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !authorization) {
    return jsonResponse(
      { error: "Server configuration or authorization is missing." },
      500,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Authenticate the caller.
    const token = authorization.replace(/^Bearer\s+/i, "");

    const {
      data: { user: caller },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !caller) {
      return jsonResponse({ error: "Your session is invalid." }, 401);
    }

    // Require an administrator account.
    const { data: adminProfile, error: adminError } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .maybeSingle();

    if (adminError || adminProfile?.is_admin !== true) {
      return jsonResponse({ error: "Admin access required." }, 403);
    }

    // Read and validate the request body.
    let body: { requestId?: unknown; adminNote?: unknown };

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const requestId = String(body.requestId ?? "").trim();
    const adminNote =
      typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (!requestId) {
      return jsonResponse({ error: "requestId is required." }, 400);
    }

    // The deletion request must exist and still be pending.
    const { data: deletionRequest, error: requestError } =
      await adminClient
        .from("account_deletion_requests")
        .select("id, user_id, status")
        .eq("id", requestId)
        .maybeSingle();

    if (requestError) {
      throw new Error(
        `Could not read deletion request: ${requestError.message}`,
      );
    }

    if (!deletionRequest) {
      return jsonResponse({ error: "Deletion request not found." }, 404);
    }

    if (deletionRequest.status !== "pending") {
      return jsonResponse(
        { error: "This request is no longer pending. No deletion was started." },
        409,
      );
    }

    const targetUserId = deletionRequest.user_id;

    if (!targetUserId || targetUserId === caller.id) {
      return jsonResponse(
        { error: "This account cannot be deleted through this request." },
        400,
      );
    }

    // Protect administrator accounts.
    const { data: targetProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, is_admin")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `Could not check target profile: ${profileError.message}`,
      );
    }

    if (!targetProfile) {
      return jsonResponse(
        { error: "The target profile was not found. No deletion was started." },
        409,
      );
    }

    if (targetProfile.is_admin === true) {
      return jsonResponse(
        { error: "Administrator accounts cannot be deleted through this flow." },
        403,
      );
    }

    // Find only salons owned by this account.
    const { data: salons, error: salonsError } = await adminClient
      .from("salons")
      .select("id, logo_url, cover_url")
      .eq("owner_id", targetUserId);

    if (salonsError) {
      throw new Error(
        `Could not load owned salons: ${salonsError.message}`,
      );
    }

    const salonRows = salons ?? [];
    const salonIds = salonRows.map((salon) => salon.id);
    const imageUrls: (string | null | undefined)[] = [];

    for (const salon of salonRows) {
      imageUrls.push(salon.logo_url, salon.cover_url);
    }

    if (salonIds.length > 0) {
      const { data: salonImages, error: imagesError } = await adminClient
        .from("salon_images")
        .select("image_url")
        .in("salon_id", salonIds);

      if (imagesError) {
        throw new Error(
          `Could not load salon images: ${imagesError.message}`,
        );
      }

      for (const image of salonImages ?? []) {
        imageUrls.push(image.image_url);
      }

      const { data: barbers, error: barbersError } = await adminClient
        .from("salon_barbers")
        .select("photo_url")
        .in("salon_id", salonIds);

      if (barbersError) {
        throw new Error(
          `Could not load barber images: ${barbersError.message}`,
        );
      }

      for (const barber of barbers ?? []) {
        imageUrls.push(barber.photo_url);
      }
    }

    // Collect known Storage files, without touching external image hosts.
    const filesByBucket = new Map<string, Set<string>>();

    for (const imageUrl of imageUrls) {
      const file = getStorageFile(imageUrl);
      if (!file) continue;

      if (!filesByBucket.has(file.bucket)) {
        filesByBucket.set(file.bucket, new Set<string>());
      }

      filesByBucket.get(file.bucket)!.add(file.path);
    }

    // Remove Storage objects in batches.
    for (const [bucket, fileSet] of filesByBucket) {
      const paths = Array.from(fileSet);

      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);

        const { error: storageError } = await adminClient.storage
          .from(bucket)
          .remove(batch);

        if (storageError) {
          throw new Error(
            `Could not remove files from ${bucket}: ${storageError.message}`,
          );
        }
      }
    }

    // Delete owned salons. Related services, barbers and salon_images
    // are expected to be removed by the existing ON DELETE CASCADE rules.
    if (salonIds.length > 0) {
      const { error: deleteSalonsError } = await adminClient
        .from("salons")
        .delete()
        .eq("owner_id", targetUserId);

      if (deleteSalonsError) {
        throw new Error(
          `Could not delete owned salons: ${deleteSalonsError.message}`,
        );
      }
    }

    // Delete only the target user's own bookings.
    // Other customers' bookings remain untouched.
    const { error: bookingsError } = await adminClient
      .from("bookings")
      .delete()
      .eq("user_id", targetUserId);

    if (bookingsError) {
      throw new Error(
        `Could not delete the user's bookings: ${bookingsError.message}`,
      );
    }

    // Update the request BEFORE deleting the Auth account.
    // This avoids needing to update a request after account deletion.
    const { data: updatedRequest, error: updateRequestError } =
      await adminClient
        .from("account_deletion_requests")
        .update({
          status: "approved",
          admin_note: adminNote || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: caller.id,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

    if (updateRequestError) {
      console.error("Deletion request update failed:", {
        requestId,
        message: updateRequestError.message,
        code: updateRequestError.code,
        details: updateRequestError.details,
        hint: updateRequestError.hint,
      });

      throw new Error(
        `Could not approve deletion request: ${updateRequestError.message}`,
      );
    }

    if (!updatedRequest) {
      console.error("Deletion request update returned no row:", {
        requestId,
      });

      throw new Error(
        `No pending deletion request was updated. Request ID: ${requestId}`,
      );
    }

    // Delete the Auth account only after the request update succeeded.
    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteUserError) {
      // Best effort: restore pending status if Auth deletion failed.
      const { error: restoreError } = await adminClient
        .from("account_deletion_requests")
        .update({
          status: "pending",
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", requestId)
        .eq("status", "approved");

      if (restoreError) {
        console.error("Could not restore pending request:", restoreError);
      }

      throw new Error(
        `Could not delete the Auth account: ${deleteUserError.message}`,
      );
    }

    // Remove a profile row if it still exists.
    const { error: deleteProfileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (deleteProfileError) {
      console.error(
        "Auth account deleted, but profile cleanup failed:",
        deleteProfileError,
      );

      return jsonResponse({
        success: false,
        error:
          "The Auth account was deleted, but profile cleanup failed. Check Supabase before retrying.",
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: "Account deletion completed successfully.",
      deletedSalonCount: salonIds.length,
    });
  } catch (error) {
    console.error("process-account-deletion failed:", error);

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
        note:
          "Some cleanup steps may already have completed. Check Supabase before retrying.",
      },
      500,
    );
  }
});
