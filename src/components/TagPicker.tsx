interface TagPickerProps {
  label: string
  tags: readonly string[]
  selected: string[]
  onChange: (tags: string[]) => void
  max?: number
  accent?: 'coral' | 'teal'
}

export function TagPicker({ label, tags, selected, onChange, max = 3, accent = 'coral' }: TagPickerProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
    } else if (selected.length < max) {
      onChange([...selected, tag])
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium')
    }
  }

  const activeBg    = accent === 'coral' ? 'var(--coral)'       : 'var(--teal)'
  const activeMuted = accent === 'coral' ? 'var(--coral-muted)'  : 'var(--teal-muted)'

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-hint)' }}>{selected.length}/{max}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {tags.map((tag) => {
          const active = selected.includes(tag)
          const disabled = !active && selected.length >= max
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={disabled ? '' : 'hover-tag'}
              style={{
                padding: '7px 15px', borderRadius: 'var(--r-pill)',
                border: active ? `1.5px solid ${activeBg}` : '1.5px solid var(--glass-border)',
                background: active ? activeBg : 'var(--glass-bg)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: active ? '#fff' : disabled ? 'var(--text-hint)' : 'var(--text)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                boxShadow: active ? `0 2px 10px ${activeMuted}` : 'none',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
