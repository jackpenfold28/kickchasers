import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

type AuthShellProps = {
  title: string
  eyebrow?: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export const authCardClassName =
  'relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(11,20,38,0.94)_24%,rgba(5,13,28,0.98))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8'

export const authFieldClassName =
  'w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 transition duration-200 outline-none focus:border-white/[0.12] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#39FF14]/10'

export const authPrimaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl border border-[#7CFF64]/35 bg-[linear-gradient(180deg,#39FF14_0%,#2BEA12_100%)] px-5 py-3.5 text-sm font-semibold text-[#03101F] shadow-[0_14px_32px_rgba(57,255,20,0.2)] transition duration-200 hover:bg-[linear-gradient(180deg,#50FF2F_0%,#39FF14_100%)] hover:shadow-[0_18px_40px_rgba(57,255,20,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A] disabled:cursor-not-allowed disabled:opacity-65'

export const authSecondaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-2xl border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-5 py-3.5 text-sm font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/24 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/45 disabled:cursor-not-allowed disabled:opacity-65'

export const authInlineButtonClassName =
  'rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-50 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/45'

export const authLinkClassName =
  'text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/45'

export const authMessageClassName = {
  error: 'rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200',
  info: 'rounded-2xl border border-[#7CFF64]/18 bg-[#39FF14]/10 px-4 py-3 text-sm text-[#C9FFC1]',
  warning: 'rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100',
}

export function AuthShell({ title, eyebrow = 'KickChasers Access', description, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_720px_at_8%_-12%,rgba(20,92,255,0.25),transparent_58%),radial-gradient(950px_620px_at_90%_4%,rgba(57,255,20,0.08),transparent_50%),linear-gradient(180deg,#02091A_0%,#040B1C_44%,#030A1A_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_560px_at_50%_114%,rgba(0,0,0,0.5),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[16vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.26),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[16vw] bg-[linear-gradient(270deg,rgba(0,0,0,0.26),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-14">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-12">
          <section className="order-2 relative max-w-2xl lg:order-1">
            <div className="pointer-events-none absolute -left-24 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.14)_0%,rgba(12,56,150,0.12)_42%,rgba(2,9,26,0)_74%)] blur-3xl" />
            <div className="flex flex-col items-start">
              <Link to="/" className="relative inline-flex items-center">
                <img src="/kickchasers_logo.png" alt="KickChasers" className="h-14 w-auto sm:h-20" />
              </Link>
              <p className="mt-4 inline-flex rounded-full border border-white/15 bg-white/[0.02] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                PERFORMANCE PLATFORM FOR FOOTBALLERS
              </p>
            </div>
            <h1 className="mt-5 max-w-[12ch] text-[2.35rem] font-semibold leading-[1.01] tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-slate-300 sm:text-lg">
              {description}
            </p>
            <div className="mt-8 hidden h-px w-full max-w-xl bg-gradient-to-r from-white/20 via-white/10 to-transparent lg:block" />
            <p className="mt-8 max-w-[42ch] text-sm leading-relaxed text-slate-400">
              Live tracking, verified performance data, and a competition-first experience built for serious football
              progression.
            </p>
          </section>

          <section className="order-1 relative mx-auto w-full max-w-[34rem] lg:order-2">
            <div className="pointer-events-none absolute left-1/2 top-[45%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.12)_0%,rgba(7,66,145,0.1)_42%,transparent_74%)] blur-3xl" />
            <div className={authCardClassName}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[34px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[34px] border border-white/[0.045]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(255,255,255,0.028),transparent_58%)]" />

              <div className="relative">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
                <h2 className="mt-3 text-[1.8rem] font-semibold tracking-tight text-white sm:text-[2rem]">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
              </div>

              <div className="relative mt-8 border-t border-white/8 pt-6">{children}</div>

              {footer ? <div className="relative mt-6 border-t border-white/10 pt-5">{footer}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

type AuthDividerProps = {
  label: string
  className?: string
}

export function AuthDivider({ label, className }: AuthDividerProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#39FF14]/35 to-white/10" />
      <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#39FF14]/35 to-white/10" />
    </div>
  )
}
