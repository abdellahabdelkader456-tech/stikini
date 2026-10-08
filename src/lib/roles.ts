export type UserRole = 'admin' | 'owner' | 'client'

type ProfileRoleData = {
  type?: string | null
  is_admin?: boolean | null
}

export function getUserRole(profile: ProfileRoleData | null): UserRole {
  if (!profile) {
    return 'client'
  }

  // Admin always has priority over client/owner.
  if (profile.is_admin === true) {
    return 'admin'
  }

  if (profile.type === 'owner') {
    return 'owner'
  }

  return 'client'
}