interface GaugeProps {
  value: number
  min?: number
  max?: number
  label: string
  unit?: string
  size?: number
  colorOverride?: string
}

export function GaugeChart({ value, min = 0, max = 100, label, unit = '', size = 80, colorOverride }: GaugeProps) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const angle = -225 + pct * 270
  const strokeW = size * 0.1
  const r = (size / 2) - strokeW
  const cx = size / 2
  const cy = size / 2

  const arcLength = 2 * Math.PI * r * (270 / 360)
  const dashOffset = arcLength * (1 - pct)

  const color = colorOverride ?? (pct > 0.75 ? '#22D3A5' : pct > 0.5 ? '#60B4FF' : pct > 0.25 ? '#FFB347' : '#FF4D6D')

  const startAngle = -225 * (Math.PI / 180)
  const endAngle = 45 * (Math.PI / 180)

  function polarToCart(ang: number) {
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) }
  }

  const start = polarToCart(startAngle)
  const end = polarToCart(endAngle)
  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`

  const needleAngle = (-225 + pct * 270) * (Math.PI / 180)
  const needleLen = r * 0.7
  const needleTip = { x: cx + needleLen * Math.cos(needleAngle), y: cy + needleLen * Math.sin(needleAngle) }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <path d={bgPath} fill="none" stroke="#1A2E48" strokeWidth={strokeW} strokeLinecap="round" />
        <path
          d={bgPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke="#E8F4FD"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={strokeW * 0.4} fill="#E8F4FD" />
        <text x={cx} y={cy + strokeW * 1.5} textAnchor="middle" fill={color}
          fontSize={size * 0.18} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
          {typeof value === 'number' ? value.toFixed(value > 100 ? 0 : 1) : value}{unit}
        </text>
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>
        {label}
      </span>
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  label: string
  color?: string
  showValue?: boolean
  valueDisplay?: string
  height?: number
  className?: string
}

export function ProgressBar({ value, max = 1, label, color = '#1E6DC5', showValue = true, valueDisplay, height = 6, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>
          {label}
        </span>
        {showValue && (
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {valueDisplay ?? `${pct.toFixed(1)}%`}
          </span>
        )}
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#1A2E48' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}CC, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

interface WinProbBarProps {
  metsProb: number
  metsName?: string
  oppName?: string
}

export function WinProbBar({ metsProb, metsName = 'METS', oppName = 'OPP' }: WinProbBarProps) {
  const mPct = Math.round(metsProb * 100)
  const oPct = 100 - mPct

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-bold tracking-wider">
        <span style={{ color: '#1E6DC5' }}>{metsName} {mPct}%</span>
        <span style={{ color: '#8BAFC8' }}>WIN PROBABILITY</span>
        <span style={{ color: '#8BAFC8' }}>{oPct}% {oppName}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: '#1A2E48' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${mPct}%`,
            background: 'linear-gradient(90deg, #002D72, #1E6DC5)',
            boxShadow: '2px 0 8px rgba(30,109,197,0.5)',
          }}
        />
        <div
          className="h-full flex-1"
          style={{ background: 'linear-gradient(90deg, #3A1A0A, #6B2A0A)' }}
        />
      </div>
    </div>
  )
}
