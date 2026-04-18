import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Entry } from '../types'

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
  red:       '#b85c3c',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  display:   '"Unbounded", "Inter", sans-serif',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
}

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

const WORK_TYPE_ICON: Record<string, string> = {
  movie: '🎬', series: '📺', anime: '🎌', book: '📚',
}

// ── Emo chip ───────────────────────────────────────────────────
function Emo({
  w, kind = 'neutral', size = 'md', active, onClick,
}: {
  w: string; kind?: 'before' | 'after' | 'neutral'
  size?: 'sm' | 'md' | 'lg'; active?: boolean; onClick?: () => void
}) {
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
  const pad = size === 'sm' ? '3px 10px' : size === 'lg' ? '7px 14px' : '4px 11px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 14 : 13
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center',
      padding: pad, fontSize: fs, lineHeight: 1.3,
      background: v.bg, color: v.color, border: v.border,
      borderRadius: 3, fontWeight: 500,
      fontFamily: T.sans, cursor: onClick ? 'pointer' : 'default',
      whiteSpace: 'nowrap', userSelect: 'none',
      transition: 'background 0.12s, color 0.12s',
    }}>{w}</span>
  )
}

// ── SideFilters — точно по дизайну ────────────────────────────
const TYPE_FILTERS = [
  { value: 'all',    label: 'все' },
  { value: 'movie',  label: 'фильмы' },
  { value: 'series', label: 'сериалы' },
  { value: 'anime',  label: 'аниме' },
  { value: 'book',   label: 'книги' },
]

const EMO_FILTERS = ['не отпускает', 'взорвал мозг', 'согрел', 'опустошил', 'задумал', 'напугал', 'зарядил']

function SideFilters({ typeFilter, onTypeChange, afterSel, onToggleAfter, total }: {
  typeFilter: string; onTypeChange: (t: string) => void
  afterSel: string[]; onToggleAfter: (w: string) => void
  total: number
}) {
  const sections = [
    {
      title: 'лента',
      items: TYPE_FILTERS.map(f => ({
        l: f.label, n: typeFilter === f.value ? total : undefined,
        active: typeFilter === f.value,
        onClick: () => onTypeChange(f.value),
      })),
    },
    {
      title: 'по эмоции',
      items: EMO_FILTERS.map(w => ({
        l: w, n: undefined,
        active: afterSel.includes(w),
        onClick: () => onToggleAfter(w),
      })),
    },
  ]

  return (
    <aside style={{ paddingTop: 4 }}>
      {sections.map(s => (
        <div key={s.title} style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
            color: T.inkMute, textTransform: 'uppercase', marginBottom: 6,
          }}>{s.title}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {s.items.map(it => (
              <li
                key={it.l}
                onClick={it.onClick}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 8px', fontSize: 13, borderRadius: 3,
                  cursor: 'pointer',
                  color: it.active ? T.ink : T.inkSoft,
                  background: it.active ? T.paperDeep : 'transparent',
                  fontWeight: it.active ? 600 : 400, marginBottom: 1,
                }}
              >
                <span>{it.l}</span>
                {it.n !== undefined && (
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{it.n}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}

// ── DayWidget (авто-слайдер: фильм/сериал/аниме/книга дня) ───────
const SLIDE_TYPES = [
  { value: 'movie',  label: 'фильм дня',  icon: '🎬' },
  { value: 'series', label: 'сериал дня', icon: '📺' },
  { value: 'anime',  label: 'аниме дня',  icon: '🎌' },
  { value: 'book',   label: 'книга дня',  icon: '📚' },
] as const

function DayWidget({ featured }: { featured: Record<string, Entry> }) {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % SLIDE_TYPES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDE_TYPES[idx]
  const entry = featured[slide.value]
  const work  = entry?.work

  const titleLen = work?.title?.length ?? 0
  const titleFs  = titleLen > 20 ? 26 : titleLen > 13 ? 34 : 42

  return (
    <aside style={{ border: `1px solid ${T.ink}`, overflow: 'hidden' }}>

      {/* label + date */}
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${T.ink}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2,
        color: T.inkMute, textTransform: 'uppercase',
      }}>
        <span>⁕ {slide.label}</span>
        <span>{new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
      </div>

      {/* poster block */}
      <div style={{
        background: T.blue, color: T.paper,
        padding: '20px 18px', minHeight: 160, overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -24, right: -24,
          width: 100, height: 100, borderRadius: '50%',
          background: T.red, mixBlendMode: 'multiply', opacity: 0.85,
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
            opacity: 0.65, textTransform: 'uppercase', marginBottom: 10,
          }}>
            {work?.year && `${work.year} · `}{work ? WORK_TYPE_LABEL[work.type] : '—'}
          </div>
          <div style={{
            fontFamily: T.display, fontSize: titleFs, fontWeight: 800,
            lineHeight: 0.92, letterSpacing: -1,
            textTransform: 'uppercase',
          }}>
            {work ? work.title.replace(/\s+/g, '\n').split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            )) : (
              <span style={{ opacity: 0.25 }}>—</span>
            )}
          </div>
        </div>

        {/* dots */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 20,
        }}>
          {SLIDE_TYPES.map((s, i) => (
            <button
              key={s.value}
              onClick={() => setIdx(i)}
              title={s.label}
              style={{
                width: i === idx ? 18 : 6, height: 6,
                borderRadius: 3, border: 'none', padding: 0,
                background: i === idx ? T.paper : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'width 0.25s, background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* emotion + cta */}
      <div style={{ padding: '12px 14px', display: 'grid', gap: 8 }}>
        {entry ? (
          <>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <Emo w={entry.cameWith.slice(0, 14)} kind="before" size="sm" />
              <span style={{ color: T.inkMute, fontSize: 12 }}>→</span>
              <Emo w={entry.leftWith.slice(0, 14)} kind="after" size="sm" />
            </div>
            <button
              onClick={() => navigate(`/work/${entry.workId}`)}
              style={{
                background: T.ink, color: T.paper, border: 'none',
                padding: '9px 12px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: T.sans, borderRadius: 3,
              }}
            >открыть карточку →</button>
          </>
        ) : (
          <p style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, margin: 0 }}>
            записей пока нет
          </p>
        )}
      </div>
    </aside>
  )
}

// ── PortraitWidget ─────────────────────────────────────────────
function PortraitWidget({ entries }: { entries: Entry[] }) {
  const navigate = useNavigate()
  return (
    <div style={{
      border: `1px solid ${T.rule}`, padding: '14px 16px', background: T.paperSoft,
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1.4,
        textTransform: 'uppercase', marginBottom: 12,
      }}>твой портрет — месяц</div>

      {entries.length > 0 ? (
        <>
          {[
            { label: `приходишь — ${entries[0]?.cameWith?.slice(0, 12) ?? 'усталым'}`, v: 62, c: T.red },
            { label: `уносишь — ${entries[0]?.leftWith?.slice(0, 14) ?? 'задумчивость'}`,  v: 48, c: T.blue },
            { label: 'любишь — медленное', v: 71, c: T.ink },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: T.ink, marginBottom: 4,
              }}>
                <span>{r.label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{r.v}%</span>
              </div>
              <div style={{ height: 3, background: T.ruleSoft, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${r.v}%`, background: r.c,
                }} />
              </div>
            </div>
          ))}
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 12, color: T.inkSoft, fontFamily: T.sans,
              borderBottom: `1px dashed ${T.rule}`, paddingBottom: 1, marginTop: 4,
            }}
          >весь портрет →</button>
        </>
      ) : (
        <p style={{ fontSize: 12, color: T.inkMute, lineHeight: 1.5, margin: 0 }}>
          Напиши первый отзыв — и увидишь свой портрет зрителя.
        </p>
      )}
    </div>
  )
}

// ── PostRow ────────────────────────────────────────────────────
const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', padding: 0,
  fontSize: 12, color: 'inherit', cursor: 'pointer', fontFamily: 'inherit',
}

function PostRow({ entry, n, onClick }: { entry: Entry; n: number; onClick: () => void }) {
  const work = entry.work
  const author = entry.user?.firstName ?? 'Аноним'

  return (
    <article onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '36px 1fr 180px', gap: 24,
      padding: '28px 0', borderBottom: `1px solid ${T.ruleSoft}`,
      cursor: 'pointer',
    }}>
      {/* index */}
      <div style={{ paddingTop: 3, textAlign: 'right' }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
          {String(n).padStart(2, '0')}
        </span>
      </div>

      {/* content */}
      <div>
        {/* author row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          fontSize: 12, color: T.inkSoft,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: T.paperDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: T.ink, flexShrink: 0,
          }}>{author[0]?.toUpperCase()}</span>
          <b style={{ color: T.ink }}>{author}</b>
          {work && (
            <span style={{ color: T.inkMute }}>
              · {WORK_TYPE_ICON[work.type] ?? ''} {WORK_TYPE_LABEL[work.type]}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>
            {timeAgo(entry.createdAt)}
          </span>
        </div>

        {/* title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <h3 style={{
            margin: 0, fontFamily: T.display, fontSize: 22, fontWeight: 700,
            letterSpacing: -0.4, color: T.ink, lineHeight: 1.1,
          }}>{work?.title ?? '—'}</h3>
          {work?.year && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{work.year}</span>
          )}
        </div>

        {/* emotion arc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <Emo w={entry.cameWith} kind="before" size="sm" />
          <span style={{ color: T.inkMute, fontSize: 13 }}>→</span>
          <Emo w={entry.leftWith} kind="after" size="sm" />
        </div>

        {/* quote */}
        {entry.atmosphere && (
          <p style={{
            margin: '0 0 10px', fontSize: 14, lineHeight: 1.6, color: T.inkSoft,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>{entry.atmosphere}</p>
        )}

        <button style={{ ...actionBtn, color: T.inkMute }}
          onClick={e => { e.stopPropagation(); onClick() }}>
          читать полностью →
        </button>
      </div>

      {/* poster */}
      <div style={{
        width: '100%', height: 140, background: T.paperDeep,
        border: `1px solid ${T.rule}`, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
      }}>
        {work?.posterUrl ? (
          <img src={work.posterUrl} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <>
            <span style={{
              fontFamily: T.display, fontSize: 11, fontWeight: 700, color: T.inkMute,
              textAlign: 'center', padding: '0 8px', textTransform: 'uppercase', lineHeight: 1.2,
            }}>{work?.title?.slice(0, 12)}</span>
            {work?.year && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                fontFamily: T.mono, fontSize: 9, color: T.inkMute,
              }}>{work.year}</span>
            )}
          </>
        )}
      </div>
    </article>
  )
}

// ── Skeleton ───────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 1fr 160px', gap: 20,
      padding: '28px 0', borderBottom: `1px solid ${T.ruleSoft}`,
    }}>
      <div />
      <div>
        <div style={{ height: 13, borderRadius: 2, background: T.paperDeep, marginBottom: 12, width: '25%' }} />
        <div style={{ height: 22, borderRadius: 2, background: T.paperDeep, marginBottom: 12, width: '50%' }} />
        <div style={{ height: 13, borderRadius: 2, background: T.paperDeep, marginBottom: 8, width: '42%' }} />
        <div style={{ height: 13, borderRadius: 2, background: T.paperDeep, width: '75%' }} />
      </div>
      <div style={{ height: 120, background: T.paperDeep, borderRadius: 2 }} />
    </div>
  )
}

// ── FeedPage ───────────────────────────────────────────────────
export function FeedPage() {
  const [entries, setEntries]         = useState<Entry[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [page, setPage]               = useState(1)
  const [typeFilter, setTypeFilter]   = useState('all')
  const [afterSel, setAfterSel]       = useState<string[]>([])
  const [featuredByType, setFeaturedByType] = useState<Record<string, Entry>>({})
  const navigate    = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadEntries = useCallback(async (p: number, type: string, replace: boolean) => {
    try {
      const data = await api.entries.list(p, type) as Entry[]
      if (replace) setEntries(data)
      else setEntries(prev => [...prev, ...data])
      setHasMore(data.length === 20)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    setLoading(true); setPage(1); setHasMore(true)
    loadEntries(1, typeFilter, true).finally(() => setLoading(false))
  }, [typeFilter, loadEntries])

  // Загружаем по одной записи каждого типа для виджета дня
  useEffect(() => {
    Promise.all(
      (['movie', 'series', 'anime', 'book'] as const).map(async (type) => {
        const data = await api.entries.list(1, type) as Entry[]
        return [type, data[0]] as const
      })
    ).then(pairs => {
      const map: Record<string, Entry> = {}
      pairs.forEach(([type, entry]) => { if (entry) map[type] = entry })
      setFeaturedByType(map)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!hasMore || loadingMore) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const next = page + 1; setPage(next); setLoadingMore(true)
        loadEntries(next, typeFilter, false).finally(() => setLoadingMore(false))
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, typeFilter, loadEntries])

  const toggleAfter = (w: string) =>
    setAfterSel(p => p.includes(w) ? p.filter(x => x !== w) : [...p, w])

  const displayed = entries.filter(e => {
    if (!afterSel.length) return true
    const lw = e.leftWith.toLowerCase()
    return afterSel.some(w => lw.includes(w))
  })

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 40px 80px' }}>

        {/* ── 3-колоночная сетка ──────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 280px',
          gap: 32,
          alignItems: 'start',
        }}>

          {/* ═══ LEFT — SideFilters ═══ */}
          <SideFilters
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            afterSel={afterSel}
            onToggleAfter={toggleAfter}
            total={entries.length}
          />

          {/* ═══ CENTER — Feed ═══ */}
          <div>
            {/* feed header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '28px 0 12px', borderBottom: `1px solid ${T.ink}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <h2 style={{
                  margin: 0, fontFamily: T.display, fontSize: 22, fontWeight: 700,
                  letterSpacing: -0.4, color: T.ink,
                }}>Лента</h2>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
                  {entries.length} {entries.length === 1 ? 'отзыв' : 'отзывов'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: T.inkMute, fontFamily: T.mono }}>
                хронология ↓
              </span>
            </div>

            {loading && <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>}

            {!loading && displayed.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMute, marginBottom: 20 }}>
                  ⁕ записей пока нет
                </p>
                <button onClick={() => navigate('/add')} style={{
                  background: T.ink, color: T.paper, border: 'none',
                  padding: '10px 24px', fontSize: 13, cursor: 'pointer',
                  fontFamily: T.sans, borderRadius: 3,
                }}>Написать первым →</button>
              </div>
            )}

            {displayed.map((entry, i) => (
              <PostRow
                key={entry.id} entry={entry} n={i + 1}
                onClick={() => navigate(`/work/${entry.workId}`)}
              />
            ))}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <><PostSkeleton /><PostSkeleton /></>}

            {!loading && !loadingMore && !hasMore && entries.length > 0 && (
              <div style={{
                textAlign: 'center', padding: '32px 0',
                fontFamily: T.mono, fontSize: 11, color: T.inkMute,
              }}>⁕ конец ленты</div>
            )}
          </div>

          {/* ═══ RIGHT — виджеты ═══ */}
          <div style={{ display: 'grid', gap: 16, position: 'sticky', top: 80 }}>
            <DayWidget featured={featuredByType} />
            <PortraitWidget entries={entries} />
            <div style={{
              padding: '10px 14px', fontFamily: T.mono, fontSize: 10,
              color: T.inkMute, letterSpacing: 1.2, textAlign: 'center',
              borderTop: `1px dashed ${T.rule}`,
            }}>
              ⁕ {entries.length} записей · FeelFilm
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
