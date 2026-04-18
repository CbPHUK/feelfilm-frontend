import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../contexts/LangContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { VIEWER_TYPE_SYMBOL } from '../constants/viewerTypes'
import type { UserProfile } from '../types'

function Toggle({ active, onToggle, labelOn, labelOff }: {
  active: boolean; onToggle: () => void; labelOn: string; labelOff: string
}) {
  return (
    <button onClick={onToggle} className="hover-chip" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 'var(--r-pill)',
      border: '1.5px solid var(--coral)',
      background: 'transparent', color: 'var(--coral)',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>
      <span style={{
        width: 28, height: 16, borderRadius: 8,
        background: active ? 'var(--coral)' : 'transparent',
        display: 'inline-flex', alignItems: 'center', padding: '2px',
        transition: 'background 0.2s', border: '1.5px solid var(--coral)',
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active ? '#fff' : 'var(--coral)',
          transform: active ? 'translateX(12px)' : 'translateX(0)',
          transition: 'transform 0.2s', flexShrink: 0,
        }} />
      </span>
      {active ? labelOn : labelOff}
    </button>
  )
}

function StatBar({ tag, count, max, color }: { tag: string; count: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{tag}</span>
        <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{count}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(160,145,132,0.15)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.round((count / max) * 100)}%`,
          background: color, opacity: 0.75,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { t, lang, setLang } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
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

  const handleDeleteReview = async (reviewId: number) => {
    const tgWebApp = window.Telegram?.WebApp as ({ showConfirm?: (msg: string, cb: (ok: boolean) => void) => void }) | undefined
    const msg = lang === 'ru' ? 'Удалить этот отзыв?' : 'Delete this review?'
    const ok = tgWebApp?.showConfirm
      ? await new Promise<boolean>((res) => tgWebApp.showConfirm!(msg, res))
      : window.confirm(msg)
    if (!ok) return

    setDeletingId(reviewId)
    try {
      await api.reviews.delete(reviewId)
      setProfile((prev) => {
        if (!prev) return prev
        const reviews = prev.reviews.filter((r) => r.id !== reviewId)
        return { ...prev, reviews, reviewCount: prev.reviewCount - 1 }
      })
      toast(t.reviewDeleted, 'success')
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
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

  const maxMood   = Math.max(...(profile?.stats.moodBefore.map((s) => s.count)  ?? [1]))
  const maxEffect = Math.max(...(profile?.stats.effectAfter.map((s) => s.count) ?? [1]))

  const TYPE_ICON: Record<string, string> = { movie: '◈', series: '▦', anime: '✦' }

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '24px 20px 20px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Аватар + имя */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--coral) 0%, var(--teal) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>
            {name[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>
              {profile ? `${profile.reviewCount} ${t.noReviews === 'Пока нет отзывов' ? 'отзывов' : 'reviews'}` : '...'}
            </p>
          </div>
          <button onClick={handleRename} className="hover-text-btn" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-hint)', fontSize: 16, padding: '4px',
          }}>✎</button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Статистика эмоций */}
        {profile && profile.reviewCount > 0 && (
          <div style={{
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow-sm)',
            marginBottom: 16, padding: '18px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>
              {t.emotionPortrait}
            </p>

            {profile.stats.moodBefore.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 8 }}>{t.cameWith}</p>
                {profile.stats.moodBefore.map((s) => (
                  <StatBar key={s.tag} tag={s.tag} count={s.count} max={maxMood} color="var(--coral)" />
                ))}
              </div>
            )}

            {profile.stats.effectAfter.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 8 }}>{t.leftWith}</p>
                {profile.stats.effectAfter.map((s) => (
                  <StatBar key={s.tag} tag={s.tag} count={s.count} max={maxEffect} color="var(--teal)" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* История отзывов */}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
          {lang === 'ru' ? 'Мои отзывы' : 'My reviews'}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-hint)', fontSize: 24, opacity: 0.4 }}>◌</div>
        )}

        {!loading && (!profile || profile.reviewCount === 0) && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 16 }}>
              {t.noReviews}<br />{t.beFirst}
            </p>
            <button onClick={() => navigate('/add')} className="hover-btn" style={{
              padding: '11px 28px', borderRadius: 'var(--r-pill)',
              border: 'none', background: 'var(--coral)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(208,112,106,0.25)',
            }}>{t.shareBtn}</button>
          </div>
        )}

        {profile?.reviews.map((review) => (
          <div
            key={review.id}
            onClick={() => navigate(`/film/${review.filmId}`)}
            className="hover-card"
            style={{
              marginBottom: 10, padding: '14px 16px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {review.film?.posterUrl ? (
                <img src={review.film.posterUrl} alt="" style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 36, height: 54, borderRadius: 6, flexShrink: 0,
                  background: 'var(--coral-muted)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'var(--coral)',
                }}>{TYPE_ICON[review.film?.type ?? 'movie']}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{review.film?.title}</p>
                {review.film?.year && <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{review.film.year}</p>}
              </div>
              {review.viewerType && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-pill)',
                  background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  <span>{VIEWER_TYPE_SYMBOL[review.viewerType] ?? '◎'}</span>
                  {review.viewerType}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {review.moodBefore.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 'var(--r-pill)',
                  background: 'var(--coral-muted)', color: 'var(--coral)', fontWeight: 500,
                }}>{tag}</span>
              ))}
              {review.effectAfter.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 'var(--r-pill)',
                  background: 'var(--teal-muted)', color: 'var(--teal)', fontWeight: 500,
                }}>{tag}</span>
              ))}
            </div>

            {review.personalNote && (
              <p style={{
                fontSize: 12, fontStyle: 'italic', marginTop: 8,
                color: 'var(--text-secondary)', lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{review.personalNote}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                {new Date(review.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {review.likes > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    ♥ {review.likes}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id) }}
                  disabled={deletingId === review.id}
                  className="hover-text-btn"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text-hint)',
                    opacity: deletingId === review.id ? 0.4 : 0.6,
                    padding: '2px 4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
