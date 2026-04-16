import { memo } from 'react'
import type { Film } from '../types'

const COVER_COLORS = [
  { bg: '#2d4a3e', text: '#a8c5b5' },
  { bg: '#3d2e1a', text: '#c4a882' },
  { bg: '#1e2d40', text: '#7fa8c9' },
  { bg: '#3a1f2e', text: '#c4859e' },
  { bg: '#2a3520', text: '#94b87a' },
  { bg: '#1f1f35', text: '#9898c8' },
  { bg: '#3d2020', text: '#c47a7a' },
  { bg: '#2e2a1a', text: '#c4b87a' },
]

function getCoverColor(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

interface BookCardProps {
  book: Film
  onClick?: () => void
}

export const BookCard = memo(function BookCard({ book, onClick }: BookCardProps) {
  const reviewCount = book._count?.reviews ?? book.reviews?.length ?? 0
  const cover = getCoverColor(book.title)

  const allMoods = book.reviews?.flatMap((r) => r.moodBefore) ?? []
  const topMood = [...new Set(allMoods)][0]

  return (
    <div
      onClick={onClick}
      className="book-card-wrap"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' }}
    >

      {/* Обложка */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        {book.posterUrl ? (
          <img
            src={book.posterUrl}
            alt=""
            decoding="async"
            className="img-fade"
            onLoad={(e) => (e.currentTarget as HTMLImageElement).classList.add('loaded')}
            style={{
              width: '100%',
              aspectRatio: '2/3',
              objectFit: 'cover',
              borderRadius: 6,
              display: 'block',
              boxShadow: '4px 6px 20px rgba(0,0,0,0.35)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            aspectRatio: '2/3',
            borderRadius: 6,
            background: cover.bg,
            boxShadow: '4px 6px 20px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Корешок книги */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 10, background: 'rgba(255,255,255,0.08)',
            }} />
            {/* Декоративная линия */}
            <div style={{
              width: '100%', height: 1,
              background: `${cover.text}40`,
              marginBottom: 12,
            }} />
            <p style={{
              fontSize: 13, fontWeight: 700, color: cover.text,
              textAlign: 'center', lineHeight: 1.3,
              wordBreak: 'break-word',
            }}>
              {book.title}
            </p>
            <div style={{
              width: '100%', height: 1,
              background: `${cover.text}40`,
              marginTop: 12,
            }} />
            {book.author && (
              <p style={{
                fontSize: 10, color: `${cover.text}99`,
                textAlign: 'center', marginTop: 10,
                letterSpacing: '0.05em',
              }}>
                {book.author}
              </p>
            )}
          </div>
        )}
        {/* Бейдж с тегом */}
        {topMood && (
          <span style={{
            position: 'absolute', bottom: 6, left: 6,
            fontSize: 9, padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            color: '#e8d9c0',
            fontWeight: 600, letterSpacing: '0.03em',
          }}>
            {topMood}
          </span>
        )}
      </div>

      {/* Метаданные */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--books-text, var(--text))',
          lineHeight: 1.3, marginBottom: 2,
        }}>
          {book.title}
        </p>
        {book.author && (
          <p style={{ fontSize: 11, color: 'var(--books-hint, var(--text-hint))', marginBottom: 3 }}>
            {book.author}
          </p>
        )}
        {book.year && (
          <p style={{ fontSize: 11, color: 'var(--books-hint, var(--text-hint))' }}>{book.year}</p>
        )}
        {reviewCount > 0 && (
          <p style={{ fontSize: 10, color: '#c9963c', marginTop: 4, fontWeight: 600 }}>
            ◉ {reviewCount} {reviewCount === 1 ? 'отзыв' : reviewCount < 5 ? 'отзыва' : 'отзывов'}
          </p>
        )}
      </div>
    </div>
  )
})
