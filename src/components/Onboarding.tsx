import { useState } from 'react'
import { Logo } from './Logo'
import { useLang } from '../contexts/LangContext'

interface OnboardingProps {
  onSignIn: () => void
  onGuest: () => void
}

const BEFORE_TAGS = [
  { text: 'грусть',      x: '8%',  y: '18%', rot: '-4deg',  delay: '0s',    size: 13, dim: true  },
  { text: 'тревога',     x: '52%', y: '8%',  rot: '3deg',   delay: '0.4s',  size: 12, dim: true  },
  { text: 'скука',       x: '28%', y: '38%', rot: '-2deg',  delay: '1.1s',  size: 14, dim: false },
  { text: 'усталость',   x: '62%', y: '30%', rot: '5deg',   delay: '0.7s',  size: 12, dim: true  },
  { text: 'пустота',     x: '14%', y: '62%', rot: '-3deg',  delay: '1.5s',  size: 13, dim: false },
  { text: 'одиночество', x: '44%', y: '55%', rot: '2deg',   delay: '0.2s',  size: 11, dim: true  },
  { text: 'апатия',      x: '70%', y: '68%', rot: '-5deg',  delay: '0.9s',  size: 12, dim: true  },
  { text: 'злость',      x: '22%', y: '82%', rot: '3deg',   delay: '1.8s',  size: 13, dim: false },
]

const AFTER_TAGS = [
  { text: 'вдохновил',    x: '10%', y: '14%', rot: '3deg',   delay: '0.3s',  size: 13, dim: false },
  { text: 'не отпускает', x: '48%', y: '6%',  rot: '-2deg',  delay: '1.0s',  size: 12, dim: false },
  { text: 'взорвал мозг', x: '22%', y: '35%', rot: '4deg',   delay: '0.6s',  size: 11, dim: true  },
  { text: 'согрел',       x: '60%', y: '28%', rot: '-3deg',  delay: '1.4s',  size: 14, dim: false },
  { text: 'задумал',      x: '8%',  y: '58%', rot: '2deg',   delay: '0.1s',  size: 13, dim: true  },
  { text: 'рассмешил',    x: '42%', y: '52%', rot: '-4deg',  delay: '1.7s',  size: 12, dim: false },
  { text: 'напугал',      x: '68%', y: '65%', rot: '5deg',   delay: '0.8s',  size: 11, dim: true  },
  { text: 'зарядил',      x: '20%', y: '78%', rot: '-2deg',  delay: '1.2s',  size: 13, dim: false },
]

const SLIDE_DATA = [
  {
    label: '01',
    bigText: 'Не\nоценки.',
    accent: 'Ощущения.',
    sub: 'Забудь про звёзды. Здесь описывают что почувствовали — до и после просмотра.',
  },
  {
    label: '02',
    bigText: 'Найди\nпод',
    accent: 'настроение.',
    sub: 'Грустишь? Устал? Хочешь вдохновиться? Выбери ощущение — мы найдём.',
  },
  {
    label: '03',
    bigText: 'Передай',
    accent: 'эмоцию.',
    sub: 'Кто-то сейчас чувствует то же, что ты. Твой честный отзыв может помочь.',
  },
  {
    label: '04',
    bigText: 'Кино. Аниме.',
    accent: 'Книги.',
    sub: 'Фильмы, сериалы, аниме и книги — всё в одном месте. Ищи по ощущению, не по жанру.',
  },
]

export function Onboarding({ onSignIn, onGuest }: OnboardingProps) {
  const { t } = useLang()
  const [slide, setSlide] = useState(0)
  const [animDir, setAnimDir] = useState<'in' | 'out'>('in')

  const isAuthSlide = slide === SLIDE_DATA.length
  const isLast = slide === SLIDE_DATA.length - 1
  const current = SLIDE_DATA[slide]

  const go = (next: number) => {
    setAnimDir('out')
    setTimeout(() => { setSlide(next); setAnimDir('in') }, 200)
  }

  const handleNext = () => go(isLast ? SLIDE_DATA.length : slide + 1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 min(520px, 100%)',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(32px, 5vh, 56px) clamp(28px, 5vw, 64px)',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid var(--glass-border)',
        background: 'var(--glass-bg-heavy)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 'auto' }}>
          <Logo size={28} withText />
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(24px, 4vh, 48px) 0',
          opacity: animDir === 'out' ? 0 : 1,
          transform: animDir === 'out' ? 'translateY(12px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          {!isAuthSlide ? (
            <>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--coral)', marginBottom: 24,
              }}>
                {current.label} / 04
              </p>
              <h2 style={{
                fontSize: 'clamp(44px, 6vw, 72px)',
                fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95,
                color: 'var(--text)', whiteSpace: 'pre-line', marginBottom: 4,
              }}>
                {current.bigText}
              </h2>
              <h2 style={{
                fontSize: 'clamp(44px, 6vw, 72px)',
                fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95,
                color: 'var(--coral)', marginBottom: 'clamp(20px, 4vh, 36px)',
              }}>
                {current.accent}
              </h2>
              <p style={{
                fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'var(--text-secondary)',
                lineHeight: 1.65, maxWidth: '38ch',
              }}>
                {current.sub}
              </p>
            </>
          ) : (
            <>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 24,
              }}>
                Готово
              </p>
              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 52px)',
                fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95,
                color: 'var(--text)', marginBottom: 8,
              }}>
                Начнём?
              </h2>
              <p style={{
                fontSize: 14, color: 'var(--text-secondary)',
                marginBottom: 28, lineHeight: 1.6, maxWidth: '34ch',
              }}>
                С аккаунтом ты сможешь добавлять отзывы, ставить лайки и сохранять историю.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={onSignIn}
                  className="hover-btn"
                  style={{
                    width: '100%', padding: '15px', borderRadius: 'var(--r-lg)', border: 'none',
                    background: 'var(--coral)', color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 6px 28px rgba(208,112,106,0.35)',
                    letterSpacing: '0.01em', transition: 'all 0.2s',
                  }}
                >
                  Войти / Зарегистрироваться
                </button>
                <button
                  onClick={onGuest}
                  className="hover-text-btn"
                  style={{
                    width: '100%', padding: '12px', background: 'none', border: 'none',
                    color: 'var(--text-hint)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Смотреть без регистрации →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom — dots + кнопки (только на слайдах, не на auth-экране) */}
        {!isAuthSlide && (
          <div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[...SLIDE_DATA, null].map((_, i) => (
                <div key={i} style={{
                  height: 3, borderRadius: 2,
                  width: i === slide ? 28 : 8,
                  background: i <= slide ? 'var(--coral)' : 'rgba(208,112,106,0.18)',
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              ))}
            </div>

            <button onClick={handleNext} className="hover-btn" style={{
              width: '100%', padding: '15px', borderRadius: 'var(--r-lg)', border: 'none',
              background: 'var(--coral)', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 6px 28px rgba(208,112,106,0.35)', letterSpacing: '0.01em',
            }}>
              {t.next}
            </button>
            <button onClick={() => go(SLIDE_DATA.length)} className="hover-text-btn" style={{
              width: '100%', padding: '12px', background: 'none', border: 'none',
              color: 'var(--text-hint)', fontSize: 13, cursor: 'pointer', marginTop: 4,
            }}>
              {t.skip}
            </button>
          </div>
        )}

        {/* Dots на auth-экране */}
        {isAuthSlide && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[...SLIDE_DATA, null].map((_, i) => (
              <div key={i} style={{
                height: 3, borderRadius: 2,
                width: i === slide ? 28 : 8,
                background: 'var(--coral)',
                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Right panel — декоративный, десктоп ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'none',
      }} className="onboarding-right">

        {/* Разделитель */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 1, background: 'var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <span style={{
            background: 'var(--bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-pill)',
            padding: '6px 14px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--text-hint)', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>→</span>
        </div>

        {/* Метки ДО / ПОСЛЕ */}
        <div style={{ position: 'absolute', top: 32, left: '24%', transform: 'translateX(-50%)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(208,112,106,0.5)' }}>до</span>
        </div>
        <div style={{ position: 'absolute', top: 32, left: '76%', transform: 'translateX(-50%)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(107,157,170,0.5)' }}>после</span>
        </div>

        {/* Теги ДО */}
        {BEFORE_TAGS.map((tag) => (
          <div key={tag.text} style={{
            position: 'absolute',
            left: `calc(${tag.x} / 2)`,
            top: tag.y,
            ['--tag-rot' as string]: tag.rot,
            animation: `tagFloat ${3.5 + parseFloat(tag.delay) * 0.8}s ease-in-out ${tag.delay} infinite`,
            padding: '5px 13px', borderRadius: 'var(--r-pill)',
            background: tag.dim ? 'rgba(208,112,106,0.08)' : 'rgba(208,112,106,0.14)',
            border: '1px solid rgba(208,112,106,0.22)',
            fontSize: tag.size, fontWeight: 500,
            color: tag.dim ? 'rgba(208,112,106,0.45)' : 'var(--coral)',
            whiteSpace: 'nowrap', userSelect: 'none',
          }}>
            {tag.text}
          </div>
        ))}

        {/* Теги ПОСЛЕ */}
        {AFTER_TAGS.map((tag) => (
          <div key={tag.text} style={{
            position: 'absolute',
            left: `calc(50% + ${tag.x} / 2)`,
            top: tag.y,
            ['--tag-rot' as string]: tag.rot,
            animation: `tagFloat ${3.5 + parseFloat(tag.delay) * 0.8}s ease-in-out ${tag.delay} infinite`,
            padding: '5px 13px', borderRadius: 'var(--r-pill)',
            background: tag.dim ? 'rgba(107,157,170,0.08)' : 'rgba(107,157,170,0.14)',
            border: '1px solid rgba(107,157,170,0.22)',
            fontSize: tag.size, fontWeight: 500,
            color: tag.dim ? 'rgba(107,157,170,0.45)' : 'var(--teal)',
            whiteSpace: 'nowrap', userSelect: 'none',
          }}>
            {tag.text}
          </div>
        ))}
      </div>
    </div>
  )
}
