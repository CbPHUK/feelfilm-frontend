import { Onboarding } from '../components/Onboarding'

interface WelcomePageProps {
  onSignIn: () => void
  onGuest: () => void
}

export function WelcomePage({ onSignIn, onGuest }: WelcomePageProps) {
  return <Onboarding onSignIn={onSignIn} onGuest={onGuest} />
}
