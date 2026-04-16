import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { FilmCard } from '../components/FilmCard'
import { FilmCardSkeleton } from '../components/Skeleton'
import { useLang } from '../contexts/LangContext'
import type { Film } from '../types'

const MOOD_PICKS = [
  { label: 'вдохновиться',      effect: 'вдохновил',         icon: '◈', color: 'var(--coral)' },
  { label: 'поплакать',         effect: 'заставил плакать',  icon: '◌', color: '#7fa8c9' },
  { label: 'посмеяться',        effect: 'рассмешил',         icon: '◎', color: '#c4b87a' },
  { label: 'задуматься',        effect: 'задумал',           icon: '◉', color: '#9B7EC8' },
  { label: 'согреться',         effect: 'согрел',            icon: '◆', color: '#c9963c' },
  { label: 'испугаться',        effect: 'напугал',           icon: '▲', color: '#c47a7a' },
]

function MoodPicker({ lang }: { lang: string }) {
  const navigate = useNavigate()
  return (
    <div style={{ margin: '0 16px 16px', padding: '12px 14px', borderRadius: 'var(--r-lg)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-hint)', marginBottom: 10 }}>
        {lang === 'ru' ? 'Что хочется почувствовать?' : 'What do you feel like?'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {MOOD_PICKS.map(({ label, effect, color }) => (
          <button
            key={label}
            onClick={() => navigate(`/search?effect=${encodeURIComponent(effect)}`)}
            className="hover-chip"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              color,
              transition: 'all 0.15s var(--ease-out)',
            } as React.CSSProperties}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

const MARQUEE_WORDS_RU = ['грусть', 'вдохновил', 'тревога', 'согрел', 'пустота', 'взорвал мозг', 'усталость', 'заставил плакать', 'одиночество', 'не отпускает', 'апатия', 'рассмешил', 'злость', 'напугал', 'скука', 'задумал']
const MARQUEE_WORDS_EN = ['sadness', 'inspired', 'anxiety', 'warmed me', 'emptiness', 'mind-blown', 'exhaustion', 'made me cry', 'loneliness', 'can\'t let go', 'apathy', 'made me laugh', 'anger', 'scared me', 'boredom', 'thoughtful']

function Marquee({ lang }: { lang: string }) {
  const words = lang === 'ru' ? MARQUEE_WORDS_RU : MARQUEE_WORDS_EN
  const doubled = [...words, ...words]
  return (
    <div className="marquee-track">
      <div className="marquee-inner">
        {doubled.map((word, i) => (
          <span key={i} className="marquee-item">
            {word}
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  )
}

function SurpriseBtn({ lang }: { lang: string }) {
  const navigate = useNavigate()
  const [spinning, setSpinning] = useState(false)

  const handleSurprise = async () => {
    if (spinning) return
    setSpinning(true)
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium')
    try {
      const film = await api.films.random() as { id: number } | null
      if (film?.id) {
        navigate(`/film/${film.id}`)
      }
    } catch { /* ignore */ } finally {
      setSpinning(false)
    }
  }

  return (
    <button
      onClick={handleSurprise}
      className="hover-btn"
      disabled={spinning}
      style={{
        padding: '10px 20px', borderRadius: 24,
        border: '1.5px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        color: 'var(--text-secondary)',
        fontSize: 13, fontWeight: 700, cursor: spinning ? 'default' : 'pointer', whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        display: 'flex', alignItems: 'center', gap: 6,
      } as React.CSSProperties}
    >
      <span style={{
        display: 'inline-block',
        animation: spinning ? 'spin 0.6s linear infinite' : 'none',
      }}>✦</span>
      {lang === 'ru' ? 'Удиви меня' : 'Surprise me'}
    </button>
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
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </button>
  )
}

const PAGE_SIZE = 100

export function FeedPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const { t, lang } = useLang()

  // Pull-to-refresh
  const touchStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const PULL_THRESHOLD = 64

  const TYPE_FILTERS = [
    { value: undefined,  label: t.all },
    { value: 'movie',    label: t.movies },
    { value: 'series',   label: t.series },
    { value: 'anime',    label: t.anime },
  ]

  const loadFilms = useCallback(async (p: number, type: string | undefined, replace: boolean) => {
    try {
      const data = await api.films.list(p, type) as Film[]
      if (replace) {
        setFilms(data)
      } else {
        setFilms((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Начальная загрузка / смена фильтра
  useEffect(() => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    loadFilms(1, typeFilter, true).finally(() => setLoading(false))
  }, [typeFilter, loadFilms])

  // Infinite scroll — sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMore || loadingMore) return
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
  }, [hasMore, loadingMore, page, typeFilter, loadFilms])

  // Pull-to-refresh handlers
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
      await loadFilms(1, typeFilter, true)
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

      {/* Шапка — компактная */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setTypeFilter(f.value)}
                className="hover-chip"
                style={{
                  padding: '6px 16px', borderRadius: 'var(--r-pill)',
                  fontSize: 12, fontWeight: 600,
                  background: typeFilter === f.value ? 'var(--coral)' : 'var(--glass-bg)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: typeFilter === f.value ? 'none' : '1px solid var(--glass-border)',
                  color: typeFilter === f.value ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: typeFilter === f.value ? '0 2px 12px rgba(208,112,106,0.28)' : 'var(--glass-shadow-sm)',
                  transition: 'all 0.15s',
                } as React.CSSProperties}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ProfileBtn />
        </div>
      </div>

      {/* Editorial hero */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(40px, 7vw, 96px) clamp(20px, 4vw, 56px)', borderBottom: '1px solid var(--glass-border)' }}>
        {/* Dot-паттерн */}
        <div className="dot-bg" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--coral)', marginBottom: 20 }}>
            FeelFilm — {lang === 'ru' ? 'эмоциональный поиск' : 'emotional discovery'}
          </p>
          <h1 style={{
            fontSize: 'clamp(32px, 7.5vw, 120px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            color: 'var(--text)',
            marginBottom: 'clamp(20px, 3vw, 40px)',
          }}>
            {lang === 'ru' ? 'Не оценки. Ощущения.' : 'Not ratings. Feelings.'}
          </h1>
          <p style={{ fontSize: 'clamp(13px, 1.3vw, 16px)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '52ch', marginBottom: 'clamp(20px, 3vw, 36px)' }}>
            {lang === 'ru'
              ? 'Найди фильм под настроение — не по звёздам, а по тому что чувствовали другие.'
              : 'Find a film by mood — not stars, but by what others felt.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {films.length > 0 && (
              <>
                <span className="stat-chip">
                  <span style={{ color: 'var(--coral)' }}>◈</span>
                  {films.length}{lang === 'ru' ? '+ фильмов' : '+ films'}
                </span>
                <span className="stat-chip">
                  <span style={{ color: 'var(--teal)' }}>♥</span>
                  {films.reduce((s, f) => s + (f._count?.reviews ?? 0), 0)}{lang === 'ru' ? ' отзывов' : ' reviews'}
                </span>
                <span className="stat-chip">
                  <span style={{ color: '#9B7EC8' }}>✦</span>
                  {lang === 'ru' ? '16 эмоций' : '16 emotions'}
                </span>
              </>
            )}
            <button onClick={() => navigate('/search')} className="hover-btn" style={{
              padding: '10px 24px', borderRadius: 24, border: 'none',
              background: '#c9963c', color: '#1a1000',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(201,150,60,0.50)',
            }}>
              {lang === 'ru' ? 'Найти по настроению →' : 'Find by mood →'}
            </button>
            <SurpriseBtn lang={lang} />
          </div>
        </div>
      </div>

      {/* Бегущая строка */}
      <Marquee lang={lang} />

      {/* Mood Picker */}
      {!loading && (
        <div style={{ paddingTop: 16 }}>
          <MoodPicker lang={lang} />
        </div>
      )}

      <div style={{ paddingTop: 16 }}>
        {loading && (
          <div className="film-grid">
            <FilmCardSkeleton />
            <FilmCardSkeleton />
            <FilmCardSkeleton />
            <FilmCardSkeleton />
          </div>
        )}

        {!loading && films.length === 0 && (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>◈</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
              {t.noReviews}<br />{t.beFirst}
            </p>
            <button onClick={() => navigate('/add')} className="hover-btn" style={{
              marginTop: 20, padding: '12px 32px', borderRadius: 'var(--r-pill)', border: 'none',
              background: 'var(--coral)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(208,112,106,0.32)',
            }}>{t.shareBtn}</button>
          </div>
        )}

        <div className="film-grid">
          {films.map((film, i) => (
            <div key={film.id} className="reveal-item" style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}>
              <FilmCard film={film} onClick={() => navigate(`/film/${film.id}`)} />
            </div>
          ))}
        </div>

        {/* Sentinel для infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {loadingMore && (
          <div className="film-grid">
            <FilmCardSkeleton />
            <FilmCardSkeleton />
          </div>
        )}

        {!loading && !loadingMore && !hasMore && films.length > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12, padding: '24px 0 12px' }}>◌</p>
        )}
      </div>
    </div>
  )
}
