import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useUser } from '../hooks/useUser'
import { useLang, fmtReviews } from '../contexts/LangContext'
import { useToast } from '../contexts/ToastContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { VIEWER_TYPE_SYMBOL } from '../constants/viewerTypes'
import type { Film, Review, ReactionEmoji } from '../types'

const TYPE_LABEL: Record<string, string> = {
  movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга',
}
const TYPE_COLOR: Record<string, string> = {
  movie: 'var(--coral)', series: 'var(--teal)', anime: '#9B7EC8', book: '#5a9e55',
}

const REACTION_LIST: { emoji: ReactionEmoji; label: string }[] = [
  { emoji: 'same',      label: 'так же' },
  { emoji: 'cry',       label: 'плакал' },
  { emoji: 'mindblown', label: 'взрыв'  },
  { emoji: 'fire',      label: 'огонь'  },
  { emoji: 'think',     label: 'думал'  },
]

function topTags(reviews: Review[], key: 'moodBefore' | 'effectAfter' | 'atmosphere', n = 5) {
  const counts: Record<string, number> = {}
  for (const r of reviews) for (const tag of r[key] ?? []) counts[tag] = (counts[tag] ?? 0) + 1
  const max = Math.max(...Object.values(counts), 1)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([tag, count]) => ({ tag, pct: Math.round((count / max) * 100) }))
}

function ReactionBar({ review, onUpdate }: {
  review: Review
  onUpdate: (id: number, reactions: Record<string, number>, myReaction: ReactionEmoji | null) => void
}) {
  const [loading, setLoading] = useState<ReactionEmoji | null>(null)
  const { user } = useUser()
  const { openAuthModal } = useAuthModal()

  const toggle = async (emoji: ReactionEmoji) => {
    if (!user) { openAuthModal(); return }
    if (loading) return
    setLoading(emoji)
    try {
      const isActive = review.myReaction === emoji
      const res = isActive
        ? await api.reviews.unreact(review.id, emoji)
        : await api.reviews.react(review.id, emoji)
      onUpdate(review.id, res.reactions, (res as { myEmoji: ReactionEmoji | null }).myEmoji)
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
    } catch { /* ignore */ } finally { setLoading(null) }
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {REACTION_LIST.map(({ emoji, label }) => {
        const count = review.reactions?.[emoji] ?? 0
        const active = review.myReaction === emoji
        return (
          <button
            key={emoji}
            onClick={(e) => { e.stopPropagation(); toggle(emoji) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
              border: active ? '1.5px solid rgba(208,112,106,0.5)' : '1px solid var(--glass-border)',
              background: active ? 'var(--coral-muted)' : 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              transition: 'all 0.12s',
            } as React.CSSProperties}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--coral)' : 'var(--text-hint)' }}>
              {label}
            </span>
            {count > 0 && (
              <span style={{ fontSize: 10, color: active ? 'var(--coral)' : 'var(--text-hint)', opacity: 0.8 }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function LikeBtn({ review, onUpdate }: {
  review: Review
  onUpdate: (id: number, likes: number, likedByMe: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { lang } = useLang()
  const { openAuthModal } = useAuthModal()

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!localStorage.getItem('ff_token')) { openAuthModal(); return }
    if (loading) return
    setLoading(true)
    try {
      const res = review.likedByMe
        ? await api.reviews.unlike(review.id)
        : await api.reviews.like(review.id)
      onUpdate(review.id, res.likes, res.likedByMe)
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
      if (res.likedByMe) toast(lang === 'ru' ? '♥ Понравилось' : '♥ Liked', 'success')
    } catch { toast(lang === 'ru' ? 'Ошибка' : 'Error', 'error') } finally { setLoading(false) }
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        border: 'none', cursor: 'pointer',
        padding: '4px 10px', borderRadius: 'var(--r-pill)',
        background: review.likedByMe ? 'var(--coral-muted)' : 'transparent',
        transition: 'all 0.15s',
        flexShrink: 0,
      } as React.CSSProperties}
    >
      <span style={{
        fontSize: 15, lineHeight: 1,
        color: review.likedByMe ? 'var(--coral)' : 'var(--text-hint)',
        transform: review.likedByMe ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.15s',
        display: 'inline-block',
      }}>
        {review.likedByMe ? '♥' : '♡'}
      </span>
      {review.likes > 0 && (
        <span style={{ fontSize: 12, color: review.likedByMe ? 'var(--coral)' : 'var(--text-hint)', fontWeight: 500 }}>
          {review.likes}
        </span>
      )}
    </button>
  )
}

const TAG_LAYERS = [
  { key: 'moodBefore'  as const, label: 'шли с',        color: 'var(--coral)',   bg: 'var(--coral-muted)'           },
  { key: 'effectAfter' as const, label: 'ушли с',        color: 'var(--teal)',    bg: 'var(--teal-muted)'            },
  { key: 'atmosphere'  as const, label: 'атмосфера',     color: '#A09184',        bg: 'rgba(160,145,132,0.13)'       },
] as const

export function FilmPage() {
  const { id } = useParams<{ id: string }>()
  const [film, setFilm] = useState<Film | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    api.films.get(parseInt(id))
      .then((data) => {
        const f = data as Film
        setFilm(f)
        setReviews(f.reviews ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const myReview = user ? reviews.find((r) => r.userId === user.id) : undefined

  const handleAddOrEdit = () => {
    if (!user) { openAuthModal(); return }
    if (myReview) {
      sessionStorage.setItem('ff_edit_review', JSON.stringify({
        filmId: film!.id,
        moodBefore: myReview.moodBefore,
        effectAfter: myReview.effectAfter,
        atmosphere: myReview.atmosphere,
        viewerType: myReview.viewerType,
        personalNote: myReview.personalNote ?? '',
      }))
    } else {
      sessionStorage.removeItem('ff_edit_review')
    }
    navigate(`/add?filmId=${film!.id}`)
  }

  const handleShare = () => {
    if (!film) return
    const topMoods   = [...new Set(reviews.flatMap((r) => r.moodBefore))].slice(0, 3)
    const topEffects = [...new Set(reviews.flatMap((r) => r.effectAfter))].slice(0, 3)
    const moodLine   = topMoods.length   ? `настроение: ${topMoods.join(', ')}`   : ''
    const effectLine = topEffects.length ? `после: ${topEffects.join(', ')}` : ''
    const lines = [film.title, film.year ? String(film.year) : '', moodLine, effectLine].filter(Boolean)
    const text  = `${lines.join(' · ')}\n\nFeelFilm — не оценки, ощущения`
    const url   = window.location.href
    if (window.Telegram?.WebApp?.initData) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      )
    } else if (navigator.share) {
      navigator.share({ title: film.title, text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`).then(() =>
        toast(lang === 'ru' ? 'Скопировано' : 'Copied', 'success')
      )
    }
  }

  const handleLikeUpdate = (reviewId: number, likes: number, likedByMe: boolean) =>
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, likes, likedByMe } : r))

  const handleReport = async (reviewId: number) => {
    try {
      await api.reviews.report(reviewId)
      toast(lang === 'ru' ? 'Жалоба отправлена' : 'Reported', 'success')
    } catch { toast(lang === 'ru' ? 'Ошибка' : 'Error', 'error') }
  }

  const handleReactionUpdate = (reviewId: number, reactions: Record<string, number>, myReaction: ReactionEmoji | null) =>
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, reactions, myReaction } : r))

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-hint)' }}>
      <div style={{ fontSize: 28, opacity: 0.4 }}>◌</div>
    </div>
  )
  if (!film) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-hint)' }}>{t.filmNotFound}</div>
  )

  const typeColor = TYPE_COLOR[film.type] ?? 'var(--coral)'
  const typeLabel = TYPE_LABEL[film.type] ?? ''

  return (
    <div className="page-enter" style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', minHeight: 320, overflow: 'hidden' }}>

        {/* Блюр-фон на весь блок */}
        {film.posterUrl && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${film.posterUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center 20%',
            filter: 'blur(48px) saturate(0.7)',
            opacity: 0.35, transform: 'scale(1.2)',
          }} />
        )}
        {/* Градиент поверх фона */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 30%, var(--bg) 100%)',
        }} />

        {/* Контент hero */}
        <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px 28px' }}>

          {/* Навбар hero */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-pill)', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                padding: '6px 14px', backdropFilter: 'blur(12px)',
              }}
            >
              {t.back}
            </button>
            <button
              onClick={handleShare}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-pill)', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 14,
                padding: '6px 12px', backdropFilter: 'blur(12px)',
              }}
              title={lang === 'ru' ? 'Поделиться' : 'Share'}
            >
              ↗
            </button>
          </div>

          {/* Постер + мета */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* Постер */}
            <div style={{ flexShrink: 0 }}>
              {film.posterUrl ? (
                <img
                  src={film.posterUrl}
                  alt={film.title}
                  style={{
                    width: 110, height: 165, objectFit: 'cover',
                    borderRadius: 'var(--r-lg)', display: 'block',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              ) : (
                <div style={{
                  width: 110, height: 165, borderRadius: 'var(--r-lg)',
                  background: 'var(--coral-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, color: 'var(--coral)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                }}>◈</div>
              )}
            </div>

            {/* Мета-информация */}
            <div style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
              {/* Тип + год */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: typeColor,
                  padding: '2px 8px', borderRadius: 'var(--r-pill)',
                  background: `${typeColor}18`, border: `1px solid ${typeColor}30`,
                }}>
                  {typeLabel}
                </span>
                {film.year && (
                  <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{film.year}</span>
                )}
              </div>

              {/* Заголовок */}
              <h1 style={{
                fontSize: 22, fontWeight: 800, color: 'var(--text)',
                lineHeight: 1.15, letterSpacing: '-0.3px', marginBottom: 6,
              }}>
                {film.title}
              </h1>

              {film.originalTitle && film.originalTitle !== film.title && (
                <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, fontStyle: 'italic' }}>
                  {film.originalTitle}
                </p>
              )}

              {/* Жанры */}
              {film.genres && film.genres.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {film.genres.slice(0, 4).map((g) => (
                    <span key={g} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-hint)',
                    }}>{g}</span>
                  ))}
                </div>
              )}

              {/* Счётчик отзывов */}
              <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                {fmtReviews(film._count?.reviews ?? reviews.length, lang)}
              </p>
            </div>
          </div>

          {/* Описание */}
          {film.description && (
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
              marginTop: 18,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {film.description}
            </p>
          )}

          {/* Кнопка добавить отзыв */}
          <button
            onClick={handleAddOrEdit}
            style={{
              width: '100%', marginTop: 20, padding: '13px',
              borderRadius: 'var(--r-md)',
              border: `1.5px solid ${typeColor}55`,
              background: `${typeColor}12`,
              backdropFilter: 'blur(8px)',
              color: typeColor,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            {myReview ? t.editReview : t.shareEmotions}
          </button>
        </div>
      </div>

      {/* ── ЭМОЦИОНАЛЬНЫЙ ПОРТРЕТ ── */}
      {reviews.length > 0 && (
        <div style={{ margin: '4px 16px 12px' }}>
          <div style={{
            borderRadius: 'var(--r-lg)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px 8px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-hint)', marginBottom: 16 }}>
                {t.emotionPortrait}
              </p>
              {TAG_LAYERS.map(({ key, label, color, bg }) => {
                const tags = topTags(reviews, key)
                if (!tags.length) return null
                return (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color, textTransform: 'uppercase', marginBottom: 8 }}>
                      {label}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tags.map(({ tag, pct }) => (
                        <span key={tag} style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 'var(--r-pill)',
                          background: bg,
                          border: `1px solid ${color}28`,
                          color,
                          fontWeight: 500,
                          opacity: 0.5 + pct / 200,
                          transform: `scale(${0.92 + pct / 1200})`,
                          display: 'inline-block',
                          transition: 'all 0.3s',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ОТЗЫВЫ ── */}
      <div style={{ padding: '0 16px' }}>
        {reviews.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-hint)', padding: '48px 0', fontSize: 14 }}>
            {t.noReviews}
          </p>
        )}

        {reviews.map((review) => {
          const isMe = user?.id === review.userId
          const initials = (review.user?.firstName ?? '?')[0]?.toUpperCase()
          return (
            <div key={review.id} style={{
              marginBottom: 10, borderRadius: 'var(--r-lg)',
              background: isMe ? 'rgba(208,112,106,0.05)' : 'var(--glass-bg)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: isMe ? `1.5px solid ${typeColor}40` : '1px solid var(--glass-border)',
              overflow: 'hidden',
            }}>

              {/* Шапка отзыва */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--glass-border)',
              }}>
                {/* Аватар */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isMe
                    ? `linear-gradient(135deg, ${typeColor} 0%, rgba(107,157,170,0.8) 100%)`
                    : 'linear-gradient(135deg, rgba(160,145,132,0.5) 0%, rgba(107,157,170,0.4) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                    {review.user?.firstName ?? t.anon}
                    {isMe && <span style={{ fontSize: 10, color: typeColor, marginLeft: 6, fontWeight: 500 }}>ты</span>}
                  </p>
                </div>
                {review.viewerType && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                    background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ fontSize: 9 }}>{VIEWER_TYPE_SYMBOL[review.viewerType] ?? '◎'}</span>
                    {review.viewerType}
                  </span>
                )}
              </div>

              {/* Тело отзыва */}
              <div style={{ padding: '12px 16px' }}>
                {/* Теги по слоям */}
                {(['moodBefore', 'effectAfter', 'atmosphere'] as const).map((key) => {
                  const tagsCfg = TAG_LAYERS.find(l => l.key === key)!
                  const tags = review[key] as string[]
                  if (!tags?.length) return null
                  return (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 6, fontWeight: 600 }}>
                        {tagsCfg.label}
                      </span>
                      <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                        {tags.map((tag) => (
                          <span key={tag} style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                            background: tagsCfg.bg, color: tagsCfg.color, fontWeight: 500,
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {review.personalNote && (
                  <p style={{
                    fontSize: 13, fontStyle: 'italic', marginTop: 10,
                    lineHeight: 1.6, color: 'var(--text-secondary)',
                    borderLeft: `2px solid ${typeColor}50`,
                    paddingLeft: 10,
                  }}>
                    "{review.personalNote}"
                  </p>
                )}
              </div>

              {/* Футер отзыва */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px 12px',
                borderTop: '1px solid var(--glass-border)',
                gap: 8, flexWrap: 'wrap',
              }}>
                <ReactionBar review={review} onUpdate={handleReactionUpdate} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!isMe && user && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReport(review.id) }}
                      title="Пожаловаться"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, color: 'var(--text-hint)', opacity: 0.5, padding: '4px 6px',
                      }}
                    >
                      ⚑
                    </button>
                  )}
                  <LikeBtn review={review} onUpdate={handleLikeUpdate} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
