import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Entry } from '../types'

// ── Design tokens (matching FeelFilm.html prototype) ──────────
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

// ── helpers ────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 86400 * 2) return 'вчера'
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн. назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const WORK_TYPE_LABEL: Record<string, string> = {
  movie: 'фильм', series: 'сериал', anime: 'аниме', book: 'книга',
}

// ── Emo chip — core atom ───────────────────────────────────────
interface EmoProps {
  w: string
  kind?: 'before' | 'after' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  onClick?: () => void
}
function Emo({ w, kind = 'neutral', size = 'md', active, onClick }: EmoProps) {
  const variants = {
    before:      { bg: 'transparent', color: T.red,   border: `1px solid ${T.red}` },
    after:       { bg: 'transparent', color: T.blue,  border: `1px solid ${T.blue}` },
    neutral:     { bg: 'transparent', color: T.ink,   border: `1px solid ${T.rule}` },
    beforeSolid: { bg: T.red,  color: T.paper, border: `1px solid ${T.red}` },
    afterSolid:  { bg: T.blue, color: T.paper, border: `1px solid ${T.blue}` },
  }
  const v = active
    ? variants[kind === 'before' ? 'beforeSolid' : 'afterSolid']
    : variants[kind]
  const pad = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 12px' : '3px 10px'
  const fs  = size === 'sm' ? 11 : size === 'lg' ? 13 : 12
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: pad, fontSize: fs, lineHeight: 1.2,
        background: v.bg, color: v.color, border: v.border,
        borderRadius: 3, fontWeight: 500, letterSpacing: 0.1,
        fontFamily: T.sans, cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap', userSelect: 'none',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {w}
    </span>
  )
}

// ── MoodSearch ─────────────────────────────────────────────────
const BEFORE_OPTS = ['скука','пустота','грусть','тревога','усталость','одиночество','апатия','злость']
const AFTER_OPTS  = ['согрел','взорвал мозг','не отпускает','рассмешил','задумал','опустошил','зарядил','напугал']

function MoodSearch({
  beforeSel, afterSel, onToggleBefore, onToggleAfter, onSearch,
}: {
  beforeSel: string[]
  afterSel: string[]
  onToggleBefore: (w: string) => void
  onToggleAfter: (w: string) => void
  onSearch: () => void
}) {
  const total = beforeSel.length + afterSel.length
  return (
    <section style={{
      background: T.paperSoft, border: `1px solid ${T.ink}`,
      padding: '20px 24px', position: 'relative',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'start',
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
            color: T.red, textTransform: 'uppercase', marginBottom: 5,
          }}>⁕ основное действие</div>
          <h1 style={{
            fontFamily: T.display, fontSize: 24, fontWeight: 700, margin: 0,
            letterSpacing: -0.5, lineHeight: 1.1, color: T.ink,
          }}>
            Найти фильм<br/>по настроению
          </h1>
          <p style={{ fontSize: 12, color: T.inkSoft, margin: '6px 0 0', maxWidth: 240, lineHeight: 1.5 }}>
            Выбери, <b>с чем пришёл</b> и <b>что хочешь унести</b>.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 10, alignSelf: 'center' }}>
          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1.2,
              textTransform: 'uppercase', marginBottom: 5,
            }}>с чем пришёл →</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {BEFORE_OPTS.map(w => (
                <Emo key={w} w={w} kind="before" size="sm"
                  active={beforeSel.includes(w)}
                  onClick={() => onToggleBefore(w)} />
              ))}
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1.2,
              textTransform: 'uppercase', marginBottom: 5,
            }}>хочу унести →</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {AFTER_OPTS.map(w => (
                <Emo key={w} w={w} kind="after" size="sm"
                  active={afterSel.includes(w)}
                  onClick={() => onToggleAfter(w)} />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onSearch}
          style={{
            background: T.ink, color: T.paper, border: 'none',
            padding: '12px 18px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans, borderRadius: 3,
            alignSelf: 'stretch', minWidth: 160,
          }}
        >
          {total > 0 ? `искать по ${total} эмоциям →` : 'показать всё →'}
        </button>
      </div>
    </section>
  )
}

// ── SideFilters ────────────────────────────────────────────────
const TYPE_FILTERS = [
  { value: 'all',    label: 'все' },
  { value: 'movie',  label: 'фильмы' },
  { value: 'series', label: 'сериалы' },
  { value: 'anime',  label: 'аниме' },
  { value: 'book',   label: 'книги' },
]

function SideFilters({
  typeFilter, onTypeChange, total,
}: {
  typeFilter: string
  onTypeChange: (t: string) => void
  total: number
}) {
  return (
    <aside style={{ paddingRight: 8 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
          color: T.inkMute, textTransform: 'uppercase', marginBottom: 6,
        }}>лента</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {TYPE_FILTERS.map(f => (
            <li
              key={f.value}
              onClick={() => onTypeChange(f.value)}
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 8px', fontSize: 13, borderRadius: 3, cursor: 'pointer',
                color: typeFilter === f.value ? T.ink : T.inkSoft,
                background: typeFilter === f.value ? T.paperDeep : 'transparent',
                fontWeight: typeFilter === f.value ? 600 : 400,
                marginBottom: 1,
              }}
            >
              <span>{f.label}</span>
              {typeFilter === f.value && (
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{total}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
          color: T.inkMute, textTransform: 'uppercase', marginBottom: 6,
        }}>по эмоции</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {['не отпускает','взорвал мозг','согрел','опустошил','задумал'].map(em => (
            <li key={em} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '5px 8px', fontSize: 13, borderRadius: 3, cursor: 'default',
              color: T.inkSoft, marginBottom: 1,
            }}>
              <span>{em}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

// ── PostRow ────────────────────────────────────────────────────
function PostRow({ entry, n, onClick }: { entry: Entry; n: number; onClick: () => void }) {
  const work = entry.work
  const author = entry.user?.firstName ?? 'Аноним'
  const initial = author[0]?.toUpperCase() ?? '?'

  return (
    <article
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '36px 1fr 150px', gap: 16,
        padding: '18px 0', borderBottom: `1px solid ${T.ruleSoft}`,
        cursor: 'pointer',
      }}
    >
      {/* index */}
      <div style={{ textAlign: 'right', paddingTop: 2 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, letterSpacing: 1 }}>
          {String(n).padStart(2, '0')}
        </div>
      </div>

      {/* content */}
      <div>
        {/* author + time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          fontSize: 12, color: T.inkSoft,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: T.paperDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: T.ink, flexShrink: 0,
          }}>{initial}</span>
          <b style={{ color: T.ink, fontWeight: 600 }}>{author}</b>
          {work && (
            <span style={{ color: T.inkMute }}>· {WORK_TYPE_LABEL[work.type] ?? work.type}</span>
          )}
          <span style={{
            marginLeft: 'auto', fontFamily: T.mono, fontSize: 10,
            letterSpacing: 0.8, color: T.inkMute,
          }}>
            {timeAgo(entry.createdAt)}
          </span>
        </div>

        {/* title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <h3 style={{
            margin: 0, fontFamily: T.display, fontSize: 18, fontWeight: 700,
            letterSpacing: -0.3, color: T.ink,
          }}>
            {work?.title ?? '—'}
          </h3>
          {work?.year && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, letterSpacing: 1 }}>
              {work.year}
            </span>
          )}
        </div>

        {/* emotion arc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <Emo w={entry.cameWith} kind="before" size="sm" />
          <span style={{ color: T.inkMute, fontSize: 13 }}>→</span>
          <Emo w={entry.leftWith} kind="after" size="sm" />
        </div>

        {/* atmosphere / quote */}
        {entry.atmosphere && (
          <p style={{
            margin: 0, fontSize: 13, lineHeight: 1.55, color: T.ink, maxWidth: 600,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {entry.atmosphere}
          </p>
        )}

        {/* actions */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 10,
          fontSize: 12, color: T.inkSoft, fontFamily: T.sans,
        }}>
          <button style={actionBtn}>↩ так же чувствовал</button>
          <button style={{ ...actionBtn, marginLeft: 'auto', color: T.inkMute }}
            onClick={(e) => { e.stopPropagation(); onClick() }}>
            читать полностью →
          </button>
        </div>
      </div>

      {/* mini poster */}
      <div style={{
        width: '100%', aspectRatio: '2/3', maxHeight: 110,
        background: T.paperDeep, border: `1px solid ${T.rule}`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {work?.posterUrl ? (
          <img
            src={work.posterUrl} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <span style={{
            fontFamily: T.display, fontSize: 13, fontWeight: 700,
            color: T.ink, opacity: 0.7, textAlign: 'center', lineHeight: 1,
            padding: '0 8px', textTransform: 'uppercase',
          }}>
            {work?.title?.slice(0, 12) ?? '—'}
          </span>
        )}
        {work?.year && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            fontFamily: T.mono, fontSize: 9, color: T.inkMute, letterSpacing: 1,
          }}>{work.year}</span>
        )}
      </div>
    </article>
  )
}

const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', padding: 0,
  fontSize: 12, color: 'inherit', cursor: 'pointer', fontFamily: 'inherit',
}

// ── Skeleton ───────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 1fr 150px', gap: 16,
      padding: '18px 0', borderBottom: `1px solid ${T.ruleSoft}`,
    }}>
      <div />
      <div>
        <div style={{ height: 14, borderRadius: 2, background: T.paperDeep, marginBottom: 10, width: '30%' }} />
        <div style={{ height: 20, borderRadius: 2, background: T.paperDeep, marginBottom: 10, width: '55%' }} />
        <div style={{ height: 12, borderRadius: 2, background: T.paperDeep, marginBottom: 8, width: '45%' }} />
        <div style={{ height: 12, borderRadius: 2, background: T.paperDeep, width: '80%' }} />
      </div>
      <div style={{ background: T.paperDeep, borderRadius: 2, height: 90 }} />
    </div>
  )
}

// ── FeedPage ───────────────────────────────────────────────────
export function FeedPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]     = useState(true)
  const [page, setPage]           = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [beforeSel, setBeforeSel] = useState<string[]>([])
  const [afterSel, setAfterSel]   = useState<string[]>([])
  const navigate = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadEntries = useCallback(async (p: number, type: string, replace: boolean) => {
    try {
      const data = await api.entries.list(p, type) as Entry[]
      if (replace) setEntries(data)
      else setEntries(prev => [...prev, ...data])
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

  useEffect(() => {
    if (!hasMore || loadingMore) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const next = page + 1
        setPage(next)
        setLoadingMore(true)
        loadEntries(next, typeFilter, false).finally(() => setLoadingMore(false))
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, typeFilter, loadEntries])

  const toggleBefore = (w: string) =>
    setBeforeSel(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])
  const toggleAfter = (w: string) =>
    setAfterSel(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])

  const handleSearch = () => navigate('/search')

  // client-side mood filter on top of type filter
  const displayed = entries.filter(e => {
    if (beforeSel.length === 0 && afterSel.length === 0) return true
    const cw = e.cameWith.toLowerCase()
    const lw = e.leftWith.toLowerCase()
    const beforeMatch = beforeSel.length === 0 || beforeSel.some(w => cw.includes(w))
    const afterMatch  = afterSel.length === 0  || afterSel.some(w => lw.includes(w))
    return beforeMatch && afterMatch
  })

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans }}>
      <main style={{
        maxWidth: 1200, margin: '0 auto', padding: '24px 32px 60px',
        display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: 28,
        alignItems: 'start',
      }}>
        {/* LEFT — filters */}
        <SideFilters
          typeFilter={typeFilter}
          onTypeChange={(t) => setTypeFilter(t)}
          total={entries.length}
        />

        {/* CENTER — mood search + feed */}
        <div>
          <MoodSearch
            beforeSel={beforeSel}
            afterSel={afterSel}
            onToggleBefore={toggleBefore}
            onToggleAfter={toggleAfter}
            onSearch={handleSearch}
          />

          {/* feed header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '24px 0 10px', borderBottom: `1px solid ${T.ink}`, marginTop: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{
                margin: 0, fontFamily: T.display, fontSize: 18, fontWeight: 700,
                letterSpacing: -0.3, color: T.ink,
              }}>Лента</h2>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, letterSpacing: 1 }}>
                {entries.length} {entries.length === 1 ? 'запись' : 'записей'}
              </span>
            </div>
            <span style={{ fontSize: 12, color: T.inkMute, fontFamily: T.mono }}>
              хронология ↓
            </span>
          </div>

          {/* loading skeleton */}
          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {/* empty state */}
          {!loading && displayed.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMute, marginBottom: 16 }}>
                ⁕ записей пока нет
              </p>
              <button
                onClick={() => navigate('/add')}
                style={{
                  background: T.ink, color: T.paper, border: 'none',
                  padding: '10px 24px', fontSize: 13, cursor: 'pointer',
                  fontFamily: T.sans, borderRadius: 3,
                }}
              >
                Написать первым →
              </button>
            </div>
          )}

          {/* feed */}
          {displayed.map((entry, i) => (
            <PostRow
              key={entry.id}
              entry={entry}
              n={i + 1}
              onClick={() => navigate(`/work/${entry.workId}`)}
            />
          ))}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {loadingMore && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {!loading && !loadingMore && !hasMore && entries.length > 0 && (
            <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
              ⁕ конец ленты
            </div>
          )}
        </div>

        {/* RIGHT — portrait widget */}
        <div style={{ display: 'grid', gap: 14, position: 'sticky', top: 88 }}>
          {/* User portrait */}
          <div style={{
            border: `1px solid ${T.rule}`, padding: '14px 16px', background: T.paperSoft,
          }}>
            <div style={{
              fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1.4,
              textTransform: 'uppercase', marginBottom: 10,
            }}>твой портрет — лента</div>

            {entries.length > 0 ? (
              <>
                {/* most common cameWith */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 4 }}>
                    чаще всего приходишь с
                  </div>
                  <Emo w={entries[0]?.cameWith?.slice(0, 20) ?? '—'} kind="before" size="sm" />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 4 }}>
                    чаще всего уносишь
                  </div>
                  <Emo w={entries[0]?.leftWith?.slice(0, 20) ?? '—'} kind="after" size="sm" />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: T.inkMute, lineHeight: 1.5 }}>
                Напиши первый отзыв — и увидишь свой портрет зрителя.
              </p>
            )}

            <button
              onClick={() => navigate('/add')}
              style={{
                background: T.ink, color: T.paper, border: 'none',
                padding: '9px 12px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: T.sans, marginTop: 8,
                borderRadius: 3, width: '100%',
              }}
            >
              написать отзыв →
            </button>
          </div>

          {/* Stats footer */}
          <div style={{
            padding: '10px 14px', fontFamily: T.mono, fontSize: 10,
            color: T.inkMute, letterSpacing: 1.2, textAlign: 'center',
            borderTop: `1px dashed ${T.rule}`,
          }}>
            ⁕ {entries.length} записей · FeelFilm
          </div>
        </div>
      </main>
    </div>
  )
}
