interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

interface TelegramWebApp {
  ready(): void
  expand(): void
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  HapticFeedback?: TelegramHapticFeedback
  openTelegramLink(url: string): void
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
