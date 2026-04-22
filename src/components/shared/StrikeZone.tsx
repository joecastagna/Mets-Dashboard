import type { PlayEvent } from '../../types/mlb'

interface StrikeZoneProps {
  pitches: PlayEvent[]
  size?: number
}

const CALL_COLORS: Record<string, string> = {
  'S': '#FF4D6D',
  'C': '#FFD700',
  'B': '#60B4FF',
  'X': '#22D3A5',
  'F': '#FF8A50',
  'T': '#FF4D6D',
  'W': '#FF4D6D',
  'M': '#FF8A50',
}

const PITCH_COLORS: Record<string, string> = {
  FF: '#FF5910', FT: '#FF7A3A', SI: '#FF8A50',
  FC: '#FFD700', SL: '#1E6DC5', ST: '#4488DD',
  CU: '#B47AFF', KC: '#9B5EE0', CH: '#22D3A5',
  FS: '#2AE8C0', KN: '#E8F4FD',
}

export function StrikeZone({ pitches, size = 220 }: StrikeZoneProps) {
  const padding = 30
  const zoneW = size - padding * 2
  const zoneH = size - padding * 2

  const zoneLeft = padding
  const zoneTop = padding
  const zoneRight = padding + zoneW
  const zoneBottom = padding + zoneH

  function coordToPixel(pX: number, pZ: number) {
    const x = padding + ((pX + 1.5) / 3.0) * zoneW
    const y = padding + ((4.5 - pZ) / 3.0) * zoneH
    return { x, y }
  }

  const pitchEvents = pitches.filter(p => p.isPitch && p.pitchData?.coordinates)

  const innerThirdW = zoneW / 3
  const innerThirdH = zoneH / 3

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8BAFC8' }}>
        Strike Zone
      </div>
      <svg width={size} height={size} style={{ background: 'rgba(10,22,40,0.8)', borderRadius: 8 }}>
        {[1, 2].map(i => (
          <line key={`v${i}`} x1={zoneLeft + i * innerThirdW} y1={zoneTop}
            x2={zoneLeft + i * innerThirdW} y2={zoneBottom}
            stroke="#1A2E48" strokeWidth={1} />
        ))}
        {[1, 2].map(i => (
          <line key={`h${i}`} x1={zoneLeft} y1={zoneTop + i * innerThirdH}
            x2={zoneRight} y2={zoneTop + i * innerThirdH}
            stroke="#1A2E48" strokeWidth={1} />
        ))}

        <rect
          x={zoneLeft} y={zoneTop}
          width={zoneW} height={zoneH}
          fill="none" stroke="#2A4A6A" strokeWidth={2}
        />

        {pitchEvents.map((p, i) => {
          const coords = p.pitchData!.coordinates!
          const { x, y } = coordToPixel(coords.pX, coords.pZ)
          const typeCode = p.details.type?.code ?? 'FF'
          const callCode = p.details.call?.code ?? 'B'
          const color = PITCH_COLORS[typeCode] ?? CALL_COLORS[callCode] ?? '#E8F4FD'
          const isLast = i === pitchEvents.length - 1

          return (
            <g key={i}>
              <circle
                cx={x} cy={y} r={isLast ? 8 : 6}
                fill={color}
                fillOpacity={isLast ? 0.9 : 0.65}
                stroke={isLast ? '#fff' : color}
                strokeWidth={isLast ? 1.5 : 1}
                style={{ filter: isLast ? `drop-shadow(0 0 4px ${color})` : undefined }}
              />
              <text x={x} y={y + 4} textAnchor="middle" fill="#000" fontSize={8} fontWeight="bold">
                {i + 1}
              </text>
            </g>
          )
        })}

        <text x={size / 2} y={size - 8} textAnchor="middle" fill="#4A6A88" fontSize={9}>
          Catcher's View
        </text>
      </svg>

      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {Object.entries(PITCH_COLORS).slice(0, 6).map(([code, color]) => (
          <div key={code} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px]" style={{ color: '#4A6A88' }}>{code}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface HeatZoneProps {
  data: number[][]
  size?: number
}

export function HeatZone({ data, size = 180 }: HeatZoneProps) {
  const rows = data.length
  const cols = data[0]?.length ?? 3
  const cellW = (size - 20) / cols
  const cellH = (size - 20) / rows
  const max = Math.max(...data.flat())

  function heatColor(val: number): string {
    const t = max > 0 ? val / max : 0
    if (t > 0.8) return `rgba(255,77,109,${0.4 + t * 0.6})`
    if (t > 0.5) return `rgba(255,179,71,${0.3 + t * 0.5})`
    if (t > 0.2) return `rgba(96,180,255,${0.2 + t * 0.4})`
    return `rgba(26,46,72,0.5)`
  }

  return (
    <svg width={size} height={size} style={{ background: 'rgba(10,22,40,0.8)', borderRadius: 8 }}>
      {data.map((row, ri) =>
        row.map((val, ci) => {
          const x = 10 + ci * cellW
          const y = 10 + ri * cellH
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width={cellW - 1} height={cellH - 1}
                fill={heatColor(val)} rx={2} />
              {val > 0 && (
                <text x={x + cellW / 2} y={y + cellH / 2 + 4} textAnchor="middle"
                  fill="#E8F4FD" fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {(val * 100).toFixed(0)}%
                </text>
              )}
            </g>
          )
        })
      )}
      <rect x={10} y={10} width={size - 20} height={size - 20}
        fill="none" stroke="#2A4A6A" strokeWidth={1.5} />
    </svg>
  )
}
