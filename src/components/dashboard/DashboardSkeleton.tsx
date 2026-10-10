import PortalCard from '@/components/cards/PortalCard'

function Block({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none ${className}`} />
}

export function DashboardSectionSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return <div role="status" aria-busy="true" className="space-y-2.5">
    <span className="sr-only">Loading {label}…</span>
    {Array.from({ length: rows }, (_, index) => <div key={index} aria-hidden="true" className="flex min-h-[76px] items-center gap-3 rounded-xl bg-white/[0.025] p-3">
      <Block className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2"><Block className="h-3 w-2/3" /><Block className="h-2 w-4/5" /></div>
      <Block className="h-6 w-10" />
    </div>)}
  </div>
}

export default function DashboardSkeleton() {
  return <section aria-label="Dashboard loading" aria-busy="true" className="grid min-w-0 gap-6">
    <span role="status" className="sr-only">Loading dashboard…</span>
    <div aria-hidden="true" className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 xl:flex-row">
      <div className="flex items-center gap-4"><Block className="h-14 w-14 rounded-full" /><Block className="h-6 w-44" /></div>
      <div className="grid grid-cols-4 gap-2.5"><Block className="h-[70px] w-full xl:w-32" /><Block className="h-[70px] w-full xl:w-32" /><Block className="h-[70px] w-full xl:w-32" /><Block className="h-[70px] w-full xl:w-32" /></div>
    </div>
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div aria-hidden="true" className="grid min-w-0 gap-6"><div className="flex justify-between"><Block className="h-6 w-40" /><Block className="h-6 w-32" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Block key={index} className="h-[200px]" />)}</div><Block className="h-[350px]" /></div>
      <PortalCard title="Action Inbox"><DashboardSectionSkeleton label="action inbox" /></PortalCard>
    </div>
    <div aria-hidden="true" className="min-w-0"><Block className="mb-5 h-5 w-24" /><div className="flex gap-4 overflow-hidden">{Array.from({ length: 5 }, (_, index) => <Block key={index} className="aspect-[4/5] w-[260px] shrink-0" />)}</div></div>
  </section>
}
