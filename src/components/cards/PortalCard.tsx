import { type ReactNode } from 'react'
import clsx from 'clsx'

type PortalCardProps = {
  title?: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export default function PortalCard({ title, subtitle, children, className }: PortalCardProps) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-white/10 bg-[#101A2A] p-4 shadow-[0_12px_32px_rgba(3,8,20,0.28)] sm:p-5',
        className
      )}
    >
      {(title || subtitle) && (
        <header className="mb-4 space-y-1">
          {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
