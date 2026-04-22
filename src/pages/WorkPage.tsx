import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Work, Entry } from '../types'

const T = {
  paper:     'var(--bg)',
  paperSoft: 'var(--glass-bg)',
  paperDeep: 'var(--bg-deep)',
  ink:       'var(--text)',
  inkSoft:   'var(--text-secondary)',
  inkMute:   'var(--text-hint)',
  rule:      'var(--glass-border)',
  ruleSoft:  'var(--glass-border)',
  red:       'var(--coral)',
  blue:      'var(--teal)',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  display:   '"Unbounded", "Inter", sans-serif',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
}

const TYPE_LABEL: Record<string, string> = {
  movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга',
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

interface WorkDetail extends Work {
  entries: (Entry & { user?: { id: number; firstName: string; username?: string | null } })[]
  myEntry?: Entry | null
  _count: { entries: number }
}

// Агрегирует топ-теги из записей
function topTags(entries: Entry[], field: 'cameWith' | 'leftWith' | 'atmosphere', n = 5): string[] {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    const val = e[field]
    if (!val) continue
    // Значение может быть строкой с запятыми (из миграции) или одним словом
    const tags = val.split(',').map(s => s.trim()).filter(Boolean)
    for (const tag of tags) counts[tag] = (counts[tag] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag)
}

// Красивый fallback для обложки
function PosterFallback({ title, size }: { title: string; size: { w: number; h: number } }) {
  const letter = title[0]?.toUpperCase() ?? '?'
  return (
    <div style={{
      width: size.w, height: size.h, flexShrink: 0,
      background: `linear-gradient(135deg, ${T.paperDeep} 0%, #c9bfa8 100%)`,
      border: `1px solid ${T.rule}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: T.display, fontSize: size.w * 0.55, fontWeight: 800,
        color: T.ink, opacity: 0.15, lineHeight: 1,
        textTransform: 'uppercase', userSelect: 'none',
      }}>{letter}</span>
    </div>
  )
}

function EmotionalPortrait({ entries }: { entries: Entry[] }) {
  const PORTRAIT_MIN = 3
  const count = entries.length

  if (count < PORTRAIT_MIN) {
    return (
      <div style={{
        border: `1px solid ${T.ruleSoft}`,
        padding: '20px 24px',
        background: T.paperSoft,
        marginBottom: 28,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
          color: T.inkMute, textTransform: 'uppercase', marginBottom: 10,
        }}>⁕ эмоциональный портрет</div>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>
          Портрет появится, когда о нём напишут ещё{' '}
          <b>{PORTRAIT_MIN - count} {PORTRAIT_MIN - count === 1 ? 'человек' : 'человека'}</b>.
          Поделись своим опытом первым.
        </p>
      </div>
    )
  }

  const cameWithTags = topTags(entries, 'cameWith')
  const leftWithTags = topTags(entries, 'leftWith')
  const atmosphereTags = topTags(entries, 'atmosphere')

  const sections = [
    { label: 'смотрели в настроении', tags: cameWithTags, color: T.red },
    { label: 'ушли с', tags: leftWithTags, color: T.blue },
    { label: 'атмосфера', tags: atmosphereTags, color: T.inkSoft },
  ].filter(s => s.tags.length > 0)

  return (
    <div style={{
      border: `1px solid ${T.ink}`,
      marginBottom: 28,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${T.rule}`,
        fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
        color: T.inkMute, textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>⁕ эмоциональный портрет</span>
        <span>{count} {count === 1 ? 'запись' : count < 5 ? 'записи' : 'записей'}</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: sections.length === 3 ? '1fr 1fr 1fr' : sections.length === 2 ? '1fr 1fr' : '1fr',
      }}>
        {sections.map((s, i) => (
          <div key={s.label} style={{
            padding: '16px 18px',
            borderRight: i < sections.length - 1 ? `1px solid ${T.ruleSoft}` : 'none',
          }}>
            <div style={{
              fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2,
              color: s.color, textTransform: 'uppercase', marginBottom: 10,
            }}>{s.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {s.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, padding: '4px 10px',
                  border: `1px solid ${s.color}44`,
                  color: s.color, borderRadius: 3,
                  fontFamily: T.sans,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EntryItem({ entry }: { entry: Entry & { user?: { id: number; firstName: string } } }) {
  const author = entry.user?.firstName ?? 'Аноним'
  return (
    <div style={{
      padding: '16px 0',
      borderBottom: `1px solid ${T.ruleSoft}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        fontSize: 12, color: T.inkSoft,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: T.paperDeep,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: T.ink, flexShrink: 0,
        }}>{author[0]?.toUpperCase()}</span>
        <b style={{ color: T.ink }}>{author}</b>
        <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>
          {timeAgo(entry.createdAt)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {entry.cameWith && (
          <>
            <span style={{
              padding: '4px 10px', border: `1px solid ${T.red}44`,
              color: T.red, fontSize: 12, borderRadius: 3,
            }}>{entry.cameWith}</span>
            {entry.leftWith && <span style={{ color: T.inkMute, fontSize: 13 }}>→</span>}
          </>
        )}
        {entry.leftWith && (
          <span style={{
            padding: '4px 10px', border: `1px solid ${T.blue}44`,
            color: T.blue, fontSize: 12, borderRadius: 3,
          }}>{entry.leftWith}</span>
        )}
        {entry.atmosphere && (
          <span style={{
            padding: '4px 10px', border: `1px solid ${T.ruleSoft}`,
            color: T.inkSoft, fontSize: 12, borderRadius: 3,
          }}>{entry.atmosphere}</span>
        )}
      </div>

      {entry.note && (
        <p style={{
          fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: 0,
          fontStyle: 'italic',
        }}>
          «{entry.note}»
        </p>
      )}
    </div>
  )
}

export function WorkPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [work, setWork] = useState<WorkDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!id) return
    api.works.get(parseInt(id))
      .then((data) => setWork(data as WorkDetail))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ height: 200, background: T.paperDeep, marginBottom: 24 }} />
        <div style={{ height: 16, background: T.paperDeep, width: '60%', marginBottom: 12 }} />
        <div style={{ height: 12, background: T.paperDeep, width: '40%' }} />
      </div>
    )
  }

  if (!work) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: T.sans }}>
        <p style={{ color: T.inkSoft, marginBottom: 16 }}>Произведение не найдено</p>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 14 }}
        >← Назад</button>
      </div>
    )
  }

  const desc = work.description ?? ''
  const shortDesc = desc.length > 300 ? desc.slice(0, 300) + '…' : desc
  const showPoster = !!work.posterUrl && !imgError

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans, paddingBottom: 80 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>

        {/* Back */}
        <div style={{ padding: '16px 0 0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: T.inkMute, fontFamily: T.sans,
              padding: 0,
            }}
          >← назад</button>
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          gap: 24, alignItems: 'start',
          padding: '24px 0 28px',
          borderBottom: `1px solid ${T.ink}`,
          marginBottom: 28,
        }}>
          {/* Poster */}
          {showPoster ? (
            <img
              src={work.posterUrl!}
              alt={work.title}
              onError={() => setImgError(true)}
              style={{ width: 120, height: 180, objectFit: 'cover', border: `1px solid ${T.rule}`, display: 'block' }}
            />
          ) : (
            <PosterFallback title={work.title} size={{ w: 120, h: 180 }} />
          )}

          {/* Meta */}
          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
              color: T.inkMute, textTransform: 'uppercase', marginBottom: 8,
              display: 'flex', gap: 12,
            }}>
              <span>{TYPE_LABEL[work.type] ?? work.type}</span>
              {work.year && <span>{work.year}</span>}
            </div>
            <h1 style={{
              fontFamily: T.display, fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: 800, letterSpacing: -0.8,
              margin: '0 0 12px', lineHeight: 1.05, color: T.ink,
            }}>{work.title}</h1>
            {desc && (
              <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: 0 }}>
                {descExpanded ? desc : shortDesc}
                {desc.length > 300 && (
                  <button
                    onClick={() => setDescExpanded(v => !v)}
                    style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 4 }}
                  >
                    {descExpanded ? 'свернуть' : 'ещё'}
                  </button>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            onClick={() => navigate(`/add?workId=${work.id}`)}
            style={{
              background: T.red, color: T.paper,
              border: 'none', padding: '13px 40px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: T.sans, letterSpacing: 0.3,
              maxWidth: 400, width: '100%',
            }}
          >
            {work.myEntry ? 'Добавить ещё запись' : 'Написать о своём опыте →'}
          </button>
        </div>

        {/* ── Emotional Portrait ── */}
        <EmotionalPortrait entries={work.entries ?? []} />

        {/* ── Entries ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          paddingBottom: 14, borderBottom: `1px solid ${T.ink}`, marginBottom: 4,
        }}>
          <h2 style={{ margin: 0, fontFamily: T.display, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            Что пишут
          </h2>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>
            {work._count.entries} {work._count.entries === 1 ? 'запись' : work._count.entries < 5 ? 'записи' : 'записей'}
          </span>
        </div>

        {work.entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T.inkMute, fontFamily: T.mono, fontSize: 12 }}>
            ⁕ записей пока нет
          </div>
        )}

        {work.entries.map(entry => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
