import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { TagPicker } from '../components/TagPicker'
import { FilmCard } from '../components/FilmCard'
import { MOOD_BEFORE_TAGS, EFFECT_AFTER_TAGS, ATMOSPHERE_TAGS } from '../constants/emotions'
import { useLang, fmtResults } from '../contexts/LangContext'
import type { Film } from '../types'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const initEffect = searchParams.get('effect')

  const [moodBefore, setMoodBefore] = useState<string[]>([])
  const [effectAfter, setEffectAfter] = useState<string[]>(initEffect ? [initEffect] : [])
  const [atmosphere, setAtmosphere] = useState<string[]>([])
  const [results, setResults] = useState<Film[] | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const hasFilters = moodBefore.length || effectAfter.length || atmosphere.length

  const handleSearch = async (overrideEffect?: string[]) => {
    setLoading(true)
    try {
      const data = await api.reviews.search({
        moodBefore,
        effectAfter: overrideEffect ?? effectAfter,
        atmosphere,
      })
      setResults(data as Film[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Автозапуск если пришли с фильтром из MoodPicker
  useEffect(() => {
    if (initEffect) handleSearch([initEffect])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '24px 20px 16px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          {t.howAreYou}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{t.findByMood}</p>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <TagPicker label={t.myMood} tags={MOOD_BEFORE_TAGS} selected={moodBefore} onChange={setMoodBefore} />
        <TagPicker label={t.wantToFeel} tags={EFFECT_AFTER_TAGS} selected={effectAfter} onChange={setEffectAfter} />
        <TagPicker label={t.atmosphere} tags={ATMOSPHERE_TAGS} selected={atmosphere} onChange={setAtmosphere} />

        <button
          onClick={() => handleSearch()}
          disabled={!hasFilters || loading}
          className="hover-btn"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--r-lg)',
            border: 'none',
            background: hasFilters ? 'var(--coral)' : 'rgba(208,112,106,0.12)',
            color: hasFilters ? '#fff' : 'var(--text-hint)',
            fontSize: 15, fontWeight: 600,
            cursor: hasFilters ? 'pointer' : 'default',
            marginBottom: 28,
            boxShadow: hasFilters ? '0 4px 20px rgba(208,112,106,0.28)' : 'none',
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? t.searching : t.find}
        </button>
      </div>

      {results !== null && (
        <div>
          {results.length > 0 ? (
            <>
              <p style={{ padding: '0 16px 12px', fontSize: 11, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600 }}>
                {fmtResults(results.length, lang)} — {lang === 'ru' ? 'по совпадению' : 'by relevance'}
              </p>
              <div className="film-grid">
                {results.map((film) => (
                  <FilmCard key={film.id} film={film} onClick={() => navigate(`/film/${film.id}`)} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◎</p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                {t.noResults}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6, maxWidth: '32ch', margin: '0 auto' }}>
                {lang === 'ru'
                  ? 'Попробуй убрать часть фильтров — чем меньше условий, тем больше совпадений'
                  : 'Try removing some filters — fewer conditions means more matches'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
