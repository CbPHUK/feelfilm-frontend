import { useState, useEffect, useRef } from 'react'
import { Logo } from '../components/Logo'
import { api } from '../api/client'

interface AuthPageProps {
  onDone: (firstName: string) => void
  modal?: boolean
}

type Screen = 'choose' | 'login' | 'register' | 'verify'
type Method = 'email' | 'telegram'

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? ''

function Input({
  label, type = 'text', value, onChange, placeholder, autoFocus,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-hint)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '12px 14px',
          borderRadius: 'var(--r-md)',
          border: '1.5px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          color: 'var(--text)', fontSize: 15,
          outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--coral)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)' }}
      />
    </div>
  )
}

function Btn({
  children, onClick, loading, variant = 'primary', disabled,
}: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean
  variant?: 'primary' | 'secondary' | 'telegram'; disabled?: boolean
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--coral)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--glass-bg)', color: 'var(--text-secondary)', border: '1.5px solid var(--glass-border)' },
    telegram: { background: '#2AABEE', color: '#fff', border: 'none' },
  }
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="hover-btn"
      style={{
        width: '100%', padding: '13px 20px',
        borderRadius: 'var(--r-md)',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        opacity: loading || disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...styles[variant],
      }}
    >
      {loading ? <span style={{ animation: 'spin 0.6s linear infinite', display: 'inline-block' }}>◌</span> : children}
    </button>
  )
}

function TelegramWidget({ onSuccess }: { onSuccess: (firstName: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!BOT_USERNAME || !ref.current) return

    // Глобальный callback для Telegram Widget
    ;(window as unknown as Record<string, unknown>).onTelegramAuth = async (user: Record<string, unknown>) => {
      try {
        const res = await api.auth.telegramWidget(user)
        localStorage.setItem('ff_token', res.token)
        localStorage.setItem('ff_display_name', res.user.firstName)
        onSuccess(res.user.firstName)
      } catch (e) {
        console.error('Telegram widget auth failed', e)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    ref.current.appendChild(script)

    return () => {
      if (ref.current) ref.current.innerHTML = ''
    }
  }, [onSuccess])

  if (!BOT_USERNAME) {
    return (
      <div style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textAlign: 'center', fontSize: 13, color: 'var(--text-hint)' }}>
        Telegram вход настраивается...
      </div>
    )
  }

  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }} />
}

export function AuthPage({ onDone, modal }: AuthPageProps) {
  const [screen, setScreen] = useState<Screen>('choose')
  const [method, setMethod] = useState<Method>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Авто-вход через Telegram Mini App
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (initData) {
      setLoading(true)
      api.auth.telegram()
        .then((res) => {
          localStorage.setItem('ff_token', res.token)
          localStorage.setItem('ff_display_name', res.user.firstName)
          onDone(res.user.firstName)
        })
        .catch(() => setLoading(false))
    }
  }, [onDone])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleRegister = async () => {
    setError('')
    setLoading(true)
    try {
      await api.auth.register({ email, password, firstName })
      setScreen('verify')
      setResendCooldown(60)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login({ email, password })
      localStorage.setItem('ff_token', res.token)
      localStorage.setItem('ff_display_name', res.user.firstName)
      onDone(res.user.firstName)
    } catch (e: unknown) {
      const err = e as { needsVerification?: boolean; message?: string }
      if (err.needsVerification) {
        setScreen('verify')
      } else {
        setError(err.message ?? 'Ошибка входа')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.verifyEmail({ email, code })
      localStorage.setItem('ff_token', res.token)
      localStorage.setItem('ff_display_name', res.user.firstName)
      onDone(res.user.firstName)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await api.auth.resendCode(email)
      setResendCooldown(60)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const spinner = (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <span style={{ fontSize: 32, color: 'var(--coral)', animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>◌</span>
    </div>
  )

  if (loading && !error) {
    if (modal) return spinner
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        {spinner}
      </div>
    )
  }

  const card = (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
      {/* Лого */}
      {!modal && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size={32} withText />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            Эмоциональный поиск фильмов
          </p>
        </div>
      )}

      {/* Карточка */}
      <div style={{
        background: 'var(--glass-bg-heavy)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--glass-border)',
        padding: '28px 24px',
        boxShadow: 'var(--glass-shadow)',
      }}>

        {/* Выбор метода */}
        {screen === 'choose' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: 'var(--text)' }}>Добро пожаловать</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Выберите способ входа</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['email', 'telegram'] as Method[]).map((m) => (
                <button key={m} onClick={() => setMethod(m)} style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--r-md)',
                  border: `1.5px solid ${method === m ? 'var(--coral)' : 'var(--glass-border)'}`,
                  background: method === m ? 'var(--coral-muted)' : 'transparent',
                  color: method === m ? 'var(--coral)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {m === 'email' ? '✉ Email' : '✈ Telegram'}
                </button>
              ))}
            </div>

            {method === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn onClick={() => setScreen('login')}>Войти</Btn>
                <Btn variant="secondary" onClick={() => setScreen('register')}>Создать аккаунт</Btn>
              </div>
            )}

            {method === 'telegram' && (
              <TelegramWidget onSuccess={onDone} />
            )}
          </>
        )}

        {/* Вход по email */}
        {screen === 'login' && (
          <>
            <button onClick={() => setScreen('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)', fontSize: 12, marginBottom: 16, padding: 0 }}>← Назад</button>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: 'var(--text)' }}>Вход</h2>
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            <Input label="Пароль" type="password" value={password} onChange={setPassword} placeholder="••••••" />
            {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <Btn onClick={handleLogin} loading={loading}>Войти</Btn>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-hint)', marginTop: 12 }}>
              Нет аккаунта?{' '}
              <button onClick={() => { setScreen('register'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 12, padding: 0 }}>
                Зарегистрироваться
              </button>
            </p>
          </>
        )}

        {/* Регистрация */}
        {screen === 'register' && (
          <>
            <button onClick={() => setScreen('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)', fontSize: 12, marginBottom: 16, padding: 0 }}>← Назад</button>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: 'var(--text)' }}>Регистрация</h2>
            <Input label="Имя" value={firstName} onChange={setFirstName} placeholder="Как вас зовут?" autoFocus />
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Input label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Минимум 6 символов" />
            {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <Btn onClick={handleRegister} loading={loading}>Создать аккаунт</Btn>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-hint)', marginTop: 12 }}>
              Уже есть аккаунт?{' '}
              <button onClick={() => { setScreen('login'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 12, padding: 0 }}>
                Войти
              </button>
            </p>
          </>
        )}

        {/* Ввод кода */}
        {screen === 'verify' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: 'var(--text)' }}>Введите код</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Отправили код на <strong>{email}</strong>
            </p>
            <Input label="Код подтверждения" value={code} onChange={setCode} placeholder="123456" autoFocus />
            {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <Btn onClick={handleVerify} loading={loading}>Подтвердить</Btn>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-hint)', marginTop: 12 }}>
              Не пришло?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', color: resendCooldown > 0 ? 'var(--text-hint)' : 'var(--coral)', fontSize: 12, padding: 0 }}
              >
                {resendCooldown > 0 ? `Повторить через ${resendCooldown}с` : 'Отправить снова'}
              </button>
            </p>
          </>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-hint)', marginTop: 16 }}>
        Регистрируясь, вы соглашаетесь с{' '}
        <a href="/privacy" style={{ color: 'var(--text-hint)', textDecoration: 'underline' }}>политикой конфиденциальности</a>
      </p>
    </div>
  )

  if (modal) return card

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      {/* Фон */}
      <div className="bg-blobs" style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>
      {card}
    </div>
  )
}
