import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { direction: "up" | "down"; value: string; color?: string }
  accent?: string
  className?: string
}

export const StatCard = ({ label, value, icon, trend, accent, className = "" }: StatCardProps) => {
  return (
    <article
      className={`rounded-[12px] border border-black/10 bg-white px-4 py-3 flex flex-col gap-1 ${accent ? "border-t-2" : ""} ${className}`}
      style={accent ? { borderTopColor: accent } : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">{label}</p>
        {icon && <span className="text-[#64748b]">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-[#1e293b]">{value}</span>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 mb-1 ${trend.color || (trend.direction === "up" ? "text-red-500" : "text-emerald-500")}`}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </article>
  )
}
