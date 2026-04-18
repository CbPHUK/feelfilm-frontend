import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

export function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()

  const tabs = [
    { path: '/',        label: t.feed },
    { path: '/search',  label: t.search },
    { path: '/add',     label: t.share },
    { path: '/library', label: 'Каталог' },
    { path: '/profile', label: t.profile },
  ]

  return (
    <nav className="navbar-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex',
      background: '#e9e2cf',
      borderTop: '1px solid #1b1d2a',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, padding: '12px 0 10px',
              background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 2,
              position: 'relative',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            <span style={{
              fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: active ? '#d64026' : 'rgba(27,29,42,0.45)',
              fontWeight: active ? 700 : 400,
            }}>
              {tab.label}
            </span>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 20, height: 2, background: '#d64026',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
