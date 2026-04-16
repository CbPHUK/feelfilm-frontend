const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

function getToken(): string | null {
  return localStorage.getItem('ff_token')
}

function getInitData(): string {
  return window.Telegram?.WebApp?.initData || 'dev'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    // Fallback: Telegram initData (для Mini App без JWT)
    headers['X-Telegram-Init-Data'] = getInitData()
    headers['X-Display-Name'] = encodeURIComponent(localStorage.getItem('ff_display_name') ?? 'Аноним')
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw Object.assign(new Error(err.error ?? `HTTP ${res.status}`), err)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; firstName: string }) =>
      request<{ pending: boolean }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    verifyEmail: (data: { email: string; code: string }) =>
      request<{ token: string; user: { id: number; firstName: string; email: string } }>(
        '/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }
      ),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: { id: number; firstName: string; email: string } }>(
        '/auth/login', { method: 'POST', body: JSON.stringify(data) }
      ),

    resendCode: (email: string) =>
      request<{ pending: boolean }>('/auth/resend-code', { method: 'POST', body: JSON.stringify({ email }) }),

    telegram: () =>
      request<{ token: string; user: { id: number; firstName: string } }>(
        '/auth/telegram', { method: 'POST' }
      ),

    telegramWidget: (data: Record<string, unknown>) =>
      request<{ token: string; user: { id: number; firstName: string } }>(
        '/auth/telegram-widget', { method: 'POST', body: JSON.stringify(data) }
      ),
  },

  films: {
    search: (q: string, type: 'all' | 'movie' | 'series' | 'anime' | 'book' = 'all') =>
      request<unknown[]>(`/films/search?q=${encodeURIComponent(q)}&type=${type}`),
    get: (id: number) => request<unknown>(`/films/${id}`),
    list: (page = 1, type?: string) =>
      request<unknown[]>(`/films?page=${page}${type ? `&type=${type}` : ''}`),
    random: (type?: string) =>
      request<unknown>(`/films/random${type ? `?type=${type}` : ''}`),
    create: (data: { title: string; type?: string; year?: number; tmdbId?: number; malId?: number; author?: string; posterUrl?: string; description?: string; genres?: string[] }) =>
      request<unknown>('/films', { method: 'POST', body: JSON.stringify(data) }),
  },

  reviews: {
    create: (data: {
      filmId: number
      moodBefore: string[]
      effectAfter: string[]
      atmosphere: string[]
      viewerType?: string
      personalNote?: string
    }) => request<unknown>('/reviews', { method: 'POST', body: JSON.stringify(data) }),

    search: (params: { moodBefore?: string[]; effectAfter?: string[]; atmosphere?: string[]; page?: number; type?: string }) => {
      const qs = new URLSearchParams()
      if (params.moodBefore?.length) qs.set('moodBefore', params.moodBefore.join(','))
      if (params.effectAfter?.length) qs.set('effectAfter', params.effectAfter.join(','))
      if (params.atmosphere?.length) qs.set('atmosphere', params.atmosphere.join(','))
      if (params.page) qs.set('page', String(params.page))
      if (params.type) qs.set('type', params.type)
      return request<unknown[]>(`/reviews/search?${qs}`)
    },

    delete: (id: number) => request<void>(`/reviews/${id}`, { method: 'DELETE' }),

    like: (id: number) =>
      request<{ likes: number; likedByMe: boolean }>(`/reviews/${id}/like`, { method: 'POST' }),

    unlike: (id: number) =>
      request<{ likes: number; likedByMe: boolean }>(`/reviews/${id}/like`, { method: 'DELETE' }),

    react: (id: number, emoji: string) =>
      request<{ reactions: Record<string, number>; myEmoji: string }>(`/reviews/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),

    unreact: (id: number, emoji: string) =>
      request<{ reactions: Record<string, number>; myEmoji: null }>(`/reviews/${id}/react`, { method: 'DELETE', body: JSON.stringify({ emoji }) }),

    report: (id: number, reason?: string) =>
      request<{ ok: boolean }>(`/reviews/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },

  users: {
    get: (id: number) => request<unknown>(`/users/${id}`),
    me: () => request<unknown>('/users/me'),
  },
}
