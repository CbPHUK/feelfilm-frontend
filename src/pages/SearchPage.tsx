import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { MOOD_BEFORE_TAGS, EFFECT_AFTER_TAGS, ATMOSPHERE_TAGS } from '../constants/emotions'
import type { Film } from '../types'

const T = {
  paper:     '#e9e2cf',
  paperSoft: '#efe7d2',
  paperDeep: '#ddd3bb',
  ink:       '#1b1d2a',
  inkSoft:   'rgba(27,29,42,0.62)',
  inkMute:   'rgba(27,29,42,0.45)',
  rule:      'rgba(27,29,42,0.18)',
  ruleSoft:  'rgba(27,29,42,0.10)',
  red:       '#b85c3c',
  blue:      '#2b4fc2',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  display:   '"Unbounded", "Inter", sans-serif',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
}

const CONTENT_TABS = [
  { value: 'movie',  label: 'Фильмы'  },
  { value: 'series', label: 'Сериалы' },
  { value: 'anime',  label: 'Аниме'   },
  { value: 'book',   label: 'Книги'   },
] as const

const TYPE_ICON: Record<string, string> = { movie: '◈', series: '▦', anime: '✦', book: '◉' }

type ContentType = 'movie' | 'series' | 'anime' | 'book'

function TagChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: `1px solid ${active ? color : T.rule}`,
        background: active ? color : 'transparent',
        color: active ? T.paper : T.inkSoft,
        fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: 'pointer', borderRadius: 3,
        fontFamily: T.sans, transition: 'all 0.1s',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

function TagGroup({
  title, tags, selected, color, onChange, max = 3,
}: {
  title: string
  tags: readonly string[]
  selected: string[]
  color: string
  onChange: (v: string[]) => void
  max?: number
}) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else if (selected.length < max) {
      onChange([...selected, tag])
    }
  }
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
          color, textTransform: 'uppercase',
        }}>{title}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute }}>
          выбери до {max}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map(tag => (
          <TagChip
            key={tag} label={tag}
            active={selected.includes(tag)}
            color={color}
            onClick={() => toggle(tag)}
          />
        ))}
      </div>
    </div>
  )
}

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const initEffect = searchParams.get('effect')
  const navigate = useNavigate()

  const [contentType, setContentType] = useState<ContentType>('movie')
  const [moodBefore, setMoodBefore] = useState<string[]>([])
  const [effectAfter, setEffectAfter] = useState<string[]>(initEffect ? [initEffect] : [])
  const [atmosphere, setAtmosphere] = useState<string[]>([])
  const [showEffect, setShowEffect] = useState(!!initEffect)
  const [showAtmosphere, setShowAtmosphere] = useState(false)
  const [results, setResults] = useState<Film[] | null>(null)
  const [loading, setLoading] = useState(false)

  const hasFilters = moodBefore.length > 0

  const handleSearch = async (overrideEffect?: string[]) => {
    setLoading(true)
    try {
      const data = await api.reviews.search({
        moodBefore,
        effectAfter: overrideEffect ?? effectAfter,
        atmosphere,
        type: contentType,
      })
      setResults(data as Film[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initEffect) handleSearch([initEffect])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: T.sans, paddingBottom: 100 }}>
      <div className="page-content-wrap" style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{
          padding: '32px 0 24px',
          borderBottom: `1px solid ${T.ink}`,
          marginBottom: 32,
        }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
            color: T.red, textTransform: 'uppercase', marginBottom: 8,
          }}>⁕ поиск по настроению</div>
          <h1 style={{
            fontFamily: T.display, fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, letterSpacing: -1, margin: 0, lineHeight: 1, color: T.ink,
          }}>Как ты себя чувствуешь?</h1>
          <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            Выбери настроение — покажем, что смотрели другие в этот момент
          </p>
        </div>

        {/* Content type tabs */}
        <div style={{
          display: 'flex', marginBottom: 32,
          borderBottom: `1px solid ${T.rule}`,
        }}>
          {CONTENT_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setContentType(tab.value); setResults(null) }}
              style={{
                flex: 1, padding: '10px 6px',
                border: 'none',
                borderBottom: contentType === tab.value
                  ? `2px solid ${T.ink}`
                  : '2px solid transparent',
                background: 'transparent',
                color: contentType === tab.value ? T.ink : T.inkMute,
                fontSize: 13, fontWeight: contentType === tab.value ? 600 : 400,
                cursor: 'pointer', fontFamily: T.sans,
                transition: 'all 0.1s', marginBottom: -1,
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Required: Моё настроение */}
        <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.ruleSoft}` }}>
          <TagGroup
            title="моё настроение"
            tags={MOOD_BEFORE_TAGS}
            selected={moodBefore}
            color={T.red}
            onChange={setMoodBefore}
          />
        </div>

        {/* Optional: Хочу почувствовать */}
        {!showEffect ? (
          <button
            onClick={() => setShowEffect(true)}
            style={{
              background: 'none', border: `1px dashed ${T.rule}`,
              color: T.inkMute, fontSize: 12, cursor: 'pointer',
              padding: '10px 16px', fontFamily: T.sans,
              borderRadius: 3, marginBottom: 12, display: 'block',
            }}
          >+ уточнить, что хочу почувствовать</button>
        ) : (
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.ruleSoft}` }}>
            <TagGroup
              title="хочу почувствовать"
              tags={EFFECT_AFTER_TAGS}
              selected={effectAfter}
              color={T.blue}
              onChange={setEffectAfter}
            />
          </div>
        )}

        {/* Optional: Атмосфера */}
        {!showAtmosphere ? (
          <button
            onClick={() => setShowAtmosphere(true)}
            style={{
              background: 'none', border: `1px dashed ${T.rule}`,
              color: T.inkMute, fontSize: 12, cursor: 'pointer',
              padding: '10px 16px', fontFamily: T.sans,
              borderRadius: 3, marginBottom: 12, display: 'block',
            }}
          >+ добавить атмосферу</button>
        ) : (
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.ruleSoft}` }}>
            <TagGroup
              title="атмосфера"
              tags={ATMOSPHERE_TAGS}
              selected={atmosphere}
              color={T.ink}
              onChange={setAtmosphere}
            />
          </div>
        )}

        {/* Find button */}
        <button
          onClick={() => handleSearch()}
          disabled={!hasFilters || loading}
          style={{
            padding: '14px 40px',
            border: 'none',
            background: hasFilters ? T.ink : T.paperDeep,
            color: hasFilters ? T.paper : T.inkMute,
            fontSize: 14, fontWeight: 600,
            cursor: hasFilters && !loading ? 'pointer' : 'default',
            fontFamily: T.sans, letterSpacing: 0.3,
            transition: 'background 0.15s, color 0.15s',
            marginBottom: 40,
          }}
        >
          {loading ? 'ищем...' : hasFilters ? 'найти →' : 'выбери настроение'}
        </button>

        {/* Results */}
        {results !== null && (
          <div>
            {results.length > 0 ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                    color: T.inkMute, textTransform: 'uppercase', marginBottom: 6,
                  }}>
                    найдено: {results.length}
                  </div>
                  <p style={{ fontSize: 12, color: T.inkMute, margin: 0, lineHeight: 1.5 }}>
                    Чем больше людей пишут отзывы — тем точнее становится поиск.
                  </p>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '24px 16px',
                }}>
                  {results.map(film => (
                    <div
                      key={film.id}
                      onClick={() => navigate(`/film/${film.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{
                        width: '100%', aspectRatio: '2/3',
                        border: `1px solid ${T.rule}`,
                        background: T.paperDeep,
                        overflow: 'hidden', marginBottom: 8,
                        position: 'relative',
                      }}>
                        {film.posterUrl ? (
                          <img src={film.posterUrl} alt={film.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            loading="lazy" />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: T.paperDeep,
                          }}>
                            <span style={{
                              fontFamily: T.display, fontSize: 32, fontWeight: 800,
                              color: T.inkMute, textTransform: 'uppercase',
                            }}>{film.title[0]}</span>
                          </div>
                        )}
                        {/* Нет отзывов — подсказка */}
                        {(film as Film & { _count?: { reviews: number } })._count?.reviews === 0 && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(27,29,42,0.75)', padding: '6px 8px',
                          }}>
                            <span style={{ fontSize: 9, color: T.paper, fontFamily: T.mono, lineHeight: 1.3, display: 'block' }}>
                              Об этом ещё никто не написал
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>
                        {film.title}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMute, marginTop: 2 }}>
                        {film.year ? `${film.year}` : ''}
                        {(film as Film & { type?: string }).type && (
                          <span style={{ marginLeft: film.year ? 6 : 0 }}>
                            {TYPE_ICON[(film as Film & { type?: string }).type!]}
                          </span>
                        )}
                      </div>
                      {/* Подпись об источнике тегов */}
                      {(film as Film & { tagSource?: string }).tagSource && (
                        <div style={{
                          fontSize: 9, color: T.inkMute, marginTop: 3,
                          fontFamily: T.mono, lineHeight: 1.3,
                        }}>
                          {(film as Film & { tagSource?: string }).tagSource}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMute, marginBottom: 8 }}>
                  ⁕ мало произведений точно под этот запрос
                </p>
                <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, marginBottom: 0 }}>
                  Попробуй убрать одну эмоцию или выбрать другую атмосферу
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
