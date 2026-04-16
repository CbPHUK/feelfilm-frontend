import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface AuthUser {
  id: number
  firstName: string
}

// Ждём пока Telegram WebApp инициализируется (до 2 сек)
function waitForTelegram(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp?.initData) return resolve()
    let attempts = 0
    const interval = setInterval(() => {
      if (window.Telegram?.WebApp?.initData || ++attempts > 20) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const auth = async (attempt = 1): Promise<void> => {
      try {
        // В Telegram Mini App ждём initData перед авторизацией
        if (attempt === 1) await waitForTelegram()

        const u = await api.auth()
        if (!cancelled) { setUser(u); setError(null); setLoading(false) }
      } catch (e) {
        if (cancelled) return
        if (attempt < 3) {
          setTimeout(() => auth(attempt + 1), attempt * 800)
        } else {
          console.error('Auth failed:', e)
          setError('Ошибка авторизации')
          setLoading(false)
        }
      }
    }

    auth()
    return () => { cancelled = true }
  }, [])

  return { user, loading, error }
}
