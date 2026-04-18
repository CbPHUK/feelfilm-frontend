import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Film } from '../types'

// ── Design tokens ──────────────────────────────────────────────
const T = {
  paper:     '#e9e2cf',
  paperSoft: '#efe7d2',
  paperDeep: '#ddd3bb',
  ink:       '#1b1d2a',
  inkSoft:   'rgba(27,29,42,0.62)',
  inkMute:   'rgba(27,29,42,0.45)',
  rule:      'rgba(27,29,42,0.18)',
  ruleSoft:  'rgba(27,29,42,0.10)',
  blue:      '#2b4fc2',
  red:       '#d64026',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  display:   '"Unbounded", "Inter", sans-serif',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
}

const MARQUEE_AUTHORS = [
  'Достоевский', '·', 'Ремарк', '·', 'Толстой', '·', 'Кафка', '·',
  'Оруэлл', '·', 'Гессе', '·', 'Камю', '·', 'Набоков', '·',
  'Булгаков', '·', 'Маркес', '·', 'Мураками', '·', 'Брэдбери', '·',
]

function AuthorMarquee() {
  const doubled = [...MARQUEE_AUTHORS, ...MARQUEE_AUTHORS]
  return (
    <div style={{
      overflow: 'hidden',
      borderTop: `1px solid ${T.rule}`,
      borderBottom: `1px solid ${T.rule}`,
      padding: '8px 0',
      background: T.paperDeep,
    }}>
      <div style={{
        display: 'flex', gap: 0, width: 'max-content',
        animation: 'marquee 32s linear infinite',
      }}>
        {doubled.map((w, i) => (
          <span key={i} style={{
            fontSize: 11, fontWeight: w === '·' ? 400 : 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: w === '·' ? T.inkMute : T.inkSoft,
            padding: '0 12px', whiteSpace: 'nowrap',
            fontFamily: T.mono,
          }}>{w}</span>
        ))}
      </div>
    </div>
  )
}

// ── Book cover card ────────────────────────────────────────────
function BookCard({ book, onClick }: { book: Film; onClick: () => void }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* cover */}
      <div style={{
        width: '100%', aspectRatio: '2/3',
        border: `1px solid ${T.rule}`,
        background: T.paperDeep,
        overflow: 'hidden', position: 'relative',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.ink}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.rule}
      >
        {book.posterUrl && !imgError ? (
          <img
            src={book.posterUrl} alt={book.title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '12px 8px', textAlign: 'center',
            background: T.paperDeep,
          }}>
            <div style={{
              fontFamily: T.display, fontSize: 12, fontWeight: 700,
              color: T.ink, lineHeight: 1.2, textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}>{book.title}</div>
            {book.author && (
              <div style={{
                fontFamily: T.mono, fontSize: 9, color: T.inkMute,
                marginTop: 8, letterSpacing: 1, textTransform: 'uppercase',
              }}>{book.author}</div>
            )}
          </div>
        )}
        {book._count?.reviews !== undefined && book._count.reviews > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: `${T.ink}cc`, padding: '4px 6px',
            fontFamily: T.mono, fontSize: 9, color: T.paper, letterSpacing: 1,
          }}>
            {book._count.reviews} {book._count.reviews === 1 ? 'отзыв' : 'отзывов'}
          </div>
        )}
      </div>

      {/* meta */}
      <div>
        <div style={{
          fontSize: 12, fontWeight: 600, color: T.ink, lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>{book.title}</div>
        {(book.author || book.year) && (
          <div style={{
            fontSize: 11, color: T.inkMute, marginTop: 2,
            fontFamily: T.mono, letterSpacing: 0.5,
          }}>
            {book.author ?? ''}{book.author && book.year ? ' · ' : ''}{book.year ?? ''}
          </div>
        )}
      </div>
    </div>
  )
}

function BookSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', aspectRatio: '2/3', background: T.paperDeep }} />
      <div style={{ height: 12, background: T.paperDeep, borderRadius: 2, width: '80%' }} />
      <div style={{ height: 10, background: T.paperDeep, borderRadius: 2, width: '55%' }} />
    </div>
  )
}

const PAGE_SIZE = 100

export function BooksPage() {
  const [books, setBooks]         = useState<Film[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]     = useState(true)
  const [page, setPage]           = useState(1)
  const [query, setQuery]         = useState('')
  const navigate   = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadBooks = useCallback(async (p: number, replace: boolean) => {
    try {
      const data = await api.films.list(p, 'book') as Film[]
      if (replace) setBooks(data)
      else setBooks(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadBooks(1, true).finally(() => setLoading(false))
  }, [loadBooks])

  useEffect(() => {
    if (!hasMore || loadingMore) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const next = page + 1; setPage(next); setLoadingMore(true)
        loadBooks(next, false).finally(() => setLoadingMore(false))
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, loadBooks])

  const filtered = query.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        (b.author ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : books

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        padding: '48px 48px 40px',
        borderBottom: `1px solid ${T.ink}`,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 40, alignItems: 'end',
        maxWidth: 1440, margin: '0 auto',
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
            color: T.red, textTransform: 'uppercase', marginBottom: 10,
          }}>⁕ книги · каталог</div>
          <h1 style={{
            fontFamily: T.display, fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 800, margin: '0 0 20px', letterSpacing: -2,
            lineHeight: 0.95, color: T.ink,
          }}>
            Читай.<br/>Чувствуй.
          </h1>
          <p style={{
            fontSize: 14, color: T.inkSoft, lineHeight: 1.6,
            maxWidth: 440, margin: '0 0 24px',
          }}>
            Не рейтинги и рецензии — а эмоции. Что ты чувствовал до и после.
            Найди книгу под своё настроение.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: T.mono, fontSize: 11, color: T.inkMute, letterSpacing: 1,
            }}>◉ {books.length} книг</span>
            <span style={{
              fontFamily: T.mono, fontSize: 11, color: T.inkMute, letterSpacing: 1,
            }}>
              ♡ {books.reduce((s, b) => s + (b._count?.reviews ?? 0), 0)} отзывов
            </span>
            <button
              onClick={() => navigate('/add')}
              style={{
                background: T.ink, color: T.paper, border: 'none',
                padding: '9px 18px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: T.sans, borderRadius: 3,
              }}
            >+ написать отзыв на книгу</button>
          </div>
        </div>

        {/* search */}
        <div style={{ minWidth: 260 }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, color: T.inkMute,
            letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
          }}>поиск по каталогу</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="автор или название..."
            style={{
              width: '100%', padding: '10px 14px',
              border: `1px solid ${T.ink}`, background: T.paperSoft,
              fontSize: 13, fontFamily: T.sans, color: T.ink,
              outline: 'none', borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* ── Author marquee ────────────────────────────────────── */}
      <AuthorMarquee />

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '36px 48px 80px' }}>

        {/* grid header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          paddingBottom: 14, borderBottom: `1px solid ${T.ink}`, marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h2 style={{
              margin: 0, fontFamily: T.display, fontSize: 18, fontWeight: 700,
              letterSpacing: -0.3, color: T.ink,
            }}>Каталог</h2>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
              {filtered.length} {filtered.length === 1 ? 'книга' : 'книг'}
            </span>
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: T.inkMute, fontFamily: T.sans,
              }}
            >сбросить ×</button>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '28px 20px',
          }}>
            {Array.from({ length: 15 }).map((_, i) => <BookSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMute, marginBottom: 20 }}>
              ⁕ {query ? 'ничего не найдено' : 'книг пока нет'}
            </p>
            <button onClick={() => navigate('/add')} style={{
              background: T.ink, color: T.paper, border: 'none',
              padding: '10px 24px', fontSize: 13, cursor: 'pointer',
              fontFamily: T.sans, borderRadius: 3,
            }}>Добавить книгу →</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '28px 20px',
          }}>
            {filtered.map(book => (
              <BookCard
                key={book.id} book={book}
                onClick={() => navigate(`/film/${book.id}`)}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loadingMore && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '28px 20px', marginTop: 28,
          }}>
            {Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)}
          </div>
        )}

        {!loading && !loadingMore && !hasMore && books.length > 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            fontFamily: T.mono, fontSize: 11, color: T.inkMute,
          }}>⁕ все книги загружены</div>
        )}
      </div>
    </div>
  )
}
