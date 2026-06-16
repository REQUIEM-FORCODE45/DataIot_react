interface ThermalExcursionProps {
  seconds: number
  isActive: boolean
  thresholdTemp?: number
}

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}h:${String(m).padStart(2, "0")}m:${String(s).padStart(2, "0")}s`
}

export const ThermalExcursion = ({ seconds, isActive, thresholdTemp = 5 }: ThermalExcursionProps) => {
  return (
    <div
      className={`rounded-[12px] border p-4 flex flex-col gap-2 transition-colors ${
        isActive
          ? "border-red-300 bg-red-50"
          : "border-black/10 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Excursión Térmica</p>
      <p className="text-[11px] text-[#64748b]">
        Tiempo continuo fuera de rango &gt; {thresholdTemp}°C
      </p>
      <p
        className={`font-mono text-2xl font-bold tracking-wider ${
          isActive ? "text-red-600" : "text-[#1e293b]"
        }`}
      >
        {formatTime(seconds)}
      </p>
      {isActive && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          FUERA DE RANGO
        </span>
      )}
    </div>
  )
}
