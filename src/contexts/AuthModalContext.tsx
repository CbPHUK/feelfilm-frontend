import { createContext, useContext } from 'react'

interface AuthModalCtx {
  openAuthModal: () => void
}

export const AuthModalContext = createContext<AuthModalCtx>({ openAuthModal: () => {} })
export const useAuthModal = () => useContext(AuthModalContext)
