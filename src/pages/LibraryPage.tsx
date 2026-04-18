import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { FilmCard } from '../components/FilmCard'
import { FilmCardSkeleton } from '../components/Skeleton'
import type { Film } from '../types'

const TYPE_FILTERS = [
  { value: undefined,   label: 'Всё' },
  { value: 'movie',     label: 'Фильмы' },
  { value: 'series',    label: 'Сериалы' },
  { value: 'anime',     label: 'Аниме' },
  { value: 'book',      label: 'Книги' },
]

export function LibraryPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Film[] | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const loadFilms = useCallback(async (p: number, type: string | undefined, replace: boolean) => {
    try {
      const data = await api.films.list(p, type) as Film[]
      if (replace) {
        setFilms(data)
      } else {
        setFilms((prev) => [...prev, ...data])
      }
      setHasMore(data.length === 100)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    setSearchResults(null)
    setQuery('')
    loadFilms(1, typeFilter, true).finally(() => setLoading(false))
  }, [typeFilter, loadFilms])

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMore || loadingMore || searchResults !== null) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          setLoadingMore(true)
          loadFilms(nextPage, typeFilter, false).finally(() => setLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, typeFilter, loadFilms, searchResults])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults(null); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await api.films.search(q, typeFilter as 'all' | 'movie' | 'series' | 'anime' | 'book' ?? 'all')
        setSearchResults(results as Film[])
      } finally {
        setSearching(false)
      }
    }, 350)
  }

  const displayFilms = searchResults ?? films

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.3px' }}>
          Каталог
        </h1>

        {/* Поиск */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderRadius: 'var(--r-md)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          marginBottom: 10, padding: '0 12px',
        }}>
          <span style={{ color: 'var(--text-hint)', marginRight: 8, fontSize: 13 }}>◎</span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск по названию..."
            style={{
              flex: 1, padding: '10px 0',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--text)',
            }}
          />
          {searching && <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>...</span>}
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchResults(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)', fontSize: 14, padding: '4px' }}
            >✕</button>
          )}
        </div>

        {/* Фильтр типа */}
        <div style={{ display: 'flex', gap: 5 }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => setTypeFilter(f.value)}
              className="hover-chip"
              style={{
                flex: 1, padding: '5px 0',
                borderRadius: 'var(--r-pill)',
                outline: typeFilter === f.value ? 'none' : '1px solid var(--glass-border)',
                fontSize: 11, fontWeight: 600,
                background: typeFilter === f.value ? 'var(--coral)' : 'var(--glass-bg)',
                border: 'none',
                color: typeFilter === f.value ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              } as React.CSSProperties}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 8 }}>
        {loading && (
          <div className="film-grid">
            <FilmCardSkeleton />
            <FilmCardSkeleton />
            <FilmCardSkeleton />
            <FilmCardSkeleton />
          </div>
        )}

        {!loading && displayFilms.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◈</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              {query ? 'Ничего не найдено' : 'Каталог пуст'}
            </p>
          </div>
        )}

        <div className="film-grid">
          {displayFilms.map((film, i) => (
            <div key={film.id ?? film.title} className="reveal-item" style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
              <FilmCard
                film={film}
                onClick={() => navigate(`/film/${film.id}`)}
              />
            </div>
          ))}
        </div>

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loadingMore && (
          <div className="film-grid">
            <FilmCardSkeleton />
            <FilmCardSkeleton />
          </div>
        )}

        {!loading && !loadingMore && !hasMore && films.length > 0 && searchResults === null && (
          <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12, padding: '24px 0 12px' }}>◌</p>
        )}
      </div>
    </div>
  )
}
