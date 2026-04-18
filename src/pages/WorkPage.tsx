import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Work, Entry } from '../types'

const TYPE_LABEL: Record<string, string> = {
  movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга',
}

const TYPE_COLOR: Record<string, string> = {
  movie: 'var(--coral)', series: 'var(--teal)', anime: '#9B7EC8', book: '#5a9e55',
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

function EntryItem({ entry }: { entry: Entry & { user?: { id: number; firstName: string } } }) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)',
      marginBottom: 10,
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 10 }}>
        {entry.user?.firstName ?? 'Аноним'} · {timeAgo(entry.createdAt)}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--coral)',
            letterSpacing: '0.08em', paddingTop: 2, flexShrink: 0,
            textTransform: 'uppercase',
          }}>до</span>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
            {entry.cameWith}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--teal)',
            letterSpacing: '0.08em', paddingTop: 2, flexShrink: 0,
            textTransform: 'uppercase',
          }}>после</span>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
            {entry.leftWith}
          </p>
        </div>
      </div>

      {entry.atmosphere && (
        <p style={{
          fontSize: 12, fontStyle: 'italic', color: 'var(--text-hint)',
          marginTop: 10, lineHeight: 1.5,
        }}>
          {entry.atmosphere}
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

  useEffect(() => {
    if (!id) return
    api.works.get(parseInt(id))
      .then((data) => setWork(data as WorkDetail))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <div style={{ height: 20, width: 80, borderRadius: 4, background: 'var(--glass-border)', marginBottom: 24 }} className="skeleton" />
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 100, height: 150, borderRadius: 10, background: 'var(--glass-border)' }} className="skeleton" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 22, width: '70%', borderRadius: 4, background: 'var(--glass-border)', marginBottom: 10 }} className="skeleton" />
            <div style={{ height: 14, width: '40%', borderRadius: 4, background: 'var(--glass-border)' }} className="skeleton" />
          </div>
        </div>
      </div>
    )
  }

  if (!work) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Произведение не найдено</p>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: 14, marginTop: 12 }}>← Назад</button>
      </div>
    )
  }

  const typeColor = TYPE_COLOR[work.type] ?? 'var(--coral)'
  const desc = work.description ?? ''
  const shortDesc = desc.length > 200 ? desc.slice(0, 200) + '…' : desc

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 20, padding: 0, lineHeight: 1 }}
        >←</button>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {work.title}
        </p>
        <span style={{
          fontSize: 10, padding: '3px 9px', borderRadius: 'var(--r-pill)',
          background: `${typeColor}22`, color: typeColor,
          fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0,
        }}>
          {TYPE_LABEL[work.type] ?? work.type}
        </span>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Карточка произведения */}
        <div style={{
          display: 'flex', gap: 16,
          padding: '18px',
          borderRadius: 'var(--r-lg)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          marginBottom: 16,
        }}>
          {work.posterUrl ? (
            <img src={work.posterUrl} alt="" style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 90, height: 135, borderRadius: 10, flexShrink: 0,
              background: `${typeColor}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, color: typeColor,
            }}>
              {work.type === 'movie' ? '◈' : work.type === 'series' ? '▦' : work.type === 'anime' ? '✦' : '◉'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: 4 }}>
              {work.title}
            </h1>
            {work.year && (
              <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 8 }}>{work.year}</p>
            )}
            {desc && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {descExpanded ? desc : shortDesc}
                {desc.length > 200 && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    style={{ background: 'none', border: 'none', color: typeColor, cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 4 }}
                  >
                    {descExpanded ? 'свернуть' : 'ещё'}
                  </button>
                )}
              </p>
            )}
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                {work._count.entries} {work._count.entries === 1 ? 'запись' : work._count.entries < 5 ? 'записи' : 'записей'}
              </span>
            </div>
          </div>
        </div>

        {/* Кнопка добавить запись */}
        <button
          onClick={() => navigate(`/add?workId=${work.id}`)}
          className="hover-btn"
          style={{
            width: '100%', padding: '13px',
            borderRadius: 'var(--r-lg)', border: 'none',
            background: typeColor, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: `0 4px 20px ${typeColor}44`,
            marginBottom: 20,
          }}
        >
          {work.myEntry ? 'Добавить ещё запись' : '+ Написать о своём опыте'}
        </button>

        {/* Записи */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Что пишут
        </p>

        {work.entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Записей пока нет. Будь первым.
          </div>
        )}

        {work.entries.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
