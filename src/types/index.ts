export interface User {
  id: number
  telegramId: string
  username: string | null
  firstName: string
  lastName: string | null
  reviewCount?: number
}

export interface Film {
  id: number
  title: string
  originalTitle: string | null
  year: number | null
  type: 'movie' | 'series' | 'anime' | 'book'
  tmdbId: number | null
  malId?: number | null
  author?: string | null
  posterUrl: string | null
  description: string | null
  genres: string[]
  _count?: { reviews: number }
  reviews?: Review[]
}

export interface Review {
  id: number
  userId: number
  filmId: number
  moodBefore: string[]
  effectAfter: string[]
  atmosphere: string[]
  viewerType: string | null
  personalNote: string | null
  createdAt: string
  user?: Pick<User, 'id' | 'username' | 'firstName'>
  film?: Film
}
