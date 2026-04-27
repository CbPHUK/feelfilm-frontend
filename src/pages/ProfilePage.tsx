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

const WORK_ICON: Record<string, string> = { movie: '🎬', series: '📺', anime: '🎌', book: '📚' }

// Лейбл статуса учитывает тип контента
function wStatusLabel(status: WatchlistStatus, type: string): string {
  if (status === 'planned') return 'Запланировано'
  if (status === 'in_progress') return type === 'book' ? 'Читаю' : 'Смотрю'
  if (status === 'completed') return type === 'book' ? 'Прочитано' : 'Просмотрено'
  return status
}

// Динамический лейбл таба — зависит от типов произведений внутри него
function tabLabel(status: WatchlistStatus, items: WatchlistItem[]): string {
  if (status === 'planned') return 'Запланировано'
  const types = new Set(items.map(i => i.work.type))
  const hasVideo = (['movie', 'series', 'anime'] as Array<'movie' | 'series' | 'anime' | 'book'>).some(t => types.has(t))
  const hasBook = types.has('book')
  if (status === 'in_progress') {
    if (hasVideo && hasBook) return 'Смотрю / Читаю'
    return hasBook ? 'Читаю' : 'Смотрю'
  }
  // completed
  if (hasVideo && hasBook) return 'Просмотрено / Прочитано'
  return hasBook ? 'Прочитано' : 'Просмотрено'
}

const EMPTY_HINTS: Record<WatchlistStatus, string> = {
  planned:     'Здесь будут произведения, которые ты планируешь посмотреть или прочитать. Добавить можно с любой страницы фильма, сериала, аниме или книги.',
  in_progress: 'Здесь окажется то, что ты сейчас смотришь или читаешь.',
  completed:   'Здесь будет архив всего, что ты посмотрел или прочитал.',
}

const W_STATUSES: WatchlistStatus[] = ['planned', 'in_progress', 'completed']

// ── Карточка-постер в сетке ───────────────────────────────────────

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
  const type = item.work.type

  return (
    <div style={{ position: 'relative' }}>

      {/* Постер */}
      <div
        onClick={onClick}
        style={{
          position: 'relative',
          paddingTop: '150%',   // соотношение 2:3
          borderRadius: 'var(--r-sm)',
          overflow: 'hidden',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
        }}
      >
        {item.work.posterUrl ? (
          <img
            src={item.work.posterUrl}
            alt={item.work.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, var(--coral-muted) 0%, var(--teal-muted) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', opacity: 0.18, userSelect: 'none' }}>
              {item.work.title[0]?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Иконка типа — правый верхний угол */}
        <span style={{
          position: 'absolute', top: 5, right: 6,
          fontSize: 13,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
          pointerEvents: 'none',
        }}>{WORK_ICON[type]}</span>

        {/* Кнопка ⋯ — правый нижний угол */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
          style={{
            position: 'absolute', bottom: 5, right: 5,
            background: 'rgba(0,0,0,0.45)',
            border: 'none', borderRadius: 3,
            color: '#fff', fontSize: 13, lineHeight: 1,
            padding: '2px 7px', cursor: 'pointer',
          }}
          title="Действия"
        >⋯</button>
      </div>

      {/* Инфо под постером */}
      <div onClick={onClick} style={{ padding: '6px 2px 0', cursor: 'pointer' }}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>{item.work.title}</p>
        {item.work.year && (
          <p style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 2 }}>{item.work.year}</p>
        )}
      </div>

      {/* Мини-меню */}
      {menuOpen && (
        <>
          {/* прозрачный оверлей для закрытия */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            style={{
              position: 'absolute', right: 0, top: '55%', zIndex: 99,
              background: 'var(--bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r-md)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              minWidth: 190, overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {W_STATUSES.filter(s => s !== item.status).map((s, i, arr) => (
              <button
                key={s}
                onClick={() => { setMenuOpen(false); onStatusChange(s) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px',
                  background: 'transparent', border: 'none',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  cursor: 'pointer', color: 'var(--text-secondary)',
                  fontSize: 12, fontFamily: 'inherit',
                }}
              >
                Перенести в {wStatusLabel(s, type)}
              </button>
            ))}
            <button
              onClick={() => { setMenuOpen(false); onRemove() }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent', border: 'none',
                borderTop: '1px solid var(--glass-border)',
                cursor: 'pointer', color: 'var(--text-hint)',
                fontSize: 12, fontFamily: 'inherit',
              }}
            >Убрать из списка</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Секция "Мой список" ───────────────────────────────────────────

function WatchlistSection({ onTotalChange }: { onTotalChange: (n: number) => void }) {
  const navigate = useNavigate()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<WatchlistStatus>('planned')

  useEffect(() => {
    api.watchlist.list()
      .then((data) => {
        const list = data as WatchlistItem[]
        setItems(list)
        onTotalChange(list.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (item: WatchlistItem, newStatus: WatchlistStatus) => {
    // Оптимистично обновляем
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
    try {
      await api.watchlist.set(item.workId, newStatus)
    } catch {
      // Откатываем при ошибке
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i))
    }
  }

  const handleRemove = async (item: WatchlistItem) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== item.id)
      onTotalChange(next.length)
      return next
    })
    try {
      await api.watchlist.remove(item.workId)
    } catch {
      setItems(prev => {
        const restored = [...prev, item].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        onTotalChange(restored.length)
        return restored
      })
    }
  }

  if (loading) return (
    <div style={{ marginTop: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
        Мой список
      </p>
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-hint)', fontSize: 18, opacity: 0.3 }}>◌</div>
    </div>
  )

  const byStatus = (s: WatchlistStatus) => items.filter(i => i.status === s)
  const filtered = byStatus(activeTab)
  const total = items.length

  return (
    <div style={{ marginTop: 18 }}>

      {/* Заголовок */}
      <p style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-hint)',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        Мой список{total > 0 ? ` · ${total}` : ''}
      </p>

      {/* Табы */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {W_STATUSES.map(s => {
          const tabItems = byStatus(s)
          const count = tabItems.length
          const label = tabLabel(s, tabItems.length > 0 ? tabItems : items) // fallback to all items for label
          const isActive = activeTab === s
          return (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              style={{
                padding: '6px 11px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--coral)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-hint)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: isActive ? 600 : 400,
                paddingBottom: 8,
              }}
            >
              {label}{count > 0 ? ` · ${count}` : ''}
            </button>
          )
        })}
      </div>

      {/* Пустое состояние */}
      {filtered.length === 0 ? (
        <p style={{
          fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6,
          padding: '4px 0 16px', maxWidth: 300,
        }}>
          {EMPTY_HINTS[activeTab]}
        </p>
      ) : (
        /* Сетка карточек-постеров */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 12,
          paddingBottom: 8,
        }}>
          {filtered.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/work/${item.workId}`)}
              onStatusChange={(s) => handleStatusChange(item, s)}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
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
  const [watchlistTotal, setWatchlistTotal] = useState(0)
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
              {profile
                ? `${totalCount} ${totalCount === 1 ? 'запись' : totalCount < 5 ? 'записи' : 'записей'}${watchlistTotal > 0 ? ` · ${watchlistTotal} в списке` : ''}`
                : '...'}
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

        {/* Мой список (watchlist) */}
        {profile && <WatchlistSection onTotalChange={setWatchlistTotal} />}
      </div>
    </div>
  )
}
