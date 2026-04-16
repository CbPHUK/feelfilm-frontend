import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider, useLang } from './contexts/LangContext'
import { ToastProvider } from './contexts/ToastContext'
import { useTheme } from './contexts/ThemeContext'
import { NavBar } from './components/NavBar'
import { Logo } from './components/Logo'
import { AuthPage } from './pages/AuthPage'
import { FeedPage } from './pages/FeedPage'
import { SearchPage } from './pages/SearchPage'
import { FilmPage } from './pages/FilmPage'
import { AddReviewPage } from './pages/AddReviewPage'
import { ProfilePage } from './pages/ProfilePage'
import { BooksPage } from './pages/BooksPage'
import { PrivacyPage } from './pages/PrivacyPage'

function SidebarSettings() {
  const { theme, toggle } = useTheme()
  const { lang, setLang } = useLang()
  const isDark = theme === 'dark'
  return (
    <div style={{
      marginTop: 12, padding: '12px 14px',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--glass-border)',
      background: 'var(--glass-bg)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Тема */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{isDark ? 'Тёмная' : 'Светлая'}</span>
        <button
          onClick={toggle}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: isDark ? 'var(--coral)' : 'rgba(160,145,132,0.25)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s', padding: 0, flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: isDark ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            display: 'block',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>
      {/* Язык */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>Язык / Lang</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ru', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '2px 10px', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--glass-border)',
              background: lang === l ? 'var(--coral)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--text-hint)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()

  const tabs = [
    { path: '/',        icon: '▦', label: t.feed },
    { path: '/search',  icon: '◎', label: t.search },
    { path: '/books',   icon: '◉', label: t.books },
    { path: '/add',     icon: '✦', label: t.share },
    { path: '/profile', icon: '◈', label: t.profile },
  ]

  return (
    <aside className="app-sidebar">
      <div style={{ marginBottom: 32, paddingLeft: 8 }}>
        <Logo size={28} withText />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '11px 14px',
                borderRadius: 'var(--r-md)', border: 'none',
                background: active ? 'rgba(208,112,106,0.12)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(160,145,132,0.10)' }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 17, color: active ? 'var(--coral)' : 'var(--text-hint)', width: 20, textAlign: 'center' }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? 'var(--coral)' : 'var(--text-secondary)',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Настройки внизу сайдбара */}
      <SidebarSettings />
    </aside>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function BgBlobs() {
  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      {/* Японские линии */}
      <div className="jp-lines" />
      {/* Scan-lines */}
      <div className="scan-lines" />
      {/* Плёночные засветы */}
      <div className="light-leak light-leak-1" />
      <div className="light-leak light-leak-2" />
      <div className="light-leak light-leak-3" />
    </>
  )
}

function Footer() {
  const navigate = useNavigate()
  return (
    <footer style={{
      padding: '24px 20px',
      borderTop: '1px solid var(--glass-border)',
      marginTop: 32,
      display: 'flex', flexWrap: 'wrap', gap: 8,
      alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-hint)' }}>© 2026 FeelFilm</p>
        <p style={{ fontSize: 10, color: 'var(--text-hint)', opacity: 0.6, marginTop: 2 }}>
          Data from{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer"
            style={{ color: 'var(--text-hint)', textDecoration: 'underline' }}>
            TMDB
          </a>
          {' '}& MyAnimeList
        </p>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/privacy')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, color: 'var(--text-hint)', fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--coral)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-hint)' }}
        >
          Политика конфиденциальности
        </button>
        <a
          href="mailto:feelfilm.app@gmail.com"
          style={{ fontSize: 11, color: 'var(--text-hint)', textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--coral)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-hint)' }}
        >
          Обратная связь
        </a>
      </div>
    </footer>
  )
}

function AppInner() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('ff_token'))

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
  }, [])

  const handleAuthDone = (firstName: string) => {
    localStorage.setItem('ff_onboarded', '1')
    localStorage.setItem('ff_display_name', firstName)
    setAuthed(true)
  }

  if (!authed) {
    return <AuthPage onDone={handleAuthDone} />
  }

  return (
    <>
      <ScrollToTop />
      <BgBlobs />
      <div className="app-layout">
        <Sidebar />
        <div className="app-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/"         element={<><FeedPage /><NavBar /></>} />
              <Route path="/search"   element={<><SearchPage /><NavBar /></>} />
              <Route path="/books"    element={<><BooksPage /><NavBar /></>} />
              <Route path="/film/:id" element={<FilmPage />} />
              <Route path="/add"      element={<><AddReviewPage /><NavBar /></>} />
              <Route path="/profile"  element={<><ProfilePage /><NavBar /></>} />
              <Route path="/privacy"  element={<PrivacyPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
