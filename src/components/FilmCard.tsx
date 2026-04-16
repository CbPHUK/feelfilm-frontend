import { memo } from 'react'
import { useLang, fmtReviews } from '../contexts/LangContext'
import type { Film } from '../types'

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  movie:  { bg: 'var(--coral-muted)',  color: 'var(--coral)', icon: '◈' },
  series: { bg: 'var(--teal-muted)',   color: 'var(--teal)',  icon: '▦' },
  anime:  { bg: 'rgba(155,126,200,0.15)', color: '#9B7EC8',   icon: '✦' },
  book:   { bg: 'rgba(107,164,100,0.15)', color: '#5a9e55',   icon: '◉' },
}

interface FilmCardProps {
  film: Film
  onClick?: () => void
}

export const FilmCard = memo(function FilmCard({ film, onClick }: FilmCardProps) {
  const { lang } = useLang()
  const reviewCount = film._count?.reviews ?? film.reviews?.length ?? 0
  const typeStyle = TYPE_STYLE[film.type] ?? TYPE_STYLE.movie

  const allMoods   = film.reviews?.flatMap((r) => r.moodBefore)  ?? []
  const allEffects = film.reviews?.flatMap((r) => r.effectAfter) ?? []
  const topMoods   = [...new Set(allMoods)].slice(0, 2)
  const topEffects = [...new Set(allEffects)].slice(0, 2)

  const totalLikes = film.reviews?.reduce((sum, r) => sum + (r.likes ?? 0), 0) ?? 0

  const glowClass = film.type === 'series' ? 'card-glow-teal' : film.type === 'anime' ? 'card-glow-purple' : 'card-glow-coral'

  return (
    <div
      onClick={onClick}
      className={`hover-card ${glowClass}`}
      style={{
        display: 'flex', gap: 14,
        margin: '0 16px 10px', padding: '14px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px) saturate(1.3)', WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow-sm)',
      }}
    >
      {/* Постер */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {film.posterUrl ? (
          <img
            src={film.posterUrl} alt={film.title}
            decoding="async"
            className="img-fade"
            onLoad={(e) => (e.currentTarget as HTMLImageElement).classList.add('loaded')}
            style={{ width: 62, height: 93, objectFit: 'cover', borderRadius: 'var(--r-sm)', display: 'block' }}
          />
        ) : (
          <div style={{
            width: 62, height: 93, borderRadius: 'var(--r-sm)',
            background: typeStyle.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: typeStyle.color,
          }}>{typeStyle.icon}</div>
        )}
        <span style={{
          position: 'absolute', bottom: 4, right: 4,
          fontSize: 10, padding: '1px 5px', borderRadius: 4,
          background: typeStyle.bg,
          backdropFilter: 'blur(8px)',
          color: typeStyle.color,
          fontWeight: 700, letterSpacing: '0.03em',
        }}>
          {typeStyle.icon}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', lineHeight: 1.3, marginBottom: 2 }}>
          {film.title}
        </p>
        {film.author && (
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 2 }}>{film.author}</p>
        )}
        {film.year && (
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8 }}>{film.year}</p>
        )}

        {topMoods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {topMoods.map((tag) => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {topEffects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {topEffects.map((tag) => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                background: 'var(--teal-muted)', color: 'var(--teal)', fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text-hint)' }}>
            {fmtReviews(reviewCount, lang)}
          </p>
          {totalLikes > 0 && (
            <p style={{ fontSize: 11, color: 'var(--coral)', opacity: 0.8 }}>
              ♥ {totalLikes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})
