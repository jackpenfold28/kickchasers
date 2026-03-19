import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { legalDocumentList } from '@/content/legalDocuments'

export type PublicNavItem = {
  label: string
  href: string
  id: string
  type: 'hash' | 'route'
}

export const publicNavItems: PublicNavItem[] = [
  { label: 'Features', href: '#features', id: 'features', type: 'hash' },
  { label: 'How It Works', href: '/how-it-works', id: 'how-it-works', type: 'route' },
  { label: 'Pricing', href: '#pricing', id: 'pricing', type: 'hash' },
  { label: 'Portal', href: '#portal', id: 'portal', type: 'hash' },
]

const authLink = (path: string) => `/sign-in?redirect=${encodeURIComponent(path)}`

function resolveNavHref(item: PublicNavItem, useLandingAnchors: boolean) {
  if (item.type === 'route') return item.href
  return useLandingAnchors ? `/${item.href}` : item.href
}

type PublicSiteShellProps = {
  activeNavId?: string
  useLandingAnchors?: boolean
  disableAuthCtas?: boolean
  children: ReactNode
}

export function PublicSiteShell({
  activeNavId,
  useLandingAnchors = false,
  disableAuthCtas = false,
  children,
}: PublicSiteShellProps) {
  return (
    <main className="relative overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_720px_at_8%_-12%,rgba(20,92,255,0.25),transparent_58%),radial-gradient(950px_620px_at_90%_4%,rgba(57,255,20,0.08),transparent_50%),linear-gradient(180deg,#02091A_0%,#040B1C_44%,#030A1A_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_560px_at_50%_114%,rgba(0,0,0,0.5),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[16vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.26),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[16vw] bg-[linear-gradient(270deg,rgba(0,0,0,0.26),transparent)]" />

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-1 py-2 sm:px-2">
          <Link to="/" className="flex items-center gap-3">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-14 w-auto" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Landing sections">
            {publicNavItems.map((item) => {
              const isActive = activeNavId === item.id
              const href = resolveNavHref(item, useLandingAnchors)
              const classes = `group relative py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/45 ${
                isActive ? 'text-white' : 'text-slate-200/95 hover:text-white'
              }`

              if (item.type === 'route' || useLandingAnchors) {
                return (
                  <Link key={item.id} to={href} aria-current={isActive ? 'page' : undefined} className={classes}>
                    {item.label}
                    <span
                      className={`absolute -bottom-[2px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#39FF14] transition-all duration-300 ${
                        isActive ? 'w-[72%] shadow-[0_0_12px_rgba(57,255,20,0.55)]' : 'w-0 group-hover:w-[72%]'
                      }`}
                    />
                  </Link>
                )
              }

              return (
                <a key={item.id} href={href} aria-current={isActive ? 'page' : undefined} className={classes}>
                  {item.label}
                  <span
                    className={`absolute -bottom-[2px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#39FF14] transition-all duration-300 ${
                      isActive ? 'w-[72%] shadow-[0_0_12px_rgba(57,255,20,0.55)]' : 'w-0 group-hover:w-[72%]'
                    }`}
                  />
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 text-sm sm:gap-3">
            {disableAuthCtas ? (
              <>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-xl border border-white/14 bg-white/[0.02] px-4 py-2 text-slate-500"
                >
                  Sign In
                </span>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-xl border border-[#7CFF64]/20 bg-[#39FF14]/20 px-4 py-2 font-semibold text-slate-300 shadow-[0_6px_18px_rgba(57,255,20,0.08)]"
                >
                  Sign Up
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="rounded-xl border border-white/25 bg-white/[0.03] px-4 py-2 text-slate-100 transition-colors hover:border-white/35 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/50"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-xl border border-[#7CFF64]/65 bg-[#39FF14]/92 px-4 py-2 font-semibold text-white shadow-[0_6px_18px_rgba(57,255,20,0.25)] transition hover:bg-[#50FF2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </header>

      {children}

      <footer className="relative border-t border-white/10 bg-[#030A1A]/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-3 text-sm text-slate-300">
            {disableAuthCtas ? (
              <>
                <span aria-disabled="true" className="cursor-not-allowed text-slate-500">
                  Sign In
                </span>
                <span aria-disabled="true" className="cursor-not-allowed text-slate-500">
                  Sign Up
                </span>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="hover:text-white">
                  Sign In
                </Link>
                <Link to="/sign-up" className="hover:text-white">
                  Sign Up
                </Link>
              </>
            )}
            <Link to={authLink('/hub')} className="hover:text-white">
              Portal
            </Link>
            {legalDocumentList.map((item) => (
              <Link key={item.key} to={item.route} className="text-slate-400 transition hover:text-white">
                {item.title}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} KickChasers. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
