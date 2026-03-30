import clsx from 'clsx'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Quick6Scope, Quick6Summary } from '@/lib/portal-quick6'

type Quick6SummaryCardProps = {
  summary: Quick6Summary
  scope: Quick6Scope
  onScopeChange: (scope: Quick6Scope) => void
}

function scopeLabel(scope: Quick6Scope) {
  if (scope === 'last3') return 'Last 3'
  if (scope === 'career') return 'Career'
  return 'Season'
}

function referenceLabel(scope: Quick6Scope) {
  if (scope === 'last3') return 'Season'
  if (scope === 'season') return 'Last 3'
  return 'Season'
}

export default function Quick6SummaryCard({ summary, scope, onScopeChange }: Quick6SummaryCardProps) {
  const tileBackgrounds = [
    'bg-[linear-gradient(180deg,rgba(32,52,88,0.28)_0%,rgba(15,24,43,0.12)_100%)] hover:bg-[linear-gradient(180deg,rgba(45,72,118,0.34)_0%,rgba(18,30,53,0.16)_100%)]',
    'bg-[linear-gradient(180deg,rgba(28,46,79,0.24)_0%,rgba(14,23,40,0.1)_100%)] hover:bg-[linear-gradient(180deg,rgba(40,66,110,0.3)_0%,rgba(17,28,49,0.15)_100%)]',
    'bg-[linear-gradient(180deg,rgba(24,38,66,0.22)_0%,rgba(13,21,37,0.1)_100%)] hover:bg-[linear-gradient(180deg,rgba(35,57,97,0.28)_0%,rgba(17,27,48,0.14)_100%)]',
    'bg-[linear-gradient(180deg,rgba(25,36,62,0.22)_0%,rgba(13,21,36,0.1)_100%)] hover:bg-[linear-gradient(180deg,rgba(38,52,88,0.28)_0%,rgba(17,27,47,0.14)_100%)]',
    'bg-[linear-gradient(180deg,rgba(24,42,56,0.24)_0%,rgba(13,21,34,0.1)_100%)] hover:bg-[linear-gradient(180deg,rgba(34,60,79,0.3)_0%,rgba(16,27,42,0.14)_100%)]',
    'bg-[linear-gradient(180deg,rgba(35,36,68,0.24)_0%,rgba(16,21,38,0.1)_100%)] hover:bg-[linear-gradient(180deg,rgba(46,50,92,0.3)_0%,rgba(19,27,46,0.14)_100%)]',
  ] as const

  return (
    <section>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Quick 6</p>
            <p className="mt-2 text-sm text-slate-300">
              {summary.seasonYear != null ? `${summary.seasonYear} player form snapshot` : 'Player form snapshot'}
            </p>
          </div>

          <div className="inline-flex rounded-full bg-white/[0.03] p-1">
            {(['last3', 'season', 'career'] as const).map((option) => {
              const active = option === scope
              const disabled = option === 'last3' && !summary.canUseLast3

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => !disabled && onScopeChange(option)}
                  disabled={disabled}
                  className={clsx(
                    'relative rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-300',
                    disabled && 'cursor-not-allowed opacity-40 hover:text-slate-500'
                  )}
                >
                  <span>{scopeLabel(option)}</span>
                  <span
                    className={clsx(
                      'absolute inset-x-2 bottom-0 h-[2px] rounded-full transition',
                      active ? 'bg-[#39FF88]' : 'bg-transparent'
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {!summary.canUseLast3 ? (
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            Last 3 unlocks after 3 logged games in the selected season
          </p>
        ) : null}

        <div className="mt-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
          {summary.stats.map((stat, index) => {
            const current = stat[scope]
            const reference = scope === 'last3' ? stat.season : scope === 'season' ? stat.last3 : stat.season
            const delta =
              current.available &&
              reference.available &&
              current.value != null &&
              reference.value != null
                ? Number((current.value - reference.value).toFixed(1))
                : null
            const showDelta = delta != null && Math.abs(delta) > 0
            const positive = (delta ?? 0) > 0

            return (
              <div
                key={stat.key}
                className={clsx(
                  'group relative overflow-hidden rounded-[22px] px-3 py-4 text-center transition duration-200 ease-out sm:px-4 lg:px-3 xl:px-4',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
                  'hover:-translate-y-[1px] hover:shadow-[0_8px_22px_rgba(5,10,20,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]',
                  tileBackgrounds[index]
                )}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_60%)]" />
                <div className="flex min-h-[172px] flex-col items-center">
                  <div className="flex h-[28px] items-center justify-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                  </div>
                  <div className="mt-3 flex h-[56px] items-center justify-center">
                    <p
                      key={`${stat.key}:${scope}:value`}
                      className="quick6-value-motion text-[2rem] font-black italic leading-none tracking-[-0.04em] text-white lg:text-[2.15rem] [text-shadow:0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      {current.display}
                    </p>
                  </div>
                  <div className="mt-2 flex h-[24px] items-center justify-center gap-1.5">
                    <div key={`${stat.key}:${scope}:delta`} className="quick6-meta-motion flex items-center justify-center gap-1.5">
                      {showDelta ? (
                        positive ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[#39FF88]" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-red-400" />
                        )
                      ) : null}
                      {showDelta ? (
                        <span className={clsx('text-xs font-semibold', positive ? 'text-[#9CE8BE]' : 'text-red-300')}>
                          {positive ? '+' : ''}
                          {delta?.toFixed(1)}
                        </span>
                      ) : <span className="opacity-0">+0.0</span>}
                    </div>
                  </div>
                  <div className="mt-1 flex h-[34px] items-start justify-center">
                    <p key={`${stat.key}:${scope}:reference`} className="quick6-meta-motion text-[11px] uppercase tracking-[0.18em] text-slate-600">
                      {referenceLabel(scope)}: {reference.display}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </section>
  )
}
