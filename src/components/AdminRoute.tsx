import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type AdminRouteProps = {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (mounted) {
            setIsAdmin(false)
            setLoading(false)
          }
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Admin check error:', error)

          if (mounted) {
            setIsAdmin(false)
            setLoading(false)
          }

          return
        }

        if (mounted) {
          setIsAdmin(profile?.is_admin === true)
          setLoading(false)
        }
      } catch (error) {
        console.error('Unexpected admin check error:', error)

        if (mounted) {
          setIsAdmin(false)
          setLoading(false)
        }
      }
    }

    checkAdmin()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-[110px]">
        <div className="w-8 h-8 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}