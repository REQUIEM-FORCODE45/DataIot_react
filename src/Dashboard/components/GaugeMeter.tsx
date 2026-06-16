interface GaugeMeterProps {
  value: number
  min: number
  max: number
  thresholds?: { min: number; max: number; color: string }[]
  label?: string
  unit?: string
  size?: number
}

export const GaugeMeter = ({ value, min, max, thresholds, label, unit, size = 180 }: GaugeMeterProps) => {
  const normalized = Math.max(min, Math.min(max, value))
  const fraction = (normalized - min) / (max - min)
  const angle = -180 + fraction * 180

  const getColor = () => {
    if (!thresholds) return "#00554f"
    for (const t of thresholds) {
      if (normalized >= t.min && normalized <= t.max) return t.color
    }
    return "#00554f"
  }

  const color = getColor()
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const strokeWidth = size * 0.06

  const startAngle = -180
  const endAngle = 0
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)

  const pointerLen = r * 0.85
  const pointerRad = (angle * Math.PI) / 180
  const px = cx + pointerLen * Math.cos(pointerRad)
  const py = cy + pointerLen * Math.sin(pointerRad)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.9} viewBox={`0 0 ${size} ${size * 0.9}`}>
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fraction * Math.PI * r} ${Math.PI * r}`}
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        <line x1={cx} y1={cy} x2={px} y2={py} stroke={color} strokeWidth={2} strokeLinecap="round" />
        {thresholds?.map((t, i) => {
          const tFraction = (t.min - min) / (max - min)
          const tAngle = -180 + tFraction * 180
          const tRad = (tAngle * Math.PI) / 180
          const tx = cx + (r + 8) * Math.cos(tRad)
          const ty = cy + (r + 8) * Math.sin(tRad)
          return (
            <text key={i} x={tx} y={ty} textAnchor="middle" fontSize="8" fill="#64748b" dominantBaseline="middle">
              {t.min}
            </text>
          )
        })}
        <text x={cx} y={cy + r * 0.55} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1e293b">
          {normalized.toFixed(1)}
        </text>
        {unit && (
          <text x={cx} y={cy + r * 0.55 + 16} textAnchor="middle" fontSize="10" fill="#64748b">
            {unit}
          </text>
        )}
      </svg>
      {label && <span className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">{label}</span>}
    </div>
  )
}
