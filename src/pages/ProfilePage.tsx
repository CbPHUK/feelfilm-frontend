import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../contexts/LangContext'
import { useToast } from '../contexts/ToastContext'
import { VIEWER_TYPE_SYMBOL } from '../constants/viewerTypes'
import type { UserProfile, WatchlistItem, WatchlistStatus } from '../types'

const TYPE_ICON: Record<string, string> = { movie: '◈', series: '▦', anime: '✦', book: '◉' }
const TYPE_LABEL: Record<string, string> = { movie: 'фильм', series: 'сериал', anime: 'аниме', book: 'книга' }

// ── Компактная карточка записи ────────────────────────────────────
function EntryCard({ entry, onClick }: {
  entry: UserProfile['entries'][0]
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="hover-card"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', marginBottom: 6,
        borderRadius: 'var(--r-md)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
      }}
    >
      {entry.work?.posterUrl ? (
        <img src={entry.work.posterUrl} alt="" style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 28, height: 42, borderRadius: 3, flexShrink: 0,
          background: 'var(--coral-muted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--coral)',
        }}>{TYPE_ICON[entry.work?.type ?? 'movie']}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>{entry.work?.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 500 }}>
            {entry.cameWith}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>→</span>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, background: 'var(--teal-muted)', color: 'var(--teal)', fontWeight: 500 }}>
            {entry.leftWith}
          </span>
          {entry.atmosphere && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, border: '1px solid var(--glass-border)', color: 'var(--text-hint)' }}>
              {entry.atmosphere}
            </span>
          )}
        </div>
        {entry.note && (
          <p style={{ fontSize: 11, color: 'var(--text-hint)', margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            «{entry.note}»
          </p>
        )}
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-hint)', flexShrink: 0 }}>
        {new Date(entry.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  )
}

// ── Компактная карточка ревью ─────────────────────────────────────
function ReviewCard({ review, onDelete, deleting, onClick }: {
  review: UserProfile['reviews'][0]
  onDelete: (e: React.MouseEvent) => void
  deleting: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="hover-card"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', marginBottom: 6,
        borderRadius: 'var(--r-md)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
      }}
    >
      {review.film?.posterUrl ? (
        <img src={review.film.posterUrl} alt="" style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 28, height: 42, borderRadius: 3, flexShrink: 0,
          background: 'var(--coral-muted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--coral)',
        }}>{TYPE_ICON[review.film?.type ?? 'movie']}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>{review.film?.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
          {review.moodBefore.slice(0, 1).map(tag => (
            <span key={tag} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 500 }}>{tag}</span>
          ))}
          {review.moodBefore.length > 0 && review.effectAfter.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>→</span>
          )}
          {review.effectAfter.slice(0, 1).map(tag => (
            <span key={tag} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, background: 'var(--teal-muted)', color: 'var(--teal)', fontWeight: 500 }}>{tag}</span>
          ))}
          {review.viewerType && (
            <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>· {VIEWER_TYPE_SYMBOL[review.viewerType] ?? ''} {review.viewerType}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-hint)', opacity: deleting ? 0.3 : 0.5,
            padding: '1px 2px',
          }}
        >✕</button>
      </div>
    </div>
  )
}

// ── Блок анализа ──────────────────────────────────────────────────
function MoodAnalysis({ profile }: { profile: UserProfile }) {
  const allEntries = profile.entries ?? []
  const allReviews = profile.reviews ?? []
  const total = allEntries.length + allReviews.length

  const analysis = useMemo(() => {
    // Частота тегов из entries
    const cameCount: Record<string, number> = {}
    const leftCount: Record<string, number> = {}
    const pairCount: Record<string, number> = {}
    const typeCount: Record<string, number> = {}

    for (const e of allEntries) {
      cameCount[e.cameWith] = (cameCount[e.cameWith] ?? 0) + 1
      leftCount[e.leftWith] = (leftCount[e.leftWith] ?? 0) + 1
      const pair = `${e.cameWith} → ${e.leftWith}`
      pairCount[pair] = (pairCount[pair] ?? 0) + 1
      if (e.work?.type) typeCount[e.work.type] = (typeCount[e.work.type] ?? 0) + 1
    }

    // Дополняем из reviews
    for (const r of allReviews) {
      for (const tag of r.moodBefore) cameCount[tag] = (cameCount[tag] ?? 0) + 1
      for (const tag of r.effectAfter) leftCount[tag] = (leftCount[tag] ?? 0) + 1
      if (r.film?.type) typeCount[r.film.type] = (typeCount[r.film.type] ?? 0) + 1
    }

    const topCame = Object.entries(cameCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topLeft = Object.entries(leftCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topPair = Object.entries(pairCount).sort((a, b) => b[1] - a[1])[0]
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]

    // Позитивные теги (результат)
    const positiveLeft = ['вдохновил', 'согрел', 'рассмешил', 'зарядил энергией', 'удивил', 'успокоил']
    const heavyLeft = ['опустошил', 'заставил плакать', 'напугал', 'не отпускает']
    const posCount = Object.entries(leftCount).filter(([t]) => positiveLeft.includes(t)).reduce((s, [, n]) => s + n, 0)
    const heavyCount = Object.entries(leftCount).filter(([t]) => heavyLeft.includes(t)).reduce((s, [, n]) => s + n, 0)
    const totalLeft = Object.values(leftCount).reduce((s, n) => s + n, 0)
    const posRatio = totalLeft > 0 ? posCount / totalLeft : 0

    return { topCame, topLeft, topPair, topType, posRatio, totalLeft }
  }, [allEntries, allReviews])

  if (total === 0) return null

  const insight = analysis.posRatio > 0.6
    ? 'Кино чаще оставляет тебя с лёгким чувством — ты умеешь выбирать под настроение.'
    : analysis.posRatio > 0.35
    ? 'Ты смотришь разное — и тяжёлое, и вдохновляющее. Честный зритель.'
    : analysis.totalLeft > 0
    ? 'Ты не боишься сложного кино. Оно оставляет след — и это хорошо.'
    : null

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-lg)',
      padding: '16px', marginBottom: 16,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
        Анализ настроений
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {/* Пришёл с */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Чаще приходишь с</p>
          {analysis.topCame.map(([tag, n]) => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.round((n / (analysis.topCame[0]?.[1] ?? 1)) * 100)}%`,
                  background: 'var(--coral)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 70 }}>{tag}</span>
              <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Ушёл с */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Чаще уходишь с</p>
          {analysis.topLeft.map(([tag, n]) => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.round((n / (analysis.topLeft[0]?.[1] ?? 1)) * 100)}%`,
                  background: 'var(--teal)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 70 }}>{tag}</span>
              <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Любимая трансформация + тип */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: insight ? 12 : 0 }}>
        {analysis.topPair && (
          <div style={{
            flex: 1, minWidth: 160,
            padding: '8px 10px', borderRadius: 'var(--r-sm)',
            background: 'var(--coral-muted)', border: '1px solid var(--coral-light)',
          }}>
            <p style={{ fontSize: 9, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Типичная трансформация</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{analysis.topPair[0]}</p>
            <p style={{ fontSize: 10, color: 'var(--text-hint)' }}>{analysis.topPair[1]}× </p>
          </div>
        )}
        {analysis.topType && (
          <div style={{
            flex: 1, minWidth: 120,
            padding: '8px 10px', borderRadius: 'var(--r-sm)',
            background: 'var(--teal-muted)', border: '1px solid var(--teal-light)',
          }}>
            <p style={{ fontSize: 9, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Смотришь чаще всего</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{TYPE_ICON[analysis.topType[0]]} {TYPE_LABEL[analysis.topType[0]] ?? analysis.topType[0]}</p>
            <p style={{ fontSize: 10, color: 'var(--text-hint)' }}>{analysis.topType[1]} записей</p>
          </div>
        )}
      </div>

      {/* Инсайт */}
      {insight && (
        <p style={{
          fontSize: 12, fontStyle: 'italic',
          color: 'var(--text-secondary)', lineHeight: 1.5,
          borderTop: '1px solid var(--glass-border)', paddingTop: 10,
        }}>
          {insight}
        </p>
      )}
    </div>
  )
}

// ── Watchlist helpers ─────────────────────────────────────────────

function wStatusLabel(status: WatchlistStatus, type: string): string {
  if (status === 'planned') return 'Запланировано'
  if (status === 'in_progress') return type === 'book' ? 'Читаю' : 'Смотрю'
  if (status === 'completed') return type === 'book' ? 'Прочитано' : 'Просмотрено'
  return status
}

const W_TABS: { status: WatchlistStatus; label: string }[] = [
  { status: 'planned',     label: 'Запланировано' },
  { status: 'in_progress', label: 'Смотрю / Читаю' },
  { status: 'completed',   label: 'Просмотрено / Прочитано' },
]

const EMPTY_HINTS: Record<WatchlistStatus, string> = {
  planned:     'Здесь будут произведения, которые ты планируешь посмотреть или прочитать',
  in_progress: 'Здесь будут произведения, которые ты сейчас смотришь или читаешь',
  completed:   'Здесь будут произведения, которые ты уже посмотрел или прочитал',
}

// ── Карточка в списке ─────────────────────────────────────────────

function WatchlistCard({
  item,
  onStatusChange,
  onRemove,
  onClick,
}: {
  item: WatchlistItem
  onStatusChange: (status: WatchlistStatus) => void
  onRemove: () => void
  onClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={onClick}
        className="hover-card"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 6,
          borderRadius: 'var(--r-md)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
        }}
      >
        {item.work.posterUrl ? (
          <img src={item.work.posterUrl} alt="" style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 28, height: 42, borderRadius: 3, flexShrink: 0,
            background: 'var(--coral-muted)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--coral)',
          }}>{TYPE_ICON[item.work.type ?? 'movie']}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{item.work.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>
              {TYPE_ICON[item.work.type]} {TYPE_LABEL[item.work.type]}
              {item.work.year ? ` · ${item.work.year}` : ''}
            </span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 3,
              background: 'var(--glass-border)', color: 'var(--text-hint)',
            }}>
              {wStatusLabel(item.status, item.work.type)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>
            {new Date(item.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--text-hint)', padding: '1px 2px', lineHeight: 1,
            }}
            title="Действия"
          >⋯</button>
        </div>
      </div>

      {/* Мини-меню */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 100,
            background: 'var(--bg-deep, var(--bg))',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 160, overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(['planned', 'in_progress', 'completed'] as WatchlistStatus[]).filter(s => s !== item.status).map((s) => (
            <button
              key={s}
              onClick={() => { setMenuOpen(false); onStatusChange(s) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'var(--text-secondary)',
                fontSize: 12, fontFamily: 'inherit',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >{wStatusLabel(s, item.work.type)}</button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onRemove() }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 14px',
              background: 'transparent', border: 'none',
              cursor: 'pointer', color: 'var(--text-hint)',
              fontSize: 12, fontFamily: 'inherit',
            }}
          >Убрать из списка</button>
        </div>
      )}
    </div>
  )
}

// ── Секция "Мои списки" ───────────────────────────────────────────

function WatchlistSection() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<WatchlistStatus>('planned')

  useEffect(() => {
    api.watchlist.list()
      .then((data) => setItems(data as WatchlistItem[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (item: WatchlistItem, newStatus: WatchlistStatus) => {
    try {
      await api.watchlist.set(item.workId, newStatus)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
    } catch {}
  }

  const handleRemove = async (item: WatchlistItem) => {
    try {
      await api.watchlist.remove(item.workId)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch {}
  }

  const total = items.length
  const filtered = items.filter(i => i.status === activeTab)

  if (loading) return null
  if (total === 0) return null

  return (
    <div style={{ marginTop: 18 }}>
      <p style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-hint)',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        Мои списки · {total}
      </p>

      {/* Табы */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {W_TABS.map(tab => {
          const count = items.filter(i => i.status === tab.status).length
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--glass-border)',
                background: activeTab === tab.status ? 'var(--glass-border)' : 'transparent',
                color: activeTab === tab.status ? 'var(--text)' : 'var(--text-hint)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: activeTab === tab.status ? 600 : 400,
              }}
            >
              {tab.label}{count > 0 ? ` · ${count}` : ''}
            </button>
          )
        })}
      </div>

      {/* Карточки */}
      {filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-hint)', padding: '10px 0', fontStyle: 'italic' }}>
          {EMPTY_HINTS[activeTab]}
        </p>
      ) : (
        filtered.map(item => (
          <WatchlistCard
            key={item.id}
            item={item}
            onClick={() => navigate(`/work/${item.workId}`)}
            onStatusChange={(s) => handleStatusChange(item, s)}
            onRemove={() => handleRemove(item)}
          />
        ))
      )}
    </div>
  )
}

// ── Главная страница профиля ──────────────────────────────────────
export function ProfilePage() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const name = localStorage.getItem('ff_display_name') ?? '—'

  useEffect(() => {
    api.users.me()
      .then((d) => setProfile(d as UserProfile))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteReview = async (e: React.MouseEvent, reviewId: number) => {
    e.stopPropagation()
    if (!window.confirm(lang === 'ru' ? 'Удалить этот отзыв?' : 'Delete this review?')) return
    setDeletingId(reviewId)
    try {
      await api.reviews.delete(reviewId)
      setProfile((prev) => {
        if (!prev) return prev
        return { ...prev, reviews: prev.reviews.filter(r => r.id !== reviewId), reviewCount: prev.reviewCount - 1 }
      })
      toast(t.reviewDeleted, 'success')
    } catch {
      toast(t.errGeneric, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRename = () => {
    const newName = prompt(t.namePlaceholder, name)
    if (newName?.trim()) {
      localStorage.setItem('ff_display_name', newName.trim())
      window.location.reload()
    }
  }

  const totalCount = (profile?.entryCount ?? 0) + (profile?.reviewCount ?? 0)

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>

      {/* Шапка */}
      <div style={{
        padding: '24px 20px 16px',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--coral) 0%, var(--teal) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>
            {name[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>
              {profile ? `${totalCount} записей` : '...'}
            </p>
          </div>
          <button onClick={handleRename} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-hint)', fontSize: 15, padding: '4px',
          }}>✎</button>
        </div>
      </div>

      <div style={{ padding: '14px 14px 0' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-hint)', fontSize: 24, opacity: 0.4 }}>◌</div>
        )}

        {!loading && totalCount === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 16 }}>
              {t.noReviews}<br />{t.beFirst}
            </p>
            <button onClick={() => navigate('/add')} style={{
              padding: '11px 28px', borderRadius: 'var(--r-pill)',
              border: 'none', background: 'var(--coral)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{t.shareBtn}</button>
          </div>
        )}

        {/* Анализ настроений */}
        {profile && totalCount >= 2 && <MoodAnalysis profile={profile} />}

        {/* Записи (новая модель) */}
        {profile && profile.entries.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Записи · {profile.entries.length}
            </p>
            {profile.entries.map(entry => (
              <EntryCard
                key={`e-${entry.id}`}
                entry={entry}
                onClick={() => navigate(`/work/${entry.workId}`)}
              />
            ))}
          </>
        )}

        {/* Отзывы (старая модель) */}
        {profile && profile.reviews.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
              Отзывы · {profile.reviews.length}
            </p>
            {profile.reviews.map(review => (
              <ReviewCard
                key={`r-${review.id}`}
                review={review}
                onDelete={(e) => handleDeleteReview(e, review.id)}
                deleting={deletingId === review.id}
                onClick={() => navigate(`/film/${review.filmId}`)}
              />
            ))}
          </>
        )}

        {/* Мои списки (watchlist) */}
        {profile && <WatchlistSection />}
      </div>
    </div>
  )
}
