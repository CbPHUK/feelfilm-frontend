import { Logo } from '../components/Logo'

interface WelcomePageProps {
  onSignIn: () => void
  onGuest: () => void
}

const features = [
  { icon: '◈', text: 'Найди фильм по настроению — не по рейтингу, а по ощущениям' },
  { icon: '◌', text: 'Читай что чувствовали другие после просмотра' },
  { icon: '✦', text: 'Делись впечатлениями и помогай другим выбрать' },
]

export function WelcomePage({ onSignIn, onGuest }: WelcomePageProps) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', position: 'relative', overflow: 'hidden',
    }}>
      <div className="bg-blobs" style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>
      <div className="jp-lines" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div className="scan-lines" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div className="light-leak light-leak-1" />
      <div className="light-leak light-leak-2" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Лого */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Logo size={36} withText />
          <p style={{
            fontSize: 11, color: 'var(--text-hint)', marginTop: 8,
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
          }}>
            Эмоциональный поиск фильмов
          </p>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontSize: 'clamp(38px, 10vw, 58px)',
            fontWeight: 900, letterSpacing: '-0.04em',
            lineHeight: 0.92, color: 'var(--text)', marginBottom: 16,
          }}>
            Не оценки.<br />Ощущения.
          </h1>
          <p style={{
            fontSize: 15, color: 'var(--text-secondary)',
            lineHeight: 1.7, maxWidth: '38ch', margin: '0 auto',
          }}>
            215+ фильмов и аниме — отобранных по эмоциям, которые они вызывают.
          </p>
        </div>

        {/* Фичи */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--glass-border)',
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          {features.map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0' }}>
              <span style={{ fontSize: 15, color: 'var(--coral)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onSignIn}
            className="hover-btn"
            style={{
              padding: '14px 24px', borderRadius: 'var(--r-md)', border: 'none',
              background: 'var(--coral)', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(208,112,106,0.40)',
              transition: 'all 0.2s',
            }}
          >
            Войти / Зарегистрироваться
          </button>
          <button
            onClick={onGuest}
            className="hover-btn"
            style={{
              padding: '13px 24px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Смотреть без регистрации
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 11,
          color: 'var(--text-hint)', marginTop: 20, lineHeight: 1.6,
        }}>
          С аккаунтом: добавляй отзывы, ставь лайки, сохраняй историю просмотров
        </p>
      </div>
    </div>
  )
}
