import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { TagPicker } from '../components/TagPicker'
import { useUser } from '../hooks/useUser'
import { useLang } from '../contexts/LangContext'
import { useToast } from '../contexts/ToastContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { MOOD_BEFORE_TAGS, EFFECT_AFTER_TAGS, ATMOSPHERE_TAGS } from '../constants/emotions'
import { VIEWER_TYPES } from '../constants/viewerTypes'
import type { Film } from '../types'

type Step = 'film' | 'vibe' | 'mood' | 'effect' | 'atmosphere' | 'note'
type ContentType = 'all' | 'movie' | 'series' | 'anime' | 'book'

const TYPE_ACTIVE_BG: Record<ContentType, string> = {
  all: 'var(--coral)', movie: 'var(--coral)', series: 'var(--teal)', anime: '#9B7EC8', book: '#5a9e55',
}


function NextBtn({ disabled, onClick, label = '' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="hover-btn"
      style={{
        width: '100%', padding: '14px',
        borderRadius: 'var(--r-lg)', border: 'none',
        background: disabled ? 'rgba(208,112,106,0.12)' : 'var(--coral)',
        color: disabled ? 'var(--text-hint)' : '#fff',
        fontSize: 15, fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 20px rgba(208,112,106,0.28)',
        transition: 'all 0.2s',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </button>
  )
}

export function AddReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const { t, lang } = useLang()
  const { toast } = useToast()
  const { openAuthModal } = useAuthModal()

  // Предзаполнение если редактируем существующий отзыв
  const filmIdParam = searchParams.get('filmId') ? parseInt(searchParams.get('filmId')!) : null
  const prefill = (() => {
    try {
      const raw = sessionStorage.getItem('ff_edit_review')
      if (!raw) return null
      const data = JSON.parse(raw)
      if (data.filmId === filmIdParam) return data
    } catch { /* ignore */ }
    return null
  })()
  const isEditing = Boolean(prefill)

  const TYPE_LABELS: Record<ContentType, string> = {
    all: t.all, movie: t.movies, series: t.series, anime: t.anime, book: t.books,
  }

  const STEP_TITLES: Record<Step, string> = {
    film:       t.whatWatched,
    vibe:       t.whoAreYou,
    mood:       t.whatBefore,
    effect:     t.whatAfter,
    atmosphere: t.whatAtmo,
    note:       t.onePhrase,
  }

  const STEP_HINTS: Record<Step, string> = {
    film:       t.searchOrAdd,
    vibe:       t.contextHint,
    mood:       t.moodHint,
    effect:     t.effectHint,
    atmosphere: t.atmoHint,
    note:       t.noteHint,
  }

  const [step, setStep] = useState<Step>(filmIdParam ? 'vibe' : 'film')
  const [filmId, setFilmId] = useState<number | null>(filmIdParam)
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null)
  const [contentType, setContentType] = useState<ContentType>('all')
  const [viewerType, setViewerType] = useState<string | null>(prefill?.viewerType ?? null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Film[]>([])
  const [suggested, setSuggested] = useState<Film[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookCoverUrl, setBookCoverUrl] = useState('')

  const [moodBefore, setMoodBefore] = useState<string[]>(prefill?.moodBefore ?? [])
  const [effectAfter, setEffectAfter] = useState<string[]>(prefill?.effectAfter ?? [])
  const [atmosphere, setAtmosphere] = useState<string[]>(prefill?.atmosphere ?? [])
  const [personalNote, setPersonalNote] = useState<string>(prefill?.personalNote ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (filmId && !selectedFilm) {
      api.films.get(filmId).then((f) => setSelectedFilm(f as Film)).catch(console.error)
    }
  }, [filmId])

  // Загружаем фильмы из БД при монтировании — показываем как подсказки
  useEffect(() => {
    if (step === 'film') {
      api.films.list(1, contentType === 'all' ? undefined : contentType)
        .then((data) => setSuggested(data as Film[]))
        .catch(console.error)
    }
  }, [step, contentType])

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await api.films.search(q, contentType)
        setSearchResults(results as Film[])
      } finally { setSearching(false) }
    }, 400)
  }

  const handleSelectFilm = async (film: Film) => {
    if (!film.id) {
      const type = contentType === 'all' ? 'movie' : contentType
      const created = await api.films.create({
        title: film.title, type,
        year: film.year ?? undefined,
        tmdbId: film.tmdbId ?? undefined,
        malId: (film as Film & { malId?: number }).malId ?? undefined,
        posterUrl: film.posterUrl ?? undefined,
        description: film.description ?? undefined,
        genres: film.genres,
      })
      const c = created as Film
      setSelectedFilm(c); setFilmId(c.id)
    } else {
      setSelectedFilm(film); setFilmId(film.id)
    }
    setStep('vibe')
  }

  const handleAddNewFilm = async () => {
    if (!query.trim()) return
    try {
      const type = contentType === 'all' ? 'movie' : contentType
      const film = await api.films.create({
        title: query, type,
        ...(type === 'book' && bookAuthor ? { author: bookAuthor } : {}),
        ...(type === 'book' && bookCoverUrl ? { posterUrl: bookCoverUrl } : {}),
      })
      await handleSelectFilm(film as Film)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('handleAddNewFilm error:', e)
      toast(msg || t.errGeneric, 'error')
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)

    if (!filmId) {
      setSubmitError(t.errNoFilm)
      return
    }
    if (!user) {
      openAuthModal()
      return
    }

    setSubmitting(true)
    try {
      await api.reviews.create({
        filmId,
        moodBefore, effectAfter, atmosphere,
        viewerType: viewerType ?? undefined,
        personalNote: personalNote || undefined,
      })
      sessionStorage.removeItem('ff_edit_review')
      toast(lang === 'ru' ? (isEditing ? '✓ Отзыв обновлён!' : '✓ Отзыв добавлен!') : (isEditing ? '✓ Review updated!' : '✓ Review added!'), 'success')
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
      navigate(`/film/${filmId}`)
    } catch (e) {
      setSubmitError(t.errGeneric)
      toast(t.errGeneric, 'error')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const steps: Step[] = ['film', 'vibe', 'mood', 'effect', 'atmosphere', 'note']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '24px 20px 16px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {step !== 'film' && (
            <button
              onClick={() => setStep(steps[stepIndex - 1])}
              className="hover-text-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 18, padding: 0, lineHeight: 1 }}
            >←</button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {STEP_TITLES[step]}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>
              {STEP_HINTS[step]}
            </p>
          </div>
        </div>

        {/* Прогресс */}
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= stepIndex ? 'var(--coral)' : 'rgba(208,112,106,0.2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ШАГ 1: Выбор фильма */}
        {step === 'film' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['all', 'movie', 'series', 'anime', 'book'] as ContentType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setContentType(t); setSearchResults([]) }}
                  className="hover-chip"
                  style={{
                    flex: 1, padding: '7px 0',
                    borderRadius: 'var(--r-sm)', border: 'none',
                    background: contentType === t ? TYPE_ACTIVE_BG[t] : 'var(--glass-bg)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    outline: contentType === t ? 'none' : '1px solid var(--glass-border)',
                    color: contentType === t ? '#fff' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    boxShadow: contentType === t ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  } as React.CSSProperties}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center',
              borderRadius: 'var(--r-md)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow-sm)',
              marginBottom: 12, padding: '0 14px',
            }}>
              <span style={{ color: 'var(--text-hint)', marginRight: 8, fontSize: 14 }}>◎</span>
              <input
                type="text" value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Название..."
                style={{
                  flex: 1, padding: '13px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: 'var(--text)',
                }}
              />
              {searching && <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>...</span>}
            </div>

            {/* Список результатов поиска или подсказки когда пусто */}
            {(query ? searchResults : suggested).map((film) => (
              <div
                key={film.tmdbId ?? film.id ?? film.title}
                onClick={() => handleSelectFilm(film)}
                className="hover-row"
                style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '10px 14px', marginBottom: 8,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                }}
              >
                {film.posterUrl ? (
                  <img src={film.posterUrl} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 48, borderRadius: 5, flexShrink: 0, background: 'var(--coral-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral)', fontSize: 14 }}>◈</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.title}</p>
                  {film.year && <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>{film.year}</p>}
                </div>
              </div>
            ))}

            {query && !searching && searchResults.length === 0 && (
              contentType === 'book' ? (
                <div style={{
                  borderRadius: 'var(--r-md)',
                  border: '1.5px dashed rgba(90,158,85,0.4)',
                  padding: '14px',
                  background: 'rgba(90,158,85,0.04)',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 12 }}>
                    Добавить книгу «{query}»
                  </p>
                  <input
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="Автор (необязательно)"
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text)', fontSize: 14,
                      outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                    }}
                  />
                  <input
                    value={bookCoverUrl}
                    onChange={(e) => setBookCoverUrl(e.target.value)}
                    placeholder="Ссылка на обложку (необязательно)"
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text)', fontSize: 14,
                      outline: 'none', marginBottom: 12, boxSizing: 'border-box',
                    }}
                  />
                  {bookCoverUrl && (
                    <img
                      src={bookCoverUrl} alt="обложка"
                      style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 6, marginBottom: 12, display: 'block' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <button
                    onClick={handleAddNewFilm}
                    className="hover-btn"
                    style={{
                      width: '100%', padding: '11px',
                      borderRadius: 'var(--r-sm)', border: 'none',
                      background: '#5a9e55', color: '#fff',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Добавить книгу
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddNewFilm}
                  className="hover-btn"
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 'var(--r-md)',
                    border: '1.5px dashed rgba(208,112,106,0.35)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 14, cursor: 'pointer',
                  }}
                >
                  {t.addTitle}{query}»
                </button>
              )
            )}
          </div>
        )}

        {/* ШАГ 2: Тип зрителя */}
        {step === 'vibe' && (
          <div>
            {selectedFilm && (
              <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 20, fontStyle: 'italic' }}>
                {selectedFilm.title}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {VIEWER_TYPES.map(({ id, symbol, desc }) => {
                const active = viewerType === id
                return (
                  <button
                    key={id}
                    onClick={() => setViewerType(active ? null : id)}
                    className="hover-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 'var(--r-md)',
                      border: active ? '1.5px solid var(--coral)' : '1px solid var(--glass-border)',
                      background: active ? 'rgba(208,112,106,0.09)' : 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: active ? '0 4px 16px rgba(208,112,106,0.15)' : 'var(--glass-shadow-sm)',
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, color: active ? 'var(--coral)' : 'var(--text-hint)', fontWeight: 300 }}>{symbol}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--coral)' : 'var(--text)', marginBottom: 2 }}>
                        {id}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>{desc}</p>
                    </div>
                    {active && (
                      <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--coral)' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
            <NextBtn onClick={() => setStep('mood')} label={viewerType ? t.next : t.skip} />
          </div>
        )}

        {/* ШАГ 3: Настроение ДО */}
        {step === 'mood' && (
          <div>
            <TagPicker label={t.moodBefore} tags={MOOD_BEFORE_TAGS} selected={moodBefore} onChange={setMoodBefore} />
            <NextBtn disabled={moodBefore.length === 0} onClick={() => setStep('effect')} label={t.next} />
          </div>
        )}

        {/* ШАГ 4: Эффект ПОСЛЕ */}
        {step === 'effect' && (
          <div>
            <TagPicker label={t.effectAfter} tags={EFFECT_AFTER_TAGS} selected={effectAfter} onChange={setEffectAfter} />
            <NextBtn disabled={effectAfter.length === 0} onClick={() => setStep('atmosphere')} label={t.next} />
          </div>
        )}

        {/* ШАГ 5: Атмосфера */}
        {step === 'atmosphere' && (
          <div>
            <TagPicker label={t.atmosphere} tags={ATMOSPHERE_TAGS} selected={atmosphere} onChange={setAtmosphere} />
            <NextBtn disabled={atmosphere.length === 0} onClick={() => setStep('note')} label={t.next} />
          </div>
        )}

        {/* ШАГ 6: Личная фраза */}
        {step === 'note' && (
          <div>
            <div style={{
              borderRadius: 'var(--r-md)', overflow: 'hidden',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow-sm)',
              marginBottom: 8,
            }}>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder={t.placeholderNote}
                maxLength={200}
                rows={4}
                style={{
                  width: '100%', padding: '14px',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: 'var(--text)', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />
              <p style={{ padding: '0 14px 10px', fontSize: 11, color: 'var(--text-hint)', textAlign: 'right' }}>
                {personalNote.length}/200
              </p>
            </div>

            {submitError && (
              <p style={{ fontSize: 13, color: 'var(--coral)', marginBottom: 12, textAlign: 'center' }}>
                {submitError}
              </p>
            )}

            {userLoading && (
              <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12, textAlign: 'center' }}>
                {t.authorizing}
              </p>
            )}

            <div style={{ marginTop: 8 }}>
              <NextBtn
                disabled={submitting || userLoading}
                onClick={handleSubmit}
                label={submitting ? t.saving : isEditing ? (lang === 'ru' ? 'Обновить' : 'Update') : t.shareBtn}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
