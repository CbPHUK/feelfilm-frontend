import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { BookCard } from '../components/BookCard'
import { TagPicker } from '../components/TagPicker'
import { MOOD_BEFORE_TAGS, EFFECT_AFTER_TAGS, ATMOSPHERE_TAGS } from '../constants/emotions'
import { useLang, fmtResults } from '../contexts/LangContext'
import { useTheme } from '../contexts/ThemeContext'
import type { Film } from '../types'

const MARQUEE_WORDS = [
  'Достоевский', 'Ремарк', 'Толстой', 'Кафка', 'Оруэлл',
  'Гессе', 'Камю', 'Набоков', 'Булгаков', 'Маркес',
  'Хемингуэй', 'Мураками', 'Брэдбери', 'Толкин', 'Кинг',
]

function BookMarquee({ gold, hint }: { gold: string; hint: string }) {
  const doubled = [...MARQUEE_WORDS, ...MARQUEE_WORDS]
  return (
    <div style={{ overflow: 'hidden', borderTop: `1px solid ${gold}20`, borderBottom: `1px solid ${gold}20`, padding: '10px 0', margin: '0' }}>
      <div style={{
        display: 'flex', gap: 0,
        animation: 'marquee 28s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((word, i) => (
          <span key={i} style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: i % 3 === 0 ? gold : hint,
            padding: '0 20px', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            {word}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: `${gold}60`, display: 'inline-block' }} />
          </span>
        ))}
      </div>
    </div>
  )
}

const PAGE_SIZE = 100

// Скелетон обложки книги
function BookSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        width: '100%', aspectRatio: '2/3', borderRadius: 6,
        background: 'rgba(201,150,60,0.08)', animation: 'pulse 1.4s ease-in-out infinite',
      }} />
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(201,150,60,0.08)', width: '80%' }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(201,150,60,0.06)', width: '55%' }} />
    </div>
  )
}

export function BooksPage() {
  const [books, setBooks] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const [mode, setMode] = useState<'browse' | 'search'>('browse')
  const [moodBefore, setMoodBefore] = useState<string[]>([])
  const [effectAfter, setEffectAfter] = useState<string[]>([])
  const [atmosphere, setAtmosphere] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<Film[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const navigate = useNavigate()
  const { lang } = useLang()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasFilters = moodBefore.length || effectAfter.length || atmosphere.length

  const handleSearch = async () => {
    setSearchLoading(true)
    try {
      const data = await api.reviews.search({ moodBefore, effectAfter, atmosphere, type: 'book' })
      setSearchResults(data as Film[])
    } catch (e) {
      console.error(e)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleReset = () => {
    setMoodBefore([]); setEffectAfter([]); setAtmosphere([])
    setSearchResults(null)
  }

  const loadBooks = useCallback(async (p: number, replace: boolean) => {
    try {
      const data = await api.films.list(p, 'book') as Film[]
      if (replace) setBooks(data)
      else setBooks((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadBooks(1, true).finally(() => setLoading(false))
  }, [loadBooks])

  useEffect(() => {
    if (!hasMore || loadingMore || mode !== 'browse') return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          setLoadingMore(true)
          loadBooks(nextPage, false).finally(() => setLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, loadBooks, mode])

  // Цвета раздела книг
  const BG = isDark ? '#0f0d09' : '#f5f0e6'
  const SURFACE = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const BORDER = isDark ? 'rgba(201,150,60,0.15)' : 'rgba(139,100,30,0.15)'
  const GOLD = '#c9963c'
  const TEXT = isDark ? '#e8d9c0' : '#2a1f0e'
  const HINT = isDark ? '#8a7560' : '#9a8060'
  const HEADER_BG = isDark ? 'rgba(15,13,9,0.88)' : 'rgba(245,240,230,0.88)'

  return (
    <div
      className="page-enter"
      style={{
        paddingBottom: 90,
        background: BG,
        minHeight: '100vh',
      }}
    >
      {/* Шапка */}
      <div style={{
        padding: '16px 20px',
        background: HEADER_BG,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 18, color: HINT }}
          >←</button>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD }}>
              FeelFilm Books
            </span>
          </div>
        </div>
        <button
          onClick={() => { setMode(mode === 'search' ? 'browse' : 'search'); if (mode === 'search') handleReset() }}
          style={{
            padding: '7px 16px', borderRadius: 20, border: `1px solid ${GOLD}`,
            background: mode === 'search' ? GOLD : 'transparent',
            color: mode === 'search' ? '#1a1000' : GOLD,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s', letterSpacing: '0.02em',
          }}
        >
          {mode === 'search'
            ? (lang === 'ru' ? '← Каталог' : '← Browse')
            : (lang === 'ru' ? 'По настроению' : 'By mood')}
        </button>
      </div>

      {/* Hero */}
      <div style={{
        padding: 'clamp(48px,7vw,100px) clamp(24px,4vw,60px)',
        borderBottom: `1px solid ${BORDER}`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Блобы */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}35 0%, transparent 70%)`,
            top: -180, right: -100, filter: 'blur(60px)',
            animation: 'blob1 22s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(80,50,20,0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(201,150,60,0.18) 0%, transparent 70%)',
            bottom: -120, left: -80, filter: 'blur(50px)',
            animation: 'blob2 28s ease-in-out infinite',
          }} />
        </div>
        {/* Фоновая текстура — линейки */}
        <div style={{
          position: 'absolute', inset: 0, opacity: isDark ? 0.025 : 0.05,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, ${GOLD} 28px, ${GOLD} 29px)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: GOLD, marginBottom: 20,
          }}>
            {lang === 'ru' ? 'Эмоциональный поиск' : 'Emotional discovery'}
          </p>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 120px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            color: TEXT,
            marginBottom: 'clamp(20px, 3vw, 40px)',
          }}>
            {lang === 'ru' ? 'Читай.\nЧувствуй.' : 'Read.\nFeel.'}
          </h1>
          <p style={{ fontSize: 15, color: HINT, lineHeight: 1.7, maxWidth: '46ch', marginBottom: 28 }}>
            {lang === 'ru'
              ? 'Не рейтинги и рецензии — а эмоции. Что ты чувствовал до и после. Найди книгу под своё настроение.'
              : 'Not ratings or reviews — emotions. What you felt before and after. Find a book for your mood.'}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {books.length > 0 && (
              <>
                <span style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${BORDER}`,
                  color: HINT, fontWeight: 600, letterSpacing: '0.04em',
                }}>
                  ◉ {books.length}{lang === 'ru' ? ' книг' : ' books'}
                </span>
                <span style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${BORDER}`,
                  color: HINT, fontWeight: 600, letterSpacing: '0.04em',
                }}>
                  ♥ {books.reduce((s, b) => s + (b._count?.reviews ?? 0), 0)}{lang === 'ru' ? ' отзывов' : ' reviews'}
                </span>
              </>
            )}
            <button
              onClick={() => { setMode('search'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                padding: '10px 24px', borderRadius: 24,
                border: 'none',
                background: GOLD,
                color: '#1a1000',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.01em',
                boxShadow: `0 4px 24px ${GOLD}50`,
              }}
            >
              {lang === 'ru' ? 'Найти по настроению →' : 'Find by mood →'}
            </button>
          </div>
        </div>
      </div>

      {/* Бегущая строка */}
      <BookMarquee gold={GOLD} hint={HINT} />

      {/* Поиск по настроению */}
      {mode === 'search' && (
        <div style={{ padding: '24px 20px 0', background: BG }}>
          <p style={{ fontSize: 13, color: HINT, marginBottom: 20, letterSpacing: '0.02em' }}>
            {lang === 'ru' ? 'Выбери ощущения — подберём книги' : 'Pick feelings — we\'ll find books'}
          </p>
          <TagPicker label={lang === 'ru' ? 'Моё настроение' : 'My mood'} tags={MOOD_BEFORE_TAGS} selected={moodBefore} onChange={setMoodBefore} />
          <TagPicker label={lang === 'ru' ? 'Хочу почувствовать' : 'I want to feel'} tags={EFFECT_AFTER_TAGS} selected={effectAfter} onChange={setEffectAfter} />
          <TagPicker label={lang === 'ru' ? 'Атмосфера' : 'Atmosphere'} tags={ATMOSPHERE_TAGS} selected={atmosphere} onChange={setAtmosphere} />
          <button
            onClick={handleSearch}
            disabled={!hasFilters || searchLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: hasFilters ? GOLD : `${GOLD}20`,
              color: hasFilters ? '#1a1000' : HINT,
              fontSize: 15, fontWeight: 700, cursor: hasFilters ? 'pointer' : 'default',
              marginBottom: 28,
              boxShadow: hasFilters ? `0 4px 20px ${GOLD}40` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {searchLoading ? '...' : (lang === 'ru' ? 'Найти книгу' : 'Find a book')}
          </button>

          {searchResults !== null && (
            searchResults.length > 0 ? (
              <>
                <p style={{ fontSize: 11, color: HINT, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 20 }}>
                  {fmtResults(searchResults.length, lang)} — {lang === 'ru' ? 'по совпадению' : 'by relevance'}
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '24px 16px',
                  paddingBottom: 24,
                }}>
                  {searchResults.map((book) => (
                    <BookCard key={book.id} book={book} onClick={() => navigate(`/film/${book.id}`)} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◉</p>
                <p style={{ fontSize: 15, color: HINT, lineHeight: 1.5 }}>
                  {lang === 'ru' ? 'Ничего не нашли — попробуй убрать часть фильтров' : 'Nothing found — try fewer filters'}
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Каталог */}
      {mode === 'browse' && (
        <div style={{ padding: '28px 20px 0' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '24px 16px' }}>
              {Array.from({ length: 12 }).map((_, i) => <BookSkeleton key={i} />)}
            </div>
          ) : books.length === 0 ? (
            <div style={{ padding: '60px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>◉</p>
              <p style={{ color: HINT, fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>
                {lang === 'ru' ? 'Пока нет книг' : 'No books yet'}
              </p>
              <button onClick={() => navigate('/add')} style={{
                padding: '12px 32px', borderRadius: 24, border: 'none',
                background: GOLD, color: '#1a1000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                {lang === 'ru' ? 'Добавить книгу' : 'Add a book'}
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '24px 16px',
            }}>
              {books.map((book, i) => (
                <div
                  key={book.id}
                  className="reveal-item"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}
                >
                  <BookCard book={book} onClick={() => navigate(`/film/${book.id}`)} />
                </div>
              ))}
            </div>
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {loadingMore && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '24px 16px', paddingTop: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)}
            </div>
          )}

          {!loading && !loadingMore && !hasMore && books.length > 0 && (
            <p style={{ textAlign: 'center', color: HINT, fontSize: 12, padding: '24px 0 12px' }}>◉</p>
          )}
        </div>
      )}
    </div>
  )
}
