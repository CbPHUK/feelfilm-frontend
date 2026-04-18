import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import { ToastProvider } from './contexts/ToastContext'
import { AuthModalContext } from './contexts/AuthModalContext'
import { NavBar } from './components/NavBar'
import { AuthPage } from './pages/AuthPage'
import { WelcomePage } from './pages/WelcomePage'
import { FeedPage } from './pages/FeedPage'
import { SearchPage } from './pages/SearchPage'
import { FilmPage } from './pages/FilmPage'
import { AddReviewPage } from './pages/AddReviewPage'
import { ProfilePage } from './pages/ProfilePage'
import { BooksPage } from './pages/BooksPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { WorkPage } from './pages/WorkPage'
import { LibraryPage } from './pages/LibraryPage'
import { api } from './api/client'

// ── Design tokens (shared) ──────────────────────────────────────
const T = {
  paper:   '#e9e2cf',
  ink:     '#1b1d2a',
  inkSoft: 'rgba(27,29,42,0.62)',
  inkMute: 'rgba(27,29,42,0.45)',
  rule:    'rgba(27,29,42,0.18)',
  ruleSoft:'rgba(27,29,42,0.10)',
  red:     '#d64026',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
  display: '"Unbounded", "Inter", sans-serif',
  sans:    '"Inter", -apple-system, system-ui, sans-serif',
}

function todayLabel(): string {
  const d = new Date()
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${days[d.getDay()]} · ${dd}.${mm}.${yy}`
}

// ── Global TopBar ───────────────────────────────────────────────
function TopBar({ onWrite }: { onWrite: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const name = localStorage.getItem('ff_display_name') ?? ''
  const token = localStorage.getItem('ff_token')

  const nav = [
    { l: 'лента',    path: '/' },
    { l: 'поиск',    path: '/search' },
    { l: 'книги',    path: '/books' },
    { l: 'каталог',  path: '/library' },
    { l: 'профиль',  path: '/profile' },
  ]

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: T.paper, borderBottom: `1px solid ${T.ink}`,
    }}>
      {/* meta strip */}
      <div style={{
        padding: '5px 40px', display: 'flex', justifyContent: 'space-between',
        fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.inkMute,
        textTransform: 'uppercase', borderBottom: `1px solid ${T.ruleSoft}`,
      }}>
        <span className="topbar-meta-hide">{todayLabel()}</span>
        <span>フィールフィルム · эмоциональный журнал кино</span>
        <span className="topbar-meta-hide">ru</span>
      </div>

      {/* main nav */}
      <div style={{
        padding: '10px 40px',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', gap: 24,
      }}>
        {/* logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}
        >
          <div style={{
            fontFamily: T.display, fontSize: 18, fontWeight: 800,
            letterSpacing: -0.6, lineHeight: 1, color: T.ink,
          }}>
            FeelFilm<span style={{ color: T.red }}>.</span>
          </div>
          <span style={{
            fontFamily: T.mono, fontSize: 9, color: T.inkMute, letterSpacing: 1.2,
            textTransform: 'uppercase',
          }} className="topbar-meta-hide">v.4 · 2026</span>
        </div>

        {/* nav links */}
        <nav style={{ display: 'flex', gap: 20, justifyContent: 'center' }} className="topbar-nav">
          {nav.map(n => (
            <button
              key={n.l}
              onClick={() => navigate(n.path)}
              style={{
                fontSize: 13,
                color: pathname === n.path ? T.ink : T.inkSoft,
                fontWeight: pathname === n.path ? 600 : 400,
                paddingBottom: 2, background: 'none', border: 'none',
                borderBottom: `2px solid ${pathname === n.path ? T.red : 'transparent'}`,
                cursor: 'pointer', fontFamily: T.sans,
              }}
            >
              {n.l}
            </button>
          ))}
        </nav>

        {/* actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onWrite}
            className="topbar-write-btn"
            style={{
              background: 'transparent', border: `1px solid ${T.rule}`,
              padding: '6px 12px', fontSize: 12, color: T.inkSoft,
              fontFamily: T.sans, cursor: 'pointer', borderRadius: 3,
            }}
          >
            + написать отзыв
          </button>
          {token && name && (
            <div
              onClick={() => navigate('/profile')}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: T.ink,
                color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

type AppScreen = 'welcome' | 'auth' | 'main'

function AppInner() {
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (
      localStorage.getItem('ff_token') ||
      localStorage.getItem('ff_visited') ||
      localStorage.getItem('ff_onboarded')
    ) return 'main'
    return 'welcome'
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()

    const initData = window.Telegram?.WebApp?.initData
    if (initData && !localStorage.getItem('ff_token')) {
      api.auth.telegram()
        .then((res) => {
          localStorage.setItem('ff_token', res.token)
          localStorage.setItem('ff_display_name', res.user.firstName)
          localStorage.setItem('ff_visited', '1')
          setScreen('main')
        })
        .catch(() => {})
    }
  }, [])

  const handleAuthDone = (firstName: string) => {
    localStorage.setItem('ff_display_name', firstName)
    localStorage.setItem('ff_visited', '1')
    setScreen('main')
    setShowAuthModal(false)
  }

  const handleWrite = () => {
    const token = localStorage.getItem('ff_token')
    if (!token) {
      setShowAuthModal(true)
    } else {
      navigate('/add')
    }
  }

  if (screen === 'welcome') {
    return (
      <WelcomePage
        onSignIn={() => setScreen('auth')}
        onGuest={() => {
          localStorage.setItem('ff_visited', '1')
          setScreen('main')
        }}
      />
    )
  }

  if (screen === 'auth') {
    return <AuthPage onDone={handleAuthDone} />
  }

  return (
    <AuthModalContext.Provider value={{ openAuthModal: () => setShowAuthModal(true) }}>
      <>
        <ScrollToTop />
        <div className="app-layout">
          <TopBar onWrite={handleWrite} />
          <div className="app-main">
            <Routes>
              <Route path="/"         element={<><FeedPage /><NavBar /></>} />
              <Route path="/search"   element={<><SearchPage /><NavBar /></>} />
              <Route path="/books"    element={<><BooksPage /><NavBar /></>} />
              <Route path="/library"  element={<><LibraryPage /><NavBar /></>} />
              <Route path="/film/:id" element={<FilmPage />} />
              <Route path="/work/:id" element={<WorkPage />} />
              <Route path="/add"      element={<><AddReviewPage /><NavBar /></>} />
              <Route path="/profile"  element={<><ProfilePage /><NavBar /></>} />
              <Route path="/privacy"  element={<PrivacyPage />} />
            </Routes>
          </div>
        </div>

        {/* Auth modal */}
        {showAuthModal && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(27,29,42,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowAuthModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420, position: 'relative',
                background: T.paper, border: `1px solid ${T.ink}`,
                borderRadius: 4,
              }}
            >
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 10,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'transparent', border: `1px solid ${T.rule}`,
                  color: T.inkSoft, fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
              <AuthPage onDone={handleAuthDone} modal />
            </div>
          </div>
        )}
      </>
    </AuthModalContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
