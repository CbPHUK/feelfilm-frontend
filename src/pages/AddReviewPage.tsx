import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useUser } from '../hooks/useUser'
import { useToast } from '../contexts/ToastContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import type { WorkSearchResult, Work } from '../types'

type ContentType = 'all' | 'movie' | 'series' | 'anime' | 'book'

const TYPE_LABELS: Record<ContentType, string> = {
  all: 'Всё', movie: 'Фильм', series: 'Сериал', anime: 'Аниме', book: 'Книга',
}

const TYPE_ACTIVE_BG: Record<ContentType, string> = {
  all: 'var(--coral)', movie: 'var(--coral)', series: 'var(--teal)',
  anime: '#9B7EC8', book: '#5a9e55',
}

export function AddReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const { openAuthModal } = useAuthModal()

  const workIdParam = searchParams.get('workId') ? parseInt(searchParams.get('workId')!) : null

  const [step, setStep] = useState<'search' | 'form'>(workIdParam ? 'form' : 'search')
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [contentType, setContentType] = useState<ContentType>('all')

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WorkSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cameWith, setCameWith] = useState('')
  const [leftWith, setLeftWith] = useState('')
  const [atmosphere, setAtmosphere] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Загружаем произведение если workId передан в URL
  useEffect(() => {
    if (workIdParam) {
      api.works.get(workIdParam)
        .then((data) => setSelectedWork(data as Work))
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
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelectWork = async (item: WorkSearchResult) => {
    try {
      if (item.id) {
        setSelectedWork(item as unknown as Work)
      } else {
        // Создаём в БД
        const work = await api.works.create({
          title: item.title,
          type: item.type,
          externalId: item.externalId,
          externalSource: item.externalSource,
          year: item.year ?? undefined,
          posterUrl: item.posterUrl ?? undefined,
          description: item.description ?? undefined,
        })
        setSelectedWork(work as Work)
      }
      setStep('form')
    } catch (e) {
      console.error(e)
      toast('Ошибка при выборе', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!selectedWork) return
    if (!user) {
      openAuthModal()
      return
    }
    if (!cameWith.trim() || !leftWith.trim()) {
      toast('Заполни оба поля', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.entries.create({
        workId: selectedWork.id,
        cameWith: cameWith.trim(),
        leftWith: leftWith.trim(),
        atmosphere: atmosphere.trim() || undefined,
      })
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
      toast('✓ Запись добавлена!', 'success')
      navigate(`/work/${selectedWork.id}`)
    } catch (e) {
      console.error(e)
      toast('Ошибка при сохранении', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Шапка */}
      <div style={{
        padding: '16px 16px 14px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {step === 'form' && !workIdParam && (
            <button
              onClick={() => setStep('search')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 18, padding: 0 }}
            >←</button>
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {step === 'search' ? 'Найди произведение' : 'Твой опыт'}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>
              {step === 'search' ? 'Фильм, сериал, аниме или книга' : 'Что было до и после?'}
            </p>
          </div>
        </div>

        {/* Прогресс */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {['search', 'form'].map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: (step === 'form' ? i <= 1 : i === 0) ? 'var(--coral)' : 'rgba(208,112,106,0.2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ШАГ 1: Поиск произведения */}
        {step === 'search' && (
          <div>
            {/* Фильтр типа */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
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
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  } as React.CSSProperties}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Поиск */}
            <div style={{
              display: 'flex', alignItems: 'center',
              borderRadius: 'var(--r-md)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              marginBottom: 14, padding: '0 14px',
            }}>
              <span style={{ color: 'var(--text-hint)', marginRight: 8, fontSize: 14 }}>◎</span>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Название..."
                autoFocus
                style={{
                  flex: 1, padding: '13px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: 'var(--text)',
                }}
              />
              {searching && <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>...</span>}
            </div>

            {/* Результаты */}
            {searchResults.map((item) => (
              <div
                key={`${item.externalId}:${item.externalSource}:${item.type}`}
                onClick={() => handleSelectWork(item)}
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
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 32, height: 48, borderRadius: 5, flexShrink: 0,
                    background: 'var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: 'var(--text-hint)',
                  }}>◈</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                    {item.year ? `${item.year} · ` : ''}{TYPE_LABELS[item.type]}
                    {item.id !== null && <span style={{ color: 'var(--coral)', marginLeft: 4 }}>◉</span>}
                  </p>
                </div>
              </div>
            ))}

            {!searching && query && searchResults.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 13, padding: '20px 0' }}>
                Ничего не найдено
              </p>
            )}

            {!query && (
              <p style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 13, padding: '32px 0', lineHeight: 1.6 }}>
                Введи название и выбери<br />произведение из результатов
              </p>
            )}
          </div>
        )}

        {/* ШАГ 2: Форма записи */}
        {step === 'form' && (
          <div>
            {/* Выбранное произведение */}
            {selectedWork ? (
              <div style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                marginBottom: 24,
              }}>
                {selectedWork.posterUrl ? (
                  <img src={selectedWork.posterUrl} alt="" style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 54, borderRadius: 6, flexShrink: 0, background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-hint)' }}>◈</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{selectedWork.title}</p>
                  {selectedWork.year && <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>{selectedWork.year}</p>}
                </div>
                {!workIdParam && (
                  <button
                    onClick={() => { setSelectedWork(null); setStep('search') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)', fontSize: 14, padding: '4px' }}
                  >✕</button>
                )}
              </div>
            ) : (
              <div style={{ height: 78, borderRadius: 'var(--r-md)', background: 'var(--glass-border)', marginBottom: 24 }} className="skeleton" />
            )}

            {/* С чем пришёл */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                С чем ты пришёл?
              </label>
              <textarea
                value={cameWith}
                onChange={(e) => setCameWith(e.target.value)}
                placeholder="Какое настроение, ощущение или вопрос привёл тебя к этому?"
                maxLength={300}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14,
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--coral)' }}
                onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--glass-border)' }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'right', marginTop: 4 }}>{cameWith.length}/300</p>
            </div>

            {/* С чем ушёл */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                С чем ты ушёл?
              </label>
              <textarea
                value={leftWith}
                onChange={(e) => setLeftWith(e.target.value)}
                placeholder="Что изменилось? Что осталось с тобой?"
                maxLength={300}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14,
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--teal)' }}
                onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--glass-border)' }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'right', marginTop: 4 }}>{leftWith.length}/300</p>
            </div>

            {/* Атмосфера */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Атмосфера <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(необязательно)</span>
              </label>
              <textarea
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                placeholder="Как это было? Один образ, фраза, ощущение..."
                maxLength={200}
                rows={2}
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14,
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'right', marginTop: 4 }}>{atmosphere.length}/200</p>
            </div>

            {/* Кнопка отправки */}
            {userLoading ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-hint)', fontSize: 12 }}>
                Авторизация...
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !cameWith.trim() || !leftWith.trim()}
                className="hover-btn"
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 'var(--r-lg)', border: 'none',
                  background: (!cameWith.trim() || !leftWith.trim()) ? 'rgba(208,112,106,0.12)' : 'var(--coral)',
                  color: (!cameWith.trim() || !leftWith.trim()) ? 'var(--text-hint)' : '#fff',
                  fontSize: 15, fontWeight: 600,
                  cursor: submitting || !cameWith.trim() || !leftWith.trim() ? 'default' : 'pointer',
                  boxShadow: (!cameWith.trim() || !leftWith.trim()) ? 'none' : '0 4px 20px rgba(208,112,106,0.28)',
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? 'Сохраняем...' : 'Поделиться опытом'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
