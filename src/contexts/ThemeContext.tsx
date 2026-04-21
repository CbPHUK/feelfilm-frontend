import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {}, setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ff_theme') as Theme | null
    if (saved) return saved
    // Если открыто в Telegram — берём его цветовую схему
    const tgScheme = window.Telegram?.WebApp?.colorScheme
    if (tgScheme === 'dark' || tgScheme === 'light') return tgScheme
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ff_theme', theme)
  }, [theme])

  // Следим за сменой темы в Telegram (пользователь переключает в настройках TG)
  useEffect(() => {
    const tgApp = window.Telegram?.WebApp
    if (!tgApp) return
    const handleThemeChange = () => {
      const tgScheme = tgApp.colorScheme
      if (tgScheme === 'dark' || tgScheme === 'light') {
        setThemeState(tgScheme)
      }
    }
    tgApp.onEvent('themeChanged', handleThemeChange)
    return () => tgApp.offEvent('themeChanged', handleThemeChange)
  }, [])

  const toggle = () => setThemeState(t => t === 'light' ? 'dark' : 'light')
  const setTheme = (t: Theme) => setThemeState(t)

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
