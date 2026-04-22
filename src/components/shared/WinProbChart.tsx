import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

interface WinProbPoint {
  label: string
  prob: number
  event?: string
}

interface WinProbChartProps {
  data: WinProbPoint[]
  currentProb: number
  compact?: boolean
}

interface TooltipPayload {
  value: number
  payload: WinProbPoint
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{
      background: '#0A1628',
      border: '1px solid #1A2E48',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div className="font-bold" style={{ color: '#1E6DC5' }}>{Math.round(d.value * 100)}% Mets</div>
      {d.payload.event && <div style={{ color: '#8BAFC8' }}>{d.payload.event}</div>}
      <div style={{ color: '#4A6A88' }}>{d.payload.label}</div>
    </div>
  )
}

export function WinProbChart({ data, currentProb, compact = false }: WinProbChartProps) {
  const pct = Math.round(currentProb * 100)

  return (
    <div className="w-full" style={{ height: compact ? 100 : 160 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8BAFC8' }}>
          Win Probability
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold" style={{
            color: pct >= 50 ? '#22D3A5' : '#FF4D6D',
            textShadow: `0 0 12px ${pct >= 50 ? 'rgba(34,211,165,0.5)' : 'rgba(255,77,109,0.5)'}`,
          }}>
            {pct}%
          </span>
          <span className="text-[10px]" style={{ color: '#4A6A88' }}>METS</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="wpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E6DC5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#1E6DC5" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`}
            tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0.5} stroke="#2A4A6A" strokeDasharray="4 4" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="#1E6DC5"
            strokeWidth={2}
            fill="url(#wpGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#1E6DC5', stroke: '#E8F4FD', strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function Sparkline({ data, color = '#1E6DC5', height = 32, width = 80 }: SparklineProps) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(pts.split(' ').pop()!.split(',')[0])}
        cy={parseFloat(pts.split(' ').pop()!.split(',')[1])}
        r={2.5} fill={color} />
    </svg>
  )
}
