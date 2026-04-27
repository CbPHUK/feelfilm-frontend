import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Entry } from '../types'

// ── Design tokens ──────────────────────────────────────────────
const T = {
  paper:     'var(--bg)',
  paperSoft: 'var(--glass-bg)',
  paperDeep: 'var(--bg-deep)',
  ink:       'var(--text)',
  inkSoft:   'var(--text-secondary)',
  inkMute:   'var(--text-hint)',
  rule:      'var(--glass-border)',
  ruleSoft:  'var(--glass-border)',
  blue:      'var(--teal)',
  red:       'var(--coral)',
  rose:      'var(--rose)',
  sage:      'var(--sage)',
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

// ── Hero section (desktop only) ────────────────────────────────
function Hero({ animeEntry, entries }: { animeEntry?: Entry; entries: Entry[] }) {
  const navigate = useNavigate()
  const totalByType: Record<string, number> = { movie: 0, series: 0, anime: 0, book: 0 }
  for (const e of entries) {
    if (e.work?.type && e.work.type in totalByType) totalByType[e.work.type]++
  }
  const total = entries.length

  const posterUrl = animeEntry?.work?.posterUrl
  const animeTitle = animeEntry?.work?.title

  const statItems = [
    { label: 'фильмы',   count: totalByType.movie,  color: T.red  },
    { label: 'сериалы',  count: totalByType.series, color: T.blue },
    { label: 'аниме',    count: totalByType.anime,  color: T.rose },
    { label: 'книги',    count: totalByType.book,   color: T.sage },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      minHeight: 260,
      marginBottom: 36,
      border: `1px solid ${T.ink}`,
      overflow: 'hidden',
    }}>
      {/* Left: headline + stats + CTA */}
      <div style={{
        padding: '32px 36px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        gap: 24,
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
            color: T.inkMute, textTransform: 'uppercase', marginBottom: 14,
          }}>журнал зрителя</div>
          <h1 style={{
            margin: '0 0 16px', fontFamily: T.display, fontSize: 44,
            fontWeight: 800, letterSpacing: -2, lineHeight: 0.88, color: T.ink,
          }}>
            FEEL<br />FILM<span style={{ color: T.red }}>.</span>
          </h1>
          <p style={{
            fontSize: 13, color: T.inkSoft, lineHeight: 1.65, margin: 0, maxWidth: 320,
          }}>
            Записывай, с чем приходишь и что уносишь&nbsp;— пусть кино работает.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {statItems.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', border: `1px solid ${T.rule}`,
              borderRadius: 3,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{s.count}</span>
              <span style={{ fontSize: 12, color: T.inkSoft }}>{s.label}</span>
            </div>
          ))}
          {total > 0 && (
            <div style={{
              marginLeft: 4, fontFamily: T.mono, fontSize: 10,
              color: T.inkMute, letterSpacing: 0.5,
            }}>
              · {total} всего
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/add')}
          style={{
            alignSelf: 'flex-start',
            background: T.ink, color: T.paper, border: 'none',
            padding: '10px 22px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans, borderRadius: 3,
            letterSpacing: 0.2,
          }}
        >написать отзыв →</button>
      </div>

      {/* Right: anime art panel */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 260 }}>
        {/* Background gradient (pastel anime sunset) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, var(--teal) 0%, var(--rose) 55%, var(--coral) 100%)',
          opacity: posterUrl ? 0.3 : 1,
        }} />

        {/* CSS art silhouette when no poster */}
        {!posterUrl && (
          <>
            {/* sky stripes */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(119,153,202,0.6) 0%, rgba(196,122,144,0.7) 50%, rgba(212,120,94,0.8) 100%)',
            }} />
            {/* sun circle */}
            <div style={{
              position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,220,120,0.85)',
              boxShadow: '0 0 40px 20px rgba(255,200,80,0.4)',
            }} />
            {/* horizon line */}
            <div style={{
              position: 'absolute', bottom: '38%', left: 0, right: 0,
              height: 1, background: 'rgba(27,29,42,0.25)',
            }} />
            {/* silhouette — city/temple */}
            <div style={{
              position: 'absolute', bottom: '37%', left: '15%',
              width: 18, height: 60, background: 'rgba(27,29,42,0.5)', borderRadius: '2px 2px 0 0',
            }} />
            <div style={{
              position: 'absolute', bottom: '37%', left: '38%',
              width: 28, height: 90, background: 'rgba(27,29,42,0.55)', borderRadius: '2px 2px 0 0',
            }} />
            <div style={{
              position: 'absolute', bottom: '37%', left: '60%',
              width: 20, height: 50, background: 'rgba(27,29,42,0.45)', borderRadius: '2px 2px 0 0',
            }} />
            <div style={{
              position: 'absolute', bottom: '37%', left: '75%',
              width: 40, height: 110, background: 'rgba(27,29,42,0.5)', borderRadius: '2px 2px 0 0',
            }} />
            {/* ground */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
              background: 'rgba(27,29,42,0.45)',
            }} />
            {/* figure silhouette */}
            <div style={{
              position: 'absolute', bottom: '38%', left: '50%', transform: 'translateX(-50%)',
              width: 24, height: 52,
              background: 'rgba(27,29,42,0.7)',
              borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
            }} />
          </>
        )}

        {/* Actual poster */}
        {posterUrl && (
          <img
            src={posterUrl} alt={animeTitle ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        )}

        {/* Overlay text */}
        {animeTitle && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '32px 20px 20px',
            background: 'linear-gradient(to top, rgba(27,29,42,0.75) 0%, transparent 100%)',
          }}>
            <div style={{
              fontFamily: T.mono, fontSize: 9, letterSpacing: 1.5,
              color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 4,
            }}>аниме · в ленте</div>
            <div style={{
              fontFamily: T.display, fontSize: 15, fontWeight: 700,
              color: '#fff', lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>{animeTitle}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DonutChart widget ──────────────────────────────────────────
function DonutChart({ entries }: { entries: Entry[] }) {
  const COLORS: Record<string, string> = {
    movie: T.red, series: T.blue, anime: T.rose, book: T.sage,
  }
  const TYPES = ['movie', 'series', 'anime', 'book'] as const
  const counts = TYPES.map(type => ({
    type,
    count: entries.filter(e => e.work?.type === type).length,
    label: WORK_TYPE_LABEL[type],
    color: COLORS[type],
  })).filter(c => c.count > 0)

  const total = counts.reduce((s, c) => s + c.count, 0)

  const R = 34, r = 21, cx = 42, cy = 42
  let cumAngle = -Math.PI / 2
  type Seg = { type: string; count: number; label: string; color: string; d: string }
  const segments: Seg[] = counts.map(c => {
    const angle = (c.count / total) * 2 * Math.PI
    const gap = total === 1 ? 0 : 0.04
    const a0 = cumAngle + gap
    const a1 = cumAngle + angle - gap
    cumAngle += angle
    const x1 = cx + R * Math.cos(a0)
    const y1 = cy + R * Math.sin(a0)
    const x2 = cx + R * Math.cos(a1)
    const y2 = cy + R * Math.sin(a1)
    const xi1 = cx + r * Math.cos(a0)
    const yi1 = cy + r * Math.sin(a0)
    const xi2 = cx + r * Math.cos(a1)
    const yi2 = cy + r * Math.sin(a1)
    const large = angle > Math.PI ? 1 : 0
    return {
      ...c,
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`,
    }
  })

  return (
    <div style={{
      border: `1px solid ${T.rule}`, padding: '14px 16px', background: T.paperSoft,
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, color: T.inkMute,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14,
      }}>что смотришь</div>

      {total === 0 ? (
        <p style={{ fontSize: 12, color: T.inkMute, lineHeight: 1.5, margin: 0 }}>
          Напиши первый отзыв — и увидишь свой портрет зрителя.
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
            {segments.map(s => (
              <path key={s.type} d={s.d} fill={s.color} />
            ))}
            {/* inner hole */}
            <circle cx={cx} cy={cy} r={r - 1} fill="var(--glass-bg)" />
            {/* total number */}
            <text
              x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              style={{
                fontSize: 13, fontWeight: 800,
                fill: 'var(--text)', fontFamily: '"Unbounded","Inter",sans-serif',
              }}
            >{total}</text>
          </svg>

          <div style={{ flex: 1 }}>
            {counts.map(c => (
              <div key={c.type} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: c.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: T.ink, flex: 1 }}>{c.label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  const longestWord = (work?.title ?? '').split(/\s+/).reduce((a, b) => a.length > b.length ? a : b, '')
  const titleFs = longestWord.length > 10 ? 18 : longestWord.length > 7 ? 22 : longestWord.length > 5 ? 26 : 32

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
        padding: '20px 18px 42px', minHeight: 160, overflow: 'hidden',
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
            wordBreak: 'break-word', overflowWrap: 'break-word',
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
          position: 'absolute', bottom: 14, left: 18,
          display: 'flex', gap: 6,
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

// ── PostRow ────────────────────────────────────────────────────
const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', padding: 0,
  fontSize: 12, color: 'inherit', cursor: 'pointer', fontFamily: 'inherit',
}

const PostRow = memo(function PostRow({ entry, n, onClick, mobile = false }: {
  entry: Entry; n: number; onClick: () => void; mobile?: boolean
}) {
  const work = entry.work
  const author = entry.user?.firstName ?? 'Аноним'

  const posterW = mobile ? 80 : 180
  const posterH = mobile ? 110 : 140
  const titleFs = mobile ? 18 : 22

  return (
    <article onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: mobile ? `1fr ${posterW}px` : `36px 1fr ${posterW}px`,
      gap: mobile ? 12 : 24,
      padding: mobile ? '16px 0' : '28px 0',
      borderBottom: `1px solid ${T.ruleSoft}`,
      cursor: 'pointer',
    }}>
      {/* index — только на десктопе */}
      {!mobile && (
        <div className="post-row-num" style={{ paddingTop: 3, textAlign: 'right' }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
            {String(n).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* content */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* author row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
          fontSize: 12, color: T.inkSoft, flexWrap: 'nowrap', overflow: 'hidden',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%', background: T.paperDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: T.ink, flexShrink: 0,
          }}>{author[0]?.toUpperCase()}</span>
          <b style={{ color: T.ink, flexShrink: 0 }}>{author}</b>
          {work && (
            <span style={{ color: T.inkMute, flexShrink: 0 }}>
              · {WORK_TYPE_LABEL[work.type]}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.inkMute, flexShrink: 0 }}>
            {timeAgo(entry.createdAt)}
          </span>
        </div>

        {/* title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <h3 style={{
            margin: 0, fontFamily: T.display, fontSize: titleFs, fontWeight: 700,
            letterSpacing: -0.3, color: T.ink, lineHeight: 1.1,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>{work?.title ?? '—'}</h3>
          {!mobile && work?.year && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute, flexShrink: 0 }}>{work.year}</span>
          )}
        </div>

        {/* emotion arc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {entry.cameWith && <Emo w={entry.cameWith} kind="before" size="sm" />}
          {entry.cameWith && entry.leftWith && <span style={{ color: T.inkMute, fontSize: 12 }}>→</span>}
          {entry.leftWith && <Emo w={entry.leftWith} kind="after" size="sm" />}
          {entry.atmosphere && entry.atmosphere.length <= 24 && (
            <Emo w={entry.atmosphere} kind="neutral" size="sm" />
          )}
        </div>

        {/* note — только десктоп */}
        {!mobile && entry.note && (
          <p style={{
            margin: '6px 0 10px', fontSize: 14, lineHeight: 1.6, color: T.inkSoft,
            overflow: 'hidden', maxHeight: '3.2em',
            width: '100%',
          }}>{entry.note}</p>
        )}

        {!mobile && (
          <button style={{ ...actionBtn, color: T.inkMute }}
            onClick={e => { e.stopPropagation(); onClick() }}>
            читать полностью →
          </button>
        )}
      </div>

      {/* poster */}
      <div style={{
        width: '100%', height: posterH, background: T.paperDeep,
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
              fontFamily: T.display, fontSize: mobile ? 36 : 56, fontWeight: 800,
              color: T.rule, textTransform: 'uppercase', lineHeight: 1,
              userSelect: 'none',
            }}>{work?.title?.[0] ?? '?'}</span>
            {work && (
              <span style={{
                position: 'absolute', bottom: 6, left: 0, right: 0,
                textAlign: 'center',
                fontFamily: T.mono, fontSize: 8, letterSpacing: 1,
                color: T.inkMute, textTransform: 'uppercase',
              }}>{WORK_TYPE_LABEL[work.type]}</span>
            )}
          </>
        )}
      </div>
    </article>
  )
})

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

// ── Type filter pills (inline, shared desktop+mobile) ─────────
const TYPE_FILTERS = [
  { value: 'all',    label: 'все' },
  { value: 'movie',  label: 'фильмы' },
  { value: 'series', label: 'сериалы' },
  { value: 'anime',  label: 'аниме' },
  { value: 'book',   label: 'книги' },
]

// ── FeedPage ───────────────────────────────────────────────────
export function FeedPage() {
  const [entries, setEntries]         = useState<Entry[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [page, setPage]               = useState(1)
  const [typeFilter, setTypeFilter]   = useState('all')
  const [featuredByType, setFeaturedByType] = useState<Record<string, Entry>>({})
  const navigate    = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isMobile    = useIsMobile()

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

  const displayed = useMemo(() => entries, [entries])

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans }}>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '0 16px 80px' : '28px 40px 80px' }}>

        {/* ── Hero (только десктоп) ── */}
        {!isMobile && (
          <Hero
            animeEntry={featuredByType['anime']}
            entries={entries}
          />
        )}

        {/* ── Горизонтальные фильтры (всегда — mobile strip сверху, desktop — в header ленты) ── */}
        {isMobile && (
          <div className="mobile-type-strip">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                style={{
                  padding: '7px 16px', whiteSpace: 'nowrap', flexShrink: 0,
                  border: `1px solid ${typeFilter === f.value ? T.ink : T.rule}`,
                  background: typeFilter === f.value ? T.ink : 'transparent',
                  color: typeFilter === f.value ? T.paper : T.inkSoft,
                  fontSize: 13, fontWeight: typeFilter === f.value ? 600 : 400,
                  cursor: 'pointer', borderRadius: 3, fontFamily: T.sans,
                }}
              >{f.label}</button>
            ))}
          </div>
        )}

        {/* ── 2-колоночная сетка (десктоп) / 1 колонка (мобиле) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: isMobile ? 0 : 36,
          alignItems: 'start',
        }}>

          {/* ═══ LEFT — Feed ═══ */}
          <div>
            {/* feed header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: isMobile ? '16px 0 10px' : '0 0 14px',
              borderBottom: `1px solid ${T.ink}`,
              flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <h2 style={{
                  margin: 0, fontFamily: T.display, fontSize: isMobile ? 18 : 20,
                  fontWeight: 700, letterSpacing: -0.4, color: T.ink,
                }}>Лента</h2>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
                  {entries.length} {entries.length === 1 ? 'отзыв' : 'отзывов'}
                </span>
              </div>

              {/* Type filter pills — desktop inline */}
              {!isMobile && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {TYPE_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setTypeFilter(f.value)}
                      style={{
                        padding: '5px 14px',
                        border: `1px solid ${typeFilter === f.value ? T.ink : T.rule}`,
                        background: typeFilter === f.value ? T.ink : 'transparent',
                        color: typeFilter === f.value ? T.paper : T.inkSoft,
                        fontSize: 12, fontWeight: typeFilter === f.value ? 600 : 400,
                        cursor: 'pointer', borderRadius: 3, fontFamily: T.sans,
                        whiteSpace: 'nowrap',
                        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                      }}
                    >{f.label}</button>
                  ))}
                </div>
              )}
            </div>

            {loading && <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>}

            {!loading && displayed.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMute, marginBottom: 20 }}>
                  ⁕ записей пока нет
                </p>
                <button onClick={() => navigate('/add')} style={{
                  background: T.ink, color: T.paper, border: 'none',
                  padding: '12px 28px', fontSize: 14, cursor: 'pointer',
                  fontFamily: T.sans, borderRadius: 3,
                }}>Написать первым →</button>
              </div>
            )}

            {!loading && displayed.map((entry, i) => (
              <PostRow
                key={entry.id} entry={entry} n={i + 1}
                mobile={isMobile}
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

          {/* ═══ RIGHT — виджеты (только десктоп) ═══ */}
          {!isMobile && (
            <div className="feed-col-right" style={{ display: 'grid', gap: 16, position: 'sticky', top: 80 }}>
              <DayWidget featured={featuredByType} />
              <DonutChart entries={entries} />
              <div style={{
                padding: '10px 14px', fontFamily: T.mono, fontSize: 10,
                color: T.inkMute, letterSpacing: 1.2, textAlign: 'center',
                borderTop: `1px dashed ${T.rule}`,
              }}>
                ⁕ {entries.length} записей · FeelFilm
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
