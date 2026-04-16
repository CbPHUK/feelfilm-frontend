interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

export function FilmCardSkeleton() {
  return (
    <div style={{
      display: 'flex', gap: 14,
      margin: '0 16px 10px', padding: '14px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)',
    }}>
      <Skeleton width={62} height={93} borderRadius="var(--r-sm)" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <Skeleton width="72%" height={16} />
        <Skeleton width="28%" height={12} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <Skeleton width={68} height={24} borderRadius={999} />
          <Skeleton width={76} height={24} borderRadius={999} />
          <Skeleton width={60} height={24} borderRadius={999} />
        </div>
        <Skeleton width="22%" height={11} style={{ marginTop: 4 }} />
      </div>
    </div>
  )
}
