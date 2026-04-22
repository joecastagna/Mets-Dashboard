interface BaseRunnersProps {
  onFirst: boolean
  onSecond: boolean
  onThird: boolean
  outs: number
  size?: 'sm' | 'md' | 'lg'
}

export function BaseRunners({ onFirst, onSecond, onThird, outs, size = 'md' }: BaseRunnersProps) {
  const dim = size === 'sm' ? 60 : size === 'md' ? 90 : 120
  const baseSize = size === 'sm' ? 12 : size === 'md' ? 18 : 24
  const cx = dim / 2
  const cy = dim / 2
  const r = dim * 0.38

  const positions = {
    first:  { x: cx + r * Math.cos(-Math.PI / 4), y: cy + r * Math.sin(-Math.PI / 4) },
    second: { x: cx,                               y: cy - r },
    third:  { x: cx - r * Math.cos(-Math.PI / 4), y: cy + r * Math.sin(-Math.PI / 4) },
    home:   { x: cx,                               y: cy + r },
  }

  const activeFill = '#FF5910'
  const inactiveFill = '#1A2E48'
  const activeStroke = '#FF8A50'
  const inactiveStroke = '#2A4A6A'
  const homeColor = '#E8F4FD'

  function Diamond({ x, y, active, isHome = false }: { x: number; y: number; active: boolean; isHome?: boolean }) {
    const s = isHome ? baseSize * 0.85 : baseSize
    const fill = isHome ? 'none' : active ? activeFill : inactiveFill
    const stroke = isHome ? homeColor : active ? activeStroke : inactiveStroke
    const sw = active ? 2.5 : 1.5
    const glow = active && !isHome ? `drop-shadow(0 0 4px ${activeFill})` : undefined

    return (
      <polygon
        points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        style={{ filter: glow }}
      />
    )
  }

  const basePaths = [
    { from: positions.home, to: positions.first },
    { from: positions.first, to: positions.second },
    { from: positions.second, to: positions.third },
    { from: positions.third, to: positions.home },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} className="overflow-visible">
        {basePaths.map((p, i) => (
          <line
            key={i}
            x1={p.from.x} y1={p.from.y}
            x2={p.to.x} y2={p.to.y}
            stroke="#2A4A6A"
            strokeWidth={1}
          />
        ))}
        <Diamond x={positions.third.x} y={positions.third.y} active={onThird} />
        <Diamond x={positions.second.x} y={positions.second.y} active={onSecond} />
        <Diamond x={positions.first.x} y={positions.first.y} active={onFirst} />
        <Diamond x={positions.home.x} y={positions.home.y} active={false} isHome />
      </svg>

      <div className="flex gap-2 items-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: size === 'sm' ? 8 : 10,
              height: size === 'sm' ? 8 : 10,
              background: i < outs ? '#FF4D6D' : '#1A2E48',
              border: `1.5px solid ${i < outs ? '#FF6B85' : '#2A4A6A'}`,
              boxShadow: i < outs ? '0 0 6px rgba(255,77,109,0.5)' : 'none',
            }}
          />
        ))}
        <span className="text-[10px] font-bold tracking-wider" style={{ color: '#8BAFC8' }}>
          {outs === 1 ? '1 OUT' : `${outs} OUTS`}
        </span>
      </div>
    </div>
  )
}

export function BaseStateText({ onFirst, onSecond, onThird }: { onFirst: boolean; onSecond: boolean; onThird: boolean }) {
  const runners = [
    onFirst && '1B',
    onSecond && '2B',
    onThird && '3B',
  ].filter(Boolean)

  if (runners.length === 0) return <span style={{ color: '#4A6A88' }}>Bases empty</span>
  if (runners.length === 3) return <span style={{ color: '#FF5910' }}>Bases loaded</span>
  return <span style={{ color: '#FFB347' }}>Runner(s) on {runners.join(', ')}</span>
}
