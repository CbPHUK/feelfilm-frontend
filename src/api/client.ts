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

  works: {
    search: (q: string, type: 'all' | 'movie' | 'series' | 'anime' | 'book' = 'all') =>
      request<unknown[]>(`/works/search?q=${encodeURIComponent(q)}&type=${type}`),
    get: (id: number) => request<unknown>(`/works/${id}`),
    create: (data: { title: string; type: string; externalId: string; externalSource: string; year?: number; posterUrl?: string; description?: string }) =>
      request<unknown>('/works', { method: 'POST', body: JSON.stringify(data) }),
  },

  entries: {
    list: (page = 1, type?: string) =>
      request<unknown[]>(`/entries?page=${page}${type && type !== 'all' ? `&type=${type}` : ''}`),
    mine: () => request<unknown[]>('/entries/mine'),
    create: (data: { workId: number; cameWith: string; leftWith: string; atmosphere?: string }) =>
      request<unknown>('/entries', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { cameWith?: string; leftWith?: string; atmosphere?: string }) =>
      request<unknown>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  },

  admin: {
    stats: () => request<{
      totalFilms: number; totalReviews: number; totalUsers: number
      reviewsLast7: number; reviewsLast30: number
      usersLast7: number; usersLast30: number
      taggedFilms: number; userTagged: number; heuristicTagged: number; adminTagged: number
      bannedUsers: number
      activity: { date: string; count: number }[]
    }>('/admin/stats'),

    reviews: (params?: { page?: number; userId?: number; filmId?: number; sortBy?: string }) => {
      const qs = new URLSearchParams()
      if (params?.page)   qs.set('page', String(params.page))
      if (params?.userId) qs.set('userId', String(params.userId))
      if (params?.filmId) qs.set('filmId', String(params.filmId))
      if (params?.sortBy) qs.set('sortBy', params.sortBy)
      return request<{ reviews: unknown[]; total: number; page: number; pages: number }>(`/admin/reviews?${qs}`)
    },
    deleteReview: (reviewId: number) => request<void>(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),

    users: (params?: { page?: number; search?: string; banned?: boolean }) => {
      const qs = new URLSearchParams()
      if (params?.page)   qs.set('page', String(params.page))
      if (params?.search) qs.set('search', params.search)
      if (params?.banned) qs.set('banned', 'true')
      return request<{ users: unknown[]; total: number; page: number; pages: number }>(`/admin/users?${qs}`)
    },
    banUser:   (userId: number, reason?: string) => request<unknown>(`/admin/users/${userId}/ban`,   { method: 'POST', body: JSON.stringify({ reason }) }),
    unbanUser: (userId: number)                  => request<unknown>(`/admin/users/${userId}/unban`, { method: 'POST', body: JSON.stringify({}) }),

    films: (params?: { page?: number; search?: string; type?: string }) => {
      const qs = new URLSearchParams()
      if (params?.page)   qs.set('page', String(params.page))
      if (params?.search) qs.set('search', params.search)
      if (params?.type)   qs.set('type', params.type)
      return request<{ films: unknown[]; total: number; page: number; pages: number }>(`/admin/films?${qs}`)
    },
    updateFilmTags: (filmId: number, tags: { moodBefore?: string[]; effectAfter?: string[]; atmosphere?: string[] }) =>
      request<unknown[]>(`/admin/films/${filmId}/tags`, { method: 'PUT', body: JSON.stringify(tags) }),
    deleteTag: (tagId: number) => request<void>(`/admin/tags/${tagId}`, { method: 'DELETE' }),
  },
}
