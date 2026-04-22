import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useUser } from '../hooks/useUser'
import { useToast } from '../contexts/ToastContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { VIEWER_TYPES } from '../constants/viewerTypes'
import type { WorkSearchResult, Work } from '../types'

const T = {
  paper:     'var(--bg)',
  paperSoft: 'var(--glass-bg)',
  paperDeep: 'var(--bg-deep)',
  ink:       'var(--text)',
  inkSoft:   'var(--text-secondary)',
  inkMute:   'var(--text-hint)',
  rule:      'var(--glass-border)',
  ruleSoft:  'var(--glass-border)',
  red:       'var(--coral)',
  blue:      'var(--teal)',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
  display:   '"Unbounded", "Inter", sans-serif',
  sans:      '"Inter", -apple-system, system-ui, sans-serif',
}

const CAME_WITH_OPTS = [
  'спокойствие',   'радость',       'усталость',     'грусть',
  'тревога',       'скука',         'пустота',       'одиночество',
  'стресс',        'апатия',        'злость',        'ностальгия',
  'влюблённость',
]

const LEFT_WITH_OPTS = [
  'согрел', 'взорвал мозг', 'не отпускает', 'задумал',
  'опустошил', 'зарядил', 'напугал', 'рассмешил',
  'растрогал', 'вдохновил', 'умиротворил', 'восхитил',
]

const ATMOSPHERE_BY_TYPE: Record<string, string[]> = {
  movie: [
    'напряжённый',  'мрачный',       'тёплый',       'красивый',
    'странный',     'философский',   'романтичный',  'смешной',
    'медленный',    'стремительный', 'жестокий',     'тихий',
    'страшный',     'громкий',       'сказочный',    'документальный',
  ],
  series: [
    'затягивающий', 'интригующий',   'напряжённый',  'семейный',
    'криминальный', 'мрачный',       'тёплый',       'романтичный',
    'психологический','драматичный', 'смешной',      'медленный',
    'динамичный',   'лёгкий',        'сложный',      'документальный',
  ],
  anime: [
    'эпический',    'боевой',        'романтичный',  'тёплый',
    'меланхоличный','напряжённый',   'философский',  'странный',
    'красивый',     'жестокий',      'мрачный',      'смешной',
    'мистический',  'сказочный',     'психологический','трогательный',
  ],
  book: [
    'погружающий',  'философский',   'лирический',   'мрачный',
    'психологический','напряжённый', 'атмосферный',  'романтичный',
    'исторический', 'странный',      'тёплый',       'медленный',
    'тяжёлый',      'лёгкий',        'красивый',     'документальный',
  ],
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Всё', movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга',
}

const TYPE_ICONS: Record<string, string> = {
  movie: '◈', series: '▦', anime: '✦', book: '◉',
}

type ContentType = 'all' | 'movie' | 'series' | 'anime' | 'book'

function EmoChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 18px',
        border: `1px solid ${active ? color : T.rule}`,
        background: active ? color : T.paperSoft,
        color: active ? T.paper : T.inkSoft,
        fontSize: 14, fontWeight: active ? 600 : 400,
        cursor: 'pointer', borderRadius: 3,
        fontFamily: T.sans, transition: 'all 0.1s',
        textAlign: 'left', lineHeight: 1.3,
      }}
    >
      {label}
    </button>
  )
}

export function AddReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { toast } = useToast()
  const { openAuthModal } = useAuthModal()

  const workIdParam = searchParams.get('workId') ? parseInt(searchParams.get('workId')!) : null

  const [step, setStep] = useState<'search' | 'manual' | 'emotions'>('search')
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [contentType, setContentType] = useState<ContentType>('all')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WorkSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [manualTitle, setManualTitle]   = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [manualYear, setManualYear]     = useState('')
  const [manualType, setManualType]     = useState<ContentType>('book')

  const [cameWith, setCameWith] = useState('')
  const [leftWith, setLeftWith] = useState('')
  const [atmosphere, setAtmosphere] = useState('')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewerType, setViewerType] = useState<string>(
    () => localStorage.getItem('ff_viewer_type') ?? ''
  )

  useEffect(() => {
    if (workIdParam) {
      api.works.get(workIdParam)
        .then((data) => { setSelectedWork(data as Work); setStep('emotions') })
        .catch(console.error)
    }
  }, [workIdParam])

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await api.works.search(q, contentType)
        setSearchResults(results as WorkSearchResult[])
      } finally { setSearching(false) }
    }, 400)
  }

  const handleManualAdd = async () => {
    if (!manualTitle.trim()) return
    try {
      const work = await api.works.create({
        title: manualTitle.trim(),
        type: manualType,
        externalId: `manual_${Date.now()}`,
        externalSource: 'manual',
        year: manualYear ? parseInt(manualYear) : undefined,
      }) as Work
      setSelectedWork(work)
      setStep('emotions')
    } catch (e) {
      console.error(e); toast('Ошибка при добавлении', 'error')
    }
  }

  const handleSelectWork = async (item: WorkSearchResult) => {
    try {
      let work: Work
      if (item.id) {
        work = item as unknown as Work
      } else {
        work = await api.works.create({
          title: item.title, type: item.type,
          externalId: item.externalId, externalSource: item.externalSource,
          year: item.year ?? undefined, posterUrl: item.posterUrl ?? undefined,
          description: item.description ?? undefined,
        }) as Work
      }
      setSelectedWork(work)
      setAtmosphere('') // сбрасываем атмосферу — у нового типа другие теги
      setStep('emotions')
    } catch (e) {
      console.error(e); toast('Ошибка при выборе', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!selectedWork) return
    if (!user) { openAuthModal(); return }
    if (!leftWith && !atmosphere) { toast('Выбери хотя бы одно поле', 'error'); return }
    setSubmitting(true)
    try {
      await api.entries.create({
        workId: selectedWork.id, cameWith, leftWith,
        atmosphere: atmosphere || undefined,
        note: note.trim() || undefined,
      })
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
      toast('✓ Записано!', 'success')
      navigate(`/work/${selectedWork.id}`)
    } catch (e) {
      console.error(e); toast('Ошибка при сохранении', 'error')
    } finally { setSubmitting(false) }
  }

  const canSubmit = !!leftWith || !!atmosphere

  return (
    <div style={{
      minHeight: '100vh', background: T.paper, color: T.ink,
      fontFamily: T.sans, paddingBottom: 100,
    }}>
      <div className="page-content-wrap" style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>

        {/* ── STEP 1: Search ─────────────────────────────────── */}
        {step === 'search' && (
          <>
            {/* Header */}
            <div style={{
              padding: '32px 0 24px',
              borderBottom: `1px solid ${T.ink}`,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                color: T.red, textTransform: 'uppercase', marginBottom: 8,
              }}>⁕ шаг 1 из 2</div>
              <h1 style={{
                fontFamily: T.display, fontSize: 28, fontWeight: 800,
                letterSpacing: -0.8, margin: 0, lineHeight: 1.1, color: T.ink,
              }}>Что смотрел?</h1>
              <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                Найди фильм, сериал, аниме или книгу
              </p>
            </div>

            {/* Type filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['all', 'movie', 'series', 'anime', 'book'] as ContentType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setContentType(t); setSearchResults([]) }}
                  style={{
                    padding: '6px 14px',
                    border: `1px solid ${contentType === t ? T.ink : T.rule}`,
                    background: contentType === t ? T.ink : 'transparent',
                    color: contentType === t ? T.paper : T.inkSoft,
                    fontSize: 12, cursor: 'pointer', borderRadius: 3,
                    fontFamily: T.sans, fontWeight: contentType === t ? 600 : 400,
                  }}
                >{TYPE_LABELS[t]}</button>
              ))}
            </div>

            {/* Search input */}
            <div style={{
              border: `1px solid ${T.ink}`,
              background: T.paperSoft,
              display: 'flex', alignItems: 'center',
              padding: '0 14px', marginBottom: 16,
            }}>
              <span style={{ color: T.inkMute, marginRight: 10, fontSize: 14 }}>◎</span>
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Название..."
                autoFocus
                style={{
                  flex: 1, padding: '14px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: T.ink, fontFamily: T.sans,
                }}
              />
              {searching && (
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>...</span>
              )}
            </div>

            {/* Results */}
            {searchResults.map(item => (
              <div
                key={`${item.externalId}:${item.externalSource}:${item.type}`}
                onClick={() => handleSelectWork(item)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '10px 14px', marginBottom: 6,
                  border: `1px solid ${T.rule}`,
                  background: T.paperSoft,
                  cursor: 'pointer',
                  transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.ink}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.rule}
              >
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt=""
                    style={{ width: 28, height: 42, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 28, height: 42, flexShrink: 0,
                    background: T.paperDeep,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: T.inkMute,
                  }}>◈</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: T.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: T.inkMute, fontFamily: T.mono, marginTop: 2 }}>
                    {item.year ? `${item.year} · ` : ''}{TYPE_ICONS[item.type] ?? ''} {TYPE_LABELS[item.type]}
                    {item.id && <span style={{ color: T.red, marginLeft: 6 }}>◉ в каталоге</span>}
                  </div>
                </div>
              </div>
            ))}

            {!searching && query && searchResults.length === 0 && (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <p style={{ color: T.inkMute, fontFamily: T.mono, fontSize: 12, marginBottom: 16 }}>
                  ⁕ ничего не найдено
                </p>
                <button
                  onClick={() => setStep('manual')}
                  style={{
                    background: 'none', border: `1px dashed ${T.rule}`,
                    color: T.inkSoft, fontSize: 13, cursor: 'pointer',
                    padding: '10px 20px', borderRadius: 3, fontFamily: T.sans,
                  }}
                >+ Добавить вручную</button>
              </div>
            )}

            {!query && (
              <p style={{
                textAlign: 'center', color: T.inkMute,
                fontFamily: T.mono, fontSize: 11, padding: '40px 0', lineHeight: 1.8,
              }}>
                введи название и выбери произведение
              </p>
            )}
          </>
        )}

        {/* ── STEP manual: Добавить вручную ─────────────────── */}
        {step === 'manual' && (
          <>
            <div style={{ padding: '32px 0 24px', borderBottom: `1px solid ${T.ink}`, marginBottom: 28 }}>
              <button
                onClick={() => setStep('search')}
                style={{ background: 'none', border: `1px solid ${T.rule}`, color: T.inkSoft, fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 3, fontFamily: T.sans, marginBottom: 16 }}
              >← назад</button>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>⁕ добавить вручную</div>
              <h1 style={{ fontFamily: T.display, fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: 0, lineHeight: 1.1, color: T.ink }}>
                Не нашли?
              </h1>
              <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 8 }}>Заполни основные данные сам</p>
            </div>

            {/* Тип */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.inkMute, textTransform: 'uppercase', marginBottom: 10 }}>тип</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['book', 'movie', 'series', 'anime'] as ContentType[]).map(t => (
                  <button key={t} onClick={() => setManualType(t)} style={{
                    padding: '7px 14px', border: `1px solid ${manualType === t ? T.ink : T.rule}`,
                    background: manualType === t ? T.ink : 'transparent',
                    color: manualType === t ? T.paper : T.inkSoft,
                    fontSize: 12, cursor: 'pointer', borderRadius: 3, fontFamily: T.sans,
                    fontWeight: manualType === t ? 600 : 400,
                  }}>{TYPE_LABELS[t]}</button>
                ))}
              </div>
            </div>

            {/* Название */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.inkMute, textTransform: 'uppercase', marginBottom: 8 }}>название *</div>
              <input
                type="text"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder={{
                  book:   'Например: Глотнуть воздуха',
                  movie:  'Например: Ла-Ла Ленд',
                  series: 'Например: Во все тяжкие',
                  anime:  'Например: Унесённые призраками',
                  all:    'Название...',
                }[manualType]}
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px',
                  border: `1px solid ${manualTitle ? T.ink : T.rule}`,
                  background: T.paperSoft, color: T.ink, fontSize: 15,
                  outline: 'none', fontFamily: T.sans, boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = T.ink)}
                onBlur={e => (e.currentTarget.style.borderColor = manualTitle ? T.ink : T.rule)}
              />
            </div>

            {/* Автор — только для книг */}
            {manualType === 'book' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.inkMute, textTransform: 'uppercase', marginBottom: 8 }}>автор</div>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={e => setManualAuthor(e.target.value)}
                  placeholder="Например: Джордж Оруэлл"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: `1px solid ${T.rule}`,
                    background: T.paperSoft, color: T.ink, fontSize: 15,
                    outline: 'none', fontFamily: T.sans, boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.ink)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.rule)}
                />
              </div>
            )}

            {/* Год */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.inkMute, textTransform: 'uppercase', marginBottom: 8 }}>год</div>
              <input
                type="number"
                value={manualYear}
                onChange={e => setManualYear(e.target.value)}
                placeholder={{
                  book:   'Например: 1939',
                  movie:  'Например: 2016',
                  series: 'Например: 2008',
                  anime:  'Например: 2001',
                  all:    'Год...',
                }[manualYear ? 'all' : manualType]}
                min={1800} max={2030}
                style={{
                  width: 160, padding: '12px 14px',
                  border: `1px solid ${T.rule}`,
                  background: T.paperSoft, color: T.ink, fontSize: 15,
                  outline: 'none', fontFamily: T.sans, boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = T.ink)}
                onBlur={e => (e.currentTarget.style.borderColor = T.rule)}
              />
            </div>

            <button
              onClick={handleManualAdd}
              disabled={!manualTitle.trim()}
              style={{
                width: '100%', padding: '16px',
                border: 'none',
                background: manualTitle.trim() ? T.ink : T.paperDeep,
                color: manualTitle.trim() ? T.paper : T.inkMute,
                fontSize: 14, fontWeight: 600,
                cursor: manualTitle.trim() ? 'pointer' : 'default',
                fontFamily: T.sans, letterSpacing: 0.3,
              }}
            >Продолжить →</button>
          </>
        )}

        {/* ── STEP 2: Emotions ──────────────────────────────── */}
        {step === 'emotions' && (
          <>
            {/* Header */}
            <div style={{
              padding: '32px 0 20px',
              borderBottom: `1px solid ${T.ink}`,
              marginBottom: 28,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
              }}>
                {!workIdParam && (
                  <button
                    onClick={() => setStep('search')}
                    style={{
                      background: 'none', border: `1px solid ${T.rule}`,
                      color: T.inkSoft, fontSize: 13, cursor: 'pointer',
                      padding: '4px 10px', borderRadius: 3, fontFamily: T.sans,
                    }}
                  >← назад</button>
                )}
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
                  color: T.red, textTransform: 'uppercase',
                }}>⁕ шаг 2 из 2</div>
              </div>
              <h1 style={{
                fontFamily: T.display, fontSize: 28, fontWeight: 800,
                letterSpacing: -0.8, margin: 0, lineHeight: 1.1, color: T.ink,
              }}>Твой опыт</h1>
            </div>

            {/* Selected work card */}
            {selectedWork && (
              <div style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 14px', marginBottom: 32,
                border: `1px solid ${T.rule}`, background: T.paperSoft,
              }}>
                {selectedWork.posterUrl ? (
                  <img src={selectedWork.posterUrl} alt=""
                    style={{ width: 28, height: 42, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 28, height: 42, background: T.paperDeep, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: T.inkMute,
                  }}>◈</div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{selectedWork.title}</div>
                  {selectedWork.year && (
                    <div style={{ fontSize: 11, color: T.inkMute, fontFamily: T.mono }}>{selectedWork.year}</div>
                  )}
                </div>
              </div>
            )}

            {/* В каком настроении смотрел */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                  color: T.red, textTransform: 'uppercase',
                }}>в каком настроении смотрел? →</div>
                {cameWith && (
                  <button
                    onClick={() => setCameWith('')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: T.inkMute, fontFamily: T.sans,
                    }}
                  >сбросить ×</button>
                )}
              </div>
              <p style={{
                fontSize: 12, color: T.inkMute, margin: '0 0 12px',
                fontFamily: T.sans, lineHeight: 1.4,
              }}>Можно пропустить, если не было особого настроения</p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
              }}>
                {CAME_WITH_OPTS.map(w => (
                  <EmoChip
                    key={w} label={w}
                    active={cameWith === w}
                    color={T.red}
                    onClick={() => setCameWith(p => p === w ? '' : w)}
                  />
                ))}
              </div>
            </div>

            {/* Что унёс */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                  color: T.blue, textTransform: 'uppercase',
                }}>что унёс →</div>
                {leftWith && (
                  <button
                    onClick={() => setLeftWith('')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: T.inkMute, fontFamily: T.sans,
                    }}
                  >сбросить ×</button>
                )}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
              }}>
                {LEFT_WITH_OPTS.map(w => (
                  <EmoChip
                    key={w} label={w}
                    active={leftWith === w}
                    color={T.blue}
                    onClick={() => setLeftWith(p => p === w ? '' : w)}
                  />
                ))}
              </div>
            </div>

            {/* Атмосфера */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <div style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                  color: T.inkMute, textTransform: 'uppercase',
                }}>атмосфера фильма →</div>
                {atmosphere && (
                  <button
                    onClick={() => setAtmosphere('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.inkMute, fontFamily: T.sans }}
                  >сбросить ×</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {(ATMOSPHERE_BY_TYPE[selectedWork?.type ?? 'movie'] ?? ATMOSPHERE_BY_TYPE.movie).map(w => (
                  <EmoChip
                    key={w} label={w}
                    active={atmosphere === w}
                    color={T.inkSoft}
                    onClick={() => setAtmosphere(p => p === w ? '' : w)}
                  />
                ))}
              </div>
            </div>

            {/* Тип зрителя */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                color: T.inkMute, textTransform: 'uppercase', marginBottom: 14,
              }}>кто ты сейчас →</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 8,
              }}>
                {VIEWER_TYPES.map(vt => (
                  <button
                    key={vt.id}
                    onClick={() => {
                      const next = viewerType === vt.id ? '' : vt.id
                      setViewerType(next)
                      localStorage.setItem('ff_viewer_type', next)
                    }}
                    style={{
                      padding: '12px 16px',
                      border: `1px solid ${viewerType === vt.id ? T.ink : T.rule}`,
                      background: viewerType === vt.id ? T.ink : T.paperSoft,
                      color: viewerType === vt.id ? T.paper : T.inkSoft,
                      fontSize: 13, cursor: 'pointer', borderRadius: 3,
                      fontFamily: T.sans, textAlign: 'left',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {vt.symbol} {vt.id}
                    </div>
                    <div style={{
                      fontSize: 11, opacity: 0.7, lineHeight: 1.3,
                      color: viewerType === vt.id ? T.paper : T.inkMute,
                    }}>{vt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div style={{ marginBottom: 24 }}>
              {!showNote ? (
                <button
                  onClick={() => setShowNote(true)}
                  style={{
                    background: 'none', border: `1px dashed ${T.rule}`,
                    color: T.inkMute, fontSize: 12, cursor: 'pointer',
                    padding: '10px 16px', width: '100%', fontFamily: T.sans,
                    borderRadius: 3, textAlign: 'left',
                  }}
                >+ добавить заметку (необязательно)</button>
              ) : (
                <div>
                  <div style={{
                    fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4,
                    color: T.inkMute, textTransform: 'uppercase', marginBottom: 8,
                  }}>заметка</div>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Один образ, фраза, ощущение..."
                    rows={5}
                    autoFocus
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: `1px solid ${T.rule}`,
                      background: T.paperSoft,
                      color: T.ink, fontSize: 14,
                      resize: 'none', outline: 'none',
                      fontFamily: T.sans, lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = T.ink)}
                    onBlur={e => (e.currentTarget.style.borderColor = T.rule)}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              style={{
                width: '100%', padding: '16px',
                border: 'none',
                background: canSubmit ? T.ink : T.paperDeep,
                color: canSubmit ? T.paper : T.inkMute,
                fontSize: 14, fontWeight: 600,
                cursor: canSubmit && !submitting ? 'pointer' : 'default',
                fontFamily: T.sans, letterSpacing: 0.3,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {submitting ? 'Сохраняем...' : canSubmit ? 'Поделиться опытом →' : 'Выбери что почувствовал или атмосферу'}
            </button>

            {canSubmit && (
              <div style={{
                marginTop: 12, textAlign: 'center',
                fontFamily: T.mono, fontSize: 10, color: T.inkMute, letterSpacing: 1,
              }}>
                {[cameWith, leftWith].filter(Boolean).join(' → ')}
                {atmosphere && (leftWith || cameWith) ? ` · ${atmosphere}` : atmosphere}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
