import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: 'rgba(107,157,170,0.92)', border: 'rgba(107,157,170,0.3)', icon: '✓' },
    error:   { bg: 'rgba(208,112,106,0.92)', border: 'rgba(208,112,106,0.3)', icon: '✕' },
    info:    { bg: 'rgba(55,48,42,0.88)',    border: 'rgba(255,255,255,0.12)', icon: '◎' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 74px)',
        left: 16, right: 16, zIndex: 999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const c = COLORS[t.type]
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              background: c.bg,
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${c.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              color: '#fff',
              fontSize: 14, fontWeight: 500,
              animation: 'toastIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, opacity: 0.9 }}>{c.icon}</span>
              {t.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
