import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  {
    path: '/',
    label: 'Лента',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="5" rx="1" fill={active ? 'var(--coral)' : 'none'} stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="13" y="3" width="8" height="5" rx="1" fill="none" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="3" y="11" width="8" height="5" rx="1" fill="none" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="13" y="11" width="8" height="5" rx="1" fill="none" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="3" y="19" width="18" height="2" rx="1" fill={active ? 'var(--coral)' : 'var(--text-hint)'}/>
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Поиск',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.8"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/add',
    label: 'Добавить',
    icon: (_active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--coral)"/>
        <line x1="12" y1="7" x2="12" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    primary: true,
  },
  {
    path: '/library',
    label: 'Каталог',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="4" height="16" rx="1" fill={active ? 'var(--coral)' : 'none'} stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="10" y="4" width="4" height="16" rx="1" fill="none" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
        <rect x="16" y="4" width="4" height="16" rx="1" fill="none" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Профиль',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={active ? 'var(--coral)' : 'none'} stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.7"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? 'var(--coral)' : 'var(--text-hint)'} strokeWidth="1.7" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
]

export function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="navbar-mobile"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex',
        background: 'var(--bg)',
        borderTop: '2px solid var(--text)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              padding: tab.primary ? '10px 0 12px' : '10px 0 12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {tab.icon(active)}
            <span style={{
              fontSize: 10,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '0.02em',
              color: tab.primary
                ? 'var(--coral)'
                : active
                  ? 'var(--coral)'
                  : 'var(--text-hint)',
              fontWeight: active || tab.primary ? 600 : 400,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
