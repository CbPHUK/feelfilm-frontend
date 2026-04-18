import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

export function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()

  const tabs = [
    { path: '/',        icon: '▦', label: t.feed },
    { path: '/library', icon: '◉', label: 'Каталог' },
    { path: '/search',  icon: '◎', label: t.search },
    { path: '/add',     icon: '✦', label: t.share },
    { path: '/profile', icon: '◈', label: t.profile },
  ]

  return (
    <nav className="navbar-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex',
      background: 'var(--glass-bg-heavy)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--glass-border)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="hover-nav"
            style={{
              flex: 1, padding: '12px 0 10px',
              background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 3,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 18, color: active ? 'var(--coral)' : 'var(--text-hint)', transition: 'color 0.2s' }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: active ? 'var(--coral)' : 'var(--text-hint)',
              fontWeight: active ? 600 : 400, transition: 'color 0.2s',
            }}>
              {tab.label}
            </span>
            {active && (
              <span style={{
                position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 1px)',
                width: 18, height: 2, borderRadius: 1, background: 'var(--coral)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
