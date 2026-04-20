import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface AuthUser {
  id: number
  firstName: string
  email?: string | null
  isAdmin?: boolean
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('ff_token')
    if (!token) {
      setLoading(false)
      return
    }

    api.users.me()
      .then((u) => {
        const profile = u as AuthUser
        setUser({ id: profile.id, firstName: profile.firstName, email: profile.email, isAdmin: profile.isAdmin })
        setError(null)
      })
      .catch(() => {
        localStorage.removeItem('ff_token')
        localStorage.removeItem('ff_onboarded')
        setError('Сессия истекла')
      })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading, error }
}
