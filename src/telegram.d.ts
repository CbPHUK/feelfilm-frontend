interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

interface TelegramBackButton {
  isVisible: boolean
  show(): void
  hide(): void
  onClick(cb: () => void): void
  offClick(cb: () => void): void
}

interface TelegramMainButton {
  text: string
  color: string
  textColor: string
  isVisible: boolean
  isActive: boolean
  setText(text: string): void
  show(): void
  hide(): void
  enable(): void
  disable(): void
  onClick(cb: () => void): void
  offClick(cb: () => void): void
}

interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

interface TelegramWebApp {
  ready(): void
  expand(): void
  close(): void
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      photo_url?: string
      language_code?: string
    }
    start_param?: string
    auth_date?: number
    hash?: string
  }
  colorScheme: 'light' | 'dark'
  themeParams: TelegramThemeParams
  viewportHeight: number
  viewportStableHeight: number
  isExpanded: boolean
  platform: string
  version: string
  HapticFeedback: TelegramHapticFeedback
  BackButton: TelegramBackButton
  MainButton: TelegramMainButton
  onEvent(eventType: string, cb: () => void): void
  offEvent(eventType: string, cb: () => void): void
  openLink(url: string): void
  openTelegramLink(url: string): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback: (ok: boolean) => void): void
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
