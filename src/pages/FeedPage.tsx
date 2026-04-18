import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Entry } from '../types'

const TYPE_FILTERS = [
  { value: 'all',    label: 'Всё' },
  { value: 'movie',  label: 'Фильмы' },
  { value: 'series', label: 'Сериалы' },
  { value: 'anime',  label: 'Аниме' },
  { value: 'book',   label: 'Книги' },
]

const TYPE_ICON: Record<string, string> = {
  movie: '◈', series: '▦', anime: '✦', book: '◉',
}

const TYPE_COLOR: Record<string, string> = {
  movie: 'var(--coral)', series: 'var(--teal)', anime: '#9B7EC8', book: '#5a9e55',
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function EntryCard({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  const work = entry.work
  return (
    <div
      onClick={onClick}
      className="hover-card"
      style={{
        display: 'flex', gap: 14, padding: '16px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow-sm)',
        cursor: 'pointer',
        marginBottom: 10,
      }}
    >
      {/* Постер */}
      {work?.posterUrl ? (
        <img
          src={work.posterUrl} alt=""
          style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: 52, height: 78, borderRadius: 8, flexShrink: 0,
          background: 'var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: work ? TYPE_COLOR[work.type] : 'var(--coral)',
        }}>
          {work ? TYPE_ICON[work.type] : '◈'}
        </div>
      )}

      {/* Содержимое */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Заголовок + тег типа */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
              {work?.title}
            </span>
            {work?.year && (
              <span style={{ fontSize: 12, color: 'var(--text-hint)', marginLeft: 6 }}>{work.year}</span>
            )}
          </div>
          {work && (
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 'var(--r-pill)',
              background: `${TYPE_COLOR[work.type]}22`,
              color: TYPE_COLOR[work.type],
              fontWeight: 600, flexShrink: 0,
              letterSpacing: '0.04em',
            }}>
              {work.type === 'movie' ? 'фильм' : work.type === 'series' ? 'сериал' : work.type === 'anime' ? 'аниме' : 'книга'}
            </span>
          )}
        </div>

        {/* Пользователь + время */}
        <p style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 10 }}>
          {entry.user?.firstName ?? 'Аноним'} · {timeAgo(entry.createdAt)}
        </p>

        {/* Эмоциональный контент */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2, flexShrink: 0 }}>→</span>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {entry.cameWith}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2, flexShrink: 0 }}>←</span>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {entry.leftWith}
            </p>
          </div>
        </div>

        {/* Атмосфера */}
        {entry.atmosphere && (
          <p style={{
            fontSize: 11, fontStyle: 'italic', color: 'var(--text-hint)',
            marginTop: 8, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {entry.atmosphere}
          </p>
        )}
      </div>
    </div>
  )
}

function EntrySkeleton() {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      marginBottom: 10,
    }}>
      <div style={{ width: 52, height: 78, borderRadius: 8, background: 'var(--glass-border)', flexShrink: 0 }} className="skeleton" />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: 4, background: 'var(--glass-border)', marginBottom: 8, width: '60%' }} className="skeleton" />
        <div style={{ height: 10, borderRadius: 4, background: 'var(--glass-border)', marginBottom: 14, width: '30%' }} className="skeleton" />
        <div style={{ height: 12, borderRadius: 4, background: 'var(--glass-border)', marginBottom: 6, width: '90%' }} className="skeleton" />
        <div style={{ height: 12, borderRadius: 4, background: 'var(--glass-border)', width: '75%' }} className="skeleton" />
      </div>
    </div>
  )
}

function ProfileBtn() {
  const navigate = useNavigate()
  const name = localStorage.getItem('ff_display_name') ?? 'Аноним'
  return (
    <button
      onClick={() => navigate('/profile')}
      className="hover-chip"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 12px 5px 5px',
        borderRadius: 'var(--r-pill)',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--coral) 0%, var(--teal) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
      }}>
        {name[0]?.toUpperCase() ?? '?'}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </button>
  )
}

export function FeedPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const touchStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const PULL_THRESHOLD = 64

  const loadEntries = useCallback(async (p: number, type: string, replace: boolean) => {
    try {
      const data = await api.entries.list(p, type) as Entry[]
      if (replace) {
        setEntries(data)
      } else {
        setEntries((prev) => [...prev, ...data])
      }
      setHasMore(data.length === 20)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    loadEntries(1, typeFilter, true).finally(() => setLoading(false))
  }, [typeFilter, loadEntries])

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMore || loadingMore) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          setLoadingMore(true)
          loadEntries(nextPage, typeFilter, false).finally(() => setLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, typeFilter, loadEntries])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setPullDistance(Math.min(delta, PULL_THRESHOLD * 1.5))
  }
  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(0)
      touchStartY.current = 0
      await loadEntries(1, typeFilter, true)
      setPage(1)
      setHasMore(true)
      setRefreshing(false)
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    } else {
      setPullDistance(0)
      touchStartY.current = 0
    }
  }

  return (
    <div
      className="page-enter"
      style={{ paddingBottom: 90 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh */}
      <div className={`ptr-indicator${pullDistance >= PULL_THRESHOLD || refreshing ? ' ptr-active' : ''}`}
        style={{ height: pullDistance >= PULL_THRESHOLD || refreshing ? 48 : Math.max(0, pullDistance * 0.6) }}
      >
        <span style={{
          fontSize: 20, color: 'var(--coral)',
          transform: refreshing ? 'none' : `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)`,
          display: 'inline-block',
          animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
        }}>{refreshing ? '◌' : '↓'}</span>
      </div>

      {/* Шапка */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--coral)' }}>
              FeelFilm
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 1 }}>
              лента ощущений
            </p>
          </div>
          <ProfileBtn />
        </div>

        {/* Фильтр по типу */}
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="hover-chip"
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-pill)', flexShrink: 0,
                fontSize: 12, fontWeight: 600,
                background: typeFilter === f.value ? 'var(--coral)' : 'var(--glass-bg)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: typeFilter === f.value ? 'none' : '1px solid var(--glass-border)',
                color: typeFilter === f.value ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: typeFilter === f.value ? '0 2px 12px rgba(208,112,106,0.28)' : 'none',
                transition: 'all 0.15s',
              } as React.CSSProperties}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        {loading && (
          <>
            <EntrySkeleton />
            <EntrySkeleton />
            <EntrySkeleton />
          </>
        )}

        {!loading && entries.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◈</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Пока нет записей.<br />Будь первым.
            </p>
            <button onClick={() => navigate('/add')} className="hover-btn" style={{
              padding: '12px 32px', borderRadius: 'var(--r-pill)', border: 'none',
              background: 'var(--coral)', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(208,112,106,0.32)',
            }}>
              Написать первым
            </button>
          </div>
        )}

        {entries.map((entry, i) => (
          <div key={entry.id} className="reveal-item" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
            <EntryCard
              entry={entry}
              onClick={() => navigate(`/work/${entry.workId}`)}
            />
          </div>
        ))}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loadingMore && (
          <>
            <EntrySkeleton />
            <EntrySkeleton />
          </>
        )}

        {!loading && !loadingMore && !hasMore && entries.length > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12, padding: '20px 0 12px' }}>◌</p>
        )}
      </div>
    </div>
  )
}
