import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'

type TopbarProps = {
  title: string
  titleAsScore?: boolean
  displayName: string
  avatarUrl: string | null
  onToggleSidebar: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onLogout: () => void | Promise<void>
}

export default function Topbar({
  title,
  titleAsScore = false,
  displayName,
  avatarUrl,
  onToggleSidebar,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}: TopbarProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B1324]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1400px] items-center gap-3 px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
        </div>

        <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Search players, squads, games...</span>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-200"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#1A2336] text-xs font-semibold">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                (displayName || 'U').slice(0, 1).toUpperCase()
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#111C2F] py-1 shadow-xl">
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                onClick={() => {
                  setOpen(false)
                  onOpenProfile()
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                onClick={() => {
                  setOpen(false)
                  onOpenSettings()
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-white/10"
                onClick={() => {
                  setOpen(false)
                  void onLogout()
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
