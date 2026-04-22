import { getStatQuality, qualityColor, qualityBg, qualityLabel } from '../../utils/formatters'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  statKey?: string
  rawValue?: number
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  highlight?: boolean
  className?: string
  description?: string
}

export function StatCard({
  label,
  value,
  subValue,
  statKey,
  rawValue,
  showBadge = true,
  size = 'md',
  highlight = false,
  className = '',
  description,
}: StatCardProps) {
  const quality = statKey && rawValue !== undefined ? getStatQuality(statKey, rawValue) : undefined
  const color = quality ? qualityColor(quality) : '#E8F4FD'
  const bg = quality ? qualityBg(quality) : 'rgba(255,255,255,0.03)'

  const sizeClasses = {
    sm: { outer: 'p-2', value: 'text-xl', label: 'text-[10px]', sub: 'text-xs' },
    md: { outer: 'p-3', value: 'text-2xl', label: 'text-[11px]', sub: 'text-xs' },
    lg: { outer: 'p-4', value: 'text-3xl', label: 'text-xs', sub: 'text-sm' },
    xl: { outer: 'p-5', value: 'text-4xl', label: 'text-sm', sub: 'text-base' },
  }[size]

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 group ${sizeClasses.outer} ${className}`}
      style={{
        background: highlight ? 'rgba(30,109,197,0.12)' : bg,
        borderColor: highlight ? 'rgba(30,109,197,0.5)' : quality ? `${color}30` : 'rgba(26,46,72,0.8)',
        boxShadow: highlight ? '0 0 20px rgba(30,109,197,0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      title={description}
    >
      {quality && showBadge && (
        <div
          className={`absolute top-1.5 right-1.5 text-[8px] font-bold tracking-wider px-1 py-0.5 rounded`}
          style={{ background: `${color}20`, color }}
        >
          {qualityLabel(quality)}
        </div>
      )}

      <div className={`${sizeClasses.label} font-semibold tracking-widest uppercase mb-1`}
        style={{ color: '#8BAFC8' }}>
        {label}
      </div>

      <div
        className={`font-mono font-bold ${sizeClasses.value} leading-none`}
        style={{ color }}
      >
        {value}
      </div>

      {subValue && (
        <div className={`${sizeClasses.sub} mt-1`} style={{ color: '#4A6A88' }}>
          {subValue}
        </div>
      )}
    </div>
  )
}

interface StatRowProps {
  label: string
  value: string
  statKey?: string
  rawValue?: number
  className?: string
}

export function StatRow({ label, value, statKey, rawValue, className = '' }: StatRowProps) {
  const quality = statKey && rawValue !== undefined ? getStatQuality(statKey, rawValue) : undefined
  const color = quality ? qualityColor(quality) : '#E8F4FD'

  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>
        {label}
      </span>
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  accent?: 'blue' | 'orange' | 'green'
}

export function SectionHeader({ title, subtitle, icon, accent = 'blue' }: SectionHeaderProps) {
  const accentColor = { blue: '#1E6DC5', orange: '#FF5910', green: '#22D3A5' }[accent]
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-base">{icon}</span>}
      <div
        className="h-4 w-1 rounded-full"
        style={{ background: accentColor }}
      />
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#E8F4FD' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px]" style={{ color: '#4A6A88' }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
