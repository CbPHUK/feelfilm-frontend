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

export type ReactionEmoji = 'same' | 'cry' | 'mindblown' | 'fire' | 'think'

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
  likes: number
  likedByMe: boolean
  reactions?: Partial<Record<ReactionEmoji, number>>
  myReaction?: ReactionEmoji | null
  user?: Pick<User, 'id' | 'username' | 'firstName'>
  film?: Pick<Film, 'id' | 'title' | 'posterUrl' | 'year' | 'type'>
}

export interface UserProfile {
  id: number
  firstName: string
  username: string | null
  reviewCount: number
  reviews: Array<Review & { film: Pick<Film, 'id' | 'title' | 'posterUrl' | 'year' | 'type'> }>
  stats: {
    moodBefore: { tag: string; count: number }[]
    effectAfter: { tag: string; count: number }[]
    atmosphere: { tag: string; count: number }[]
  }
}
