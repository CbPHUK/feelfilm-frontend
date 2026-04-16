interface LogoProps {
  size?: number
  withText?: boolean
}

// Четыре цвета из референса
const DOTS = [
  { cx: 12, cy: 12, color: '#E8716B' }, // коралловый
  { cx: 28, cy: 12, color: '#7DC4D4' }, // голубой
  { cx: 12, cy: 28, color: '#E8AA96' }, // персиковый
  { cx: 28, cy: 28, color: '#5B9DB0' }, // синий
]

export function Logo({ size = 40, withText = false }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Четыре круга */}
        {DOTS.map(({ cx, cy, color }) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill={color} />
        ))}
      </svg>

      {withText && (
        <span style={{
          fontSize: 20, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.5px',
        }}>
          Feel<span style={{ color: '#E8716B' }}>Film</span>
        </span>
      )}
    </div>
  )
}
