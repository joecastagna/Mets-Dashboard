export function fmtAvg(v: number): string {
  if (!v || isNaN(v)) return '.---'
  return v.toFixed(3).replace('0.', '.')
}

export function fmtPct(v: number, decimals = 1): string {
  if (!v || isNaN(v)) return '0.0%'
  return `${(v * 100).toFixed(decimals)}%`
}

export function fmtERA(v: number): string {
  if (!v || isNaN(v)) return '-.--'
  return v.toFixed(2)
}

export function fmtNum(v: number, decimals = 1): string {
  if (v === undefined || v === null || isNaN(v)) return '--'
  return v.toFixed(decimals)
}

export function fmtWHIP(v: number): string {
  if (!v || isNaN(v)) return '-.--'
  return v.toFixed(2)
}

export function fmtVelo(v: number): string {
  if (!v) return '--'
  return `${v.toFixed(1)}`
}

export function fmtWAR(v: number): string {
  if (v === undefined || isNaN(v)) return '--'
  return v.toFixed(1)
}

export function fmtK9(v: number): string {
  if (!v || isNaN(v)) return '--'
  return v.toFixed(1)
}

export function fmtOPS(v: number): string {
  if (!v || isNaN(v)) return '.---'
  return v >= 1 ? v.toFixed(3) : v.toFixed(3).replace('0.', '.')
}

export function fmtPlus(v: number): string {
  if (!v || isNaN(v)) return '---'
  return Math.round(v).toString()
}

export type StatQuality = 'elite' | 'great' | 'above' | 'avg' | 'below' | 'poor'

interface StatRange {
  elite: number
  great: number
  above: number
  avg: number
  below: number
  inverse?: boolean
}

const RANGES: Record<string, StatRange> = {
  avg:          { elite: .300, great: .280, above: .260, avg: .240, below: .220, inverse: false },
  obp:          { elite: .390, great: .360, above: .330, avg: .310, below: .290, inverse: false },
  slg:          { elite: .530, great: .480, above: .430, avg: .390, below: .350, inverse: false },
  ops:          { elite: .920, great: .850, above: .780, avg: .710, below: .640, inverse: false },
  woba:         { elite: .380, great: .350, above: .320, avg: .300, below: .280, inverse: false },
  wrcPlus:      { elite: 145, great: 125, above: 110, avg: 95, below: 80, inverse: false },
  war:          { elite: 5.0, great: 3.0, above: 1.5, avg: 0.5, below: 0, inverse: false },
  iso:          { elite: .220, great: .185, above: .155, avg: .120, below: .085, inverse: false },
  babip:        { elite: .360, great: .330, above: .305, avg: .285, below: .260, inverse: false },
  bbPct:        { elite: 0.14, great: 0.11, above: 0.09, avg: 0.07, below: 0.05, inverse: false },
  kPct:         { elite: 0.12, great: 0.16, above: 0.20, avg: 0.23, below: 0.27, inverse: true },
  hardHitPct:   { elite: 0.52, great: 0.46, above: 0.41, avg: 0.37, below: 0.32, inverse: false },
  barrelPct:    { elite: 0.16, great: 0.12, above: 0.09, avg: 0.06, below: 0.04, inverse: false },
  avgExitVelo:  { elite: 92.5, great: 91.0, above: 89.5, avg: 87.5, below: 85.5, inverse: false },
  xba:          { elite: .300, great: .280, above: .260, avg: .240, below: .220, inverse: false },
  xwoba:        { elite: .380, great: .350, above: .320, avg: .300, below: .280, inverse: false },
  era:          { elite: 2.50, great: 3.20, above: 3.80, avg: 4.30, below: 5.00, inverse: true },
  fip:          { elite: 2.80, great: 3.30, above: 3.80, avg: 4.30, below: 4.80, inverse: true },
  xfip:         { elite: 2.80, great: 3.30, above: 3.80, avg: 4.30, below: 4.80, inverse: true },
  whip:         { elite: 0.95, great: 1.10, above: 1.20, avg: 1.30, below: 1.45, inverse: true },
  k9:           { elite: 11.5, great: 10.0, above: 8.5, avg: 7.5, below: 6.0, inverse: false },
  bb9:          { elite: 1.5, great: 2.0, above: 2.5, avg: 3.0, below: 3.8, inverse: true },
  kbb:          { elite: 5.0, great: 3.5, above: 2.5, avg: 2.0, below: 1.5, inverse: false },
  kPctP:        { elite: 0.30, great: 0.26, above: 0.22, avg: 0.19, below: 0.15, inverse: false },
  bbPctP:       { elite: 0.05, great: 0.07, above: 0.08, avg: 0.09, below: 0.11, inverse: true },
  swStrPct:     { elite: 0.16, great: 0.13, above: 0.11, avg: 0.09, below: 0.07, inverse: false },
  cswPct:       { elite: 0.34, great: 0.31, above: 0.28, avg: 0.26, below: 0.23, inverse: false },
  stuffPlus:    { elite: 130, great: 115, above: 105, avg: 95, below: 85, inverse: false },
  gbPctP:       { elite: 0.52, great: 0.47, above: 0.43, avg: 0.40, below: 0.36, inverse: false },
  lobPct:       { elite: 0.82, great: 0.76, above: 0.72, avg: 0.68, below: 0.62, inverse: false },
}

export function getStatQuality(statKey: string, value: number): StatQuality {
  const r = RANGES[statKey]
  if (!r || isNaN(value)) return 'avg'
  if (r.inverse) {
    if (value <= r.elite) return 'elite'
    if (value <= r.great) return 'great'
    if (value <= r.above) return 'above'
    if (value <= r.avg) return 'avg'
    if (value <= r.below) return 'below'
    return 'poor'
  } else {
    if (value >= r.elite) return 'elite'
    if (value >= r.great) return 'great'
    if (value >= r.above) return 'above'
    if (value >= r.avg) return 'avg'
    if (value >= r.below) return 'below'
    return 'poor'
  }
}

export function qualityColor(q: StatQuality): string {
  switch (q) {
    case 'elite': return '#FFD700'
    case 'great': return '#22D3A5'
    case 'above': return '#7AE28C'
    case 'avg':   return '#E8F4FD'
    case 'below': return '#FFB347'
    case 'poor':  return '#FF4D6D'
  }
}

export function qualityBg(q: StatQuality): string {
  switch (q) {
    case 'elite': return 'rgba(255,215,0,0.12)'
    case 'great': return 'rgba(34,211,165,0.12)'
    case 'above': return 'rgba(122,226,140,0.10)'
    case 'avg':   return 'rgba(255,255,255,0.05)'
    case 'below': return 'rgba(255,179,71,0.10)'
    case 'poor':  return 'rgba(255,77,109,0.12)'
  }
}

export function qualityLabel(q: StatQuality): string {
  switch (q) {
    case 'elite': return 'ELITE'
    case 'great': return 'GREAT'
    case 'above': return 'ABOVE AVG'
    case 'avg':   return 'AVG'
    case 'below': return 'BELOW AVG'
    case 'poor':  return 'POOR'
  }
}

export function pitchTypeName(code: string): string {
  const map: Record<string, string> = {
    FF: 'Four-Seam', FT: 'Two-Seam', SI: 'Sinker', FC: 'Cutter',
    SL: 'Slider', ST: 'Sweeper', SV: 'Slurve', CU: 'Curveball',
    KC: 'Knuckle Curve', CH: 'Changeup', FS: 'Splitter', FO: 'Fork',
    KN: 'Knuckleball', EP: 'Eephus', CS: 'Slow Curve',
  }
  return map[code] || code
}

export function ordinal(n: number): string {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

export function inningDisplay(inning: number, isTop: boolean): string {
  return `${isTop ? '▲' : '▼'} ${ordinal(inning)}`
}

export function countDisplay(balls: number, strikes: number): string {
  return `${balls}-${strikes}`
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`
}

export function winPctDisplay(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '.000'
  return fmtAvg(wins / total)
}

export function leverageLabel(li: number): { label: string; color: string } {
  if (li >= 2.0) return { label: 'HIGH LEVERAGE', color: '#FF4D6D' }
  if (li >= 1.0) return { label: 'MED LEVERAGE', color: '#FFB347' }
  return { label: 'LOW LEVERAGE', color: '#8BAFC8' }
}
