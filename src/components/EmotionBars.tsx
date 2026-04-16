import { useLang } from '../contexts/LangContext'
import type { Review } from '../types'

interface EmotionBarsProps { reviews: Review[] }

function topTags(reviews: Review[], key: 'moodBefore' | 'effectAfter' | 'atmosphere', n = 4) {
  const counts: Record<string, number> = {}
  for (const r of reviews) for (const tag of r[key] ?? []) counts[tag] = (counts[tag] ?? 0) + 1
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([tag, count]) => ({ tag, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
}

export function EmotionBars({ reviews }: EmotionBarsProps) {
  const { t } = useLang()

  const LAYER_CONFIG = [
    { key: 'moodBefore'  as const, label: t.cameWith, color: 'var(--coral)', bg: 'var(--coral-muted)' },
    { key: 'effectAfter' as const, label: t.leftWith,  color: 'var(--teal)',  bg: 'var(--teal-muted)' },
    { key: 'atmosphere'  as const, label: t.vibe,      color: '#A09184',     bg: 'rgba(160,145,132,0.12)' },
  ]

  if (reviews.length === 0) return null
  return (
    <div style={{
      margin: '0 16px 10px', padding: '18px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow-sm)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>
        {t.emotionPortrait}
      </p>
      {LAYER_CONFIG.map(({ key, label, color, bg }) => {
        const tags = topTags(reviews, key)
        if (!tags.length) return null
        return (
          <div key={key} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 8 }}>{label}</p>
            {tags.map(({ tag, pct }) => (
              <div key={tag} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{tag}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: bg, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, opacity: 0.7, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
