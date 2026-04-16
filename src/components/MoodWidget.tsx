import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'

interface MoodWidgetProps {
  films: Array<{ reviews?: Array<{ effectAfter: string[]; moodBefore: string[] }> }>
}

export function MoodWidget({ films }: MoodWidgetProps) {
  const { t } = useLang()

  const top = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const film of films)
      for (const r of film.reviews ?? [])
        for (const tag of [...r.effectAfter, ...r.moodBefore])
          counts[tag] = (counts[tag] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag)
  }, [films])

  if (top.length === 0) return null

  return (
    <div style={{
      margin: '0 16px 14px', padding: '14px 16px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--coral-muted)',
      border: '1px solid rgba(208,112,106,0.20)',
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--coral)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
        {t.nowInFeed}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {top.map((tag, i) => (
          <span key={tag} style={{
            fontSize: 12, padding: '4px 12px', borderRadius: 'var(--r-pill)',
            background: i % 2 === 0 ? 'rgba(208,112,106,0.14)' : 'rgba(107,157,170,0.14)',
            color: i % 2 === 0 ? 'var(--coral)' : 'var(--teal)',
            fontWeight: 500,
            border: `1px solid ${i % 2 === 0 ? 'rgba(208,112,106,0.22)' : 'rgba(107,157,170,0.22)'}`,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
