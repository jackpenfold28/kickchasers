import { type ReactNode } from 'react'
import clsx from 'clsx'
import type { RequestStatus } from '@/lib/portal-admin'

const STATUS_CLASSNAMES: Record<RequestStatus, string> = {
  pending: 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#9CE8BE]',
  approved: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200',
  declined: 'border-red-400/20 bg-red-400/12 text-red-200',
  cancelled: 'border-slate-400/15 bg-slate-400/10 text-slate-300',
  revoked: 'border-amber-400/20 bg-amber-400/12 text-amber-200',
  archived: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Time unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unknown'
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function StatusPill({ status }: { status: RequestStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]',
        STATUS_CLASSNAMES[status]
      )}
    >
      {status}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7ED9A6]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
      {label}
    </div>
  )
}

export function AdminActionButton({
  children,
  onClick,
  disabled,
  tone = 'ghost',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: 'primary' | 'ghost' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'primary' && 'border-[#39FF88] bg-[#39FF88] text-[#0B1224] hover:bg-[#54FFA0]',
        tone === 'danger' && 'border-red-400/25 bg-red-400/12 text-red-100 hover:bg-red-400/16',
        tone === 'ghost' && 'border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]'
      )}
    >
      {children}
    </button>
  )
}
