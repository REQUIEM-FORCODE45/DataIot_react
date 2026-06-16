import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  rightContent?: ReactNode
}

export const SectionHeader = ({ title, subtitle, icon, rightContent }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && <span className="text-[#00554f]">{icon}</span>}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">{title}</p>
          {subtitle && <p className="text-sm text-[#1e293b] font-medium">{subtitle}</p>}
        </div>
      </div>
      {rightContent}
    </div>
  )
}
