import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuthModal } from '../contexts/AuthModalContext'
import type { Work, Entry, WatchlistStatus } from '../types'

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

// ── Watchlist helpers ─────────────────────────────────────────────

function statusLabel(status: WatchlistStatus, type: string): string {
  if (status === 'planned') return 'Запланировано'
  if (status === 'in_progress') return type === 'book' ? 'Читаю' : 'Смотрю'
  if (status === 'completed') return type === 'book' ? 'Прочитано' : 'Просмотрено'
  return status
}

const STATUS_OPTIONS: WatchlistStatus[] = ['planned', 'in_progress', 'completed']

// ── Watchlist dropdown button ─────────────────────────────────────

function WatchlistButton({
  workId,
  workType,
  hasExistingEntry,
  onCompleted,
}: {
  workId: number
  workType: string
  hasExistingEntry: boolean
  onCompleted: () => void
}) {
  const { openAuthModal } = useAuthModal()
  const isLoggedIn = !!localStorage.getItem('ff_token')

  const [status, setStatus] = useState<WatchlistStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    api.watchlist.getStatus(workId)
      .then((r) => setStatus((r.status as WatchlistStatus) ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workId, isLoggedIn])

  // Закрываем дропдаун при клике вне компонента
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleToggle = () => {
    if (!isLoggedIn) { openAuthModal(); return }
    setOpen(v => !v)
  }

  const handleSelect = async (s: WatchlistStatus) => {
    setOpen(false)
    if (!isLoggedIn) { openAuthModal(); return }
    setSaving(true)
    const prev = status
    setStatus(s) // optimistic update
    try {
      await api.watchlist.set(workId, s)
      if (s === 'completed' && !hasExistingEntry) onCompleted()
    } catch (e) {
      console.error('watchlist set failed:', e)
      setStatus(prev) // rollback on error
    } finally { setSaving(false) }
  }

  const handleRemove = async () => {
    setOpen(false)
    setSaving(true)
    const prev = status
    setStatus(null) // optimistic update
    try {
      await api.watchlist.remove(workId)
    } catch (e) {
      console.error('watchlist remove failed:', e)
      setStatus(prev) // rollback on error
    } finally { setSaving(false) }
  }

  if (loading) return null

  const btnLabel = status ? statusLabel(status, workType) : '+ Добавить в планы'
  const hasSt = !!status

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Кнопка */}
      <div style={{
        display: 'inline-flex', alignItems: 'stretch',
        border: `1px solid ${hasSt ? T.ink : T.rule}`,
        borderRadius: 3, overflow: 'hidden',
        opacity: saving ? 0.6 : 1,
        fontSize: 13,
      }}>
        <button
          onClick={handleToggle}
          disabled={saving}
          style={{
            padding: '8px 14px',
            background: hasSt ? T.paperDeep : 'transparent',
            border: 'none', cursor: 'pointer',
            color: hasSt ? T.ink : T.inkSoft,
            fontFamily: T.sans, fontSize: 13, fontWeight: hasSt ? 600 : 400,
            lineHeight: 1,
          }}
        >{btnLabel}</button>
        <button
          onClick={handleToggle}
          disabled={saving}
          style={{
            padding: '8px 10px',
            background: hasSt ? T.paperDeep : 'transparent',
            border: 'none',
            borderLeft: `1px solid ${T.rule}`,
            cursor: 'pointer', color: T.inkMute,
            fontSize: 10, lineHeight: 1,
          }}
        >{open ? '▲' : '▾'}</button>
      </div>

      {/* Дропдаун */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          minWidth: 180, zIndex: 100,
          background: T.paperDeep,
          border: `1px solid ${T.ink}`,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px',
                background: s === status ? `${T.ink}18` : 'transparent',
                border: 'none', cursor: 'pointer',
                color: s === status ? T.ink : T.inkSoft,
                fontFamily: T.sans, fontSize: 13,
                fontWeight: s === status ? 600 : 400,
                borderBottom: s !== STATUS_OPTIONS[STATUS_OPTIONS.length - 1] ? `1px solid ${T.rule}22` : 'none',
              }}
            >
              {s === status && <span style={{ marginRight: 6, fontSize: 10 }}>✓</span>}
              {statusLabel(s, workType)}
            </button>
          ))}
          {hasSt && (
            <button
              onClick={handleRemove}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none', borderTop: `1px solid ${T.rule}`,
                cursor: 'pointer',
                color: T.inkMute, fontFamily: T.sans, fontSize: 12,
              }}
            >
              Убрать из списка
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Nudge (подсказка после "Просмотрено") ─────────────────────────

function CompletedNudge({ workId, onDismiss }: { workId: number; onDismiss: () => void }) {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      marginTop: 10,
      padding: '7px 12px',
      border: `1px solid ${T.ruleSoft}`,
      borderRadius: 3,
      background: T.paperSoft,
      fontSize: 12, color: T.inkSoft, fontFamily: T.sans,
    }}>
      <span>Поделись эмоцией от этого</span>
      <button
        onClick={() => navigate(`/add?workId=${workId}`)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.red, fontSize: 12, padding: 0, fontFamily: T.sans,
        }}
      >→</button>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.inkMute, fontSize: 11, padding: '0 0 0 4px',
          lineHeight: 1,
        }}
        title="Закрыть"
      >×</button>
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
  const [showNudge, setShowNudge] = useState(false)

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
              <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
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

            {/* Watchlist button */}
            <WatchlistButton
              workId={work.id}
              workType={work.type}
              hasExistingEntry={!!work.myEntry}
              onCompleted={() => setShowNudge(true)}
            />
            {showNudge && (
              <div style={{ display: 'block', marginTop: 0 }}>
                <CompletedNudge workId={work.id} onDismiss={() => setShowNudge(false)} />
              </div>
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
