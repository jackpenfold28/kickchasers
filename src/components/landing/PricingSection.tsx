import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, VisualMotion } from './Motion'

type BillingPeriod = 'monthly' | 'yearly'
type PricingPlanId = 'free' | 'member' | 'player' | 'club'

type PricingTier = {
  id: PricingPlanId
  name: string
  strapline: string
  description: string
  monthlyPrice: string
  yearlyPrice: string
  features: string[]
  highlight?: boolean
}

const pricing: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    strapline: 'Start clean',
    description: 'Core visibility for players getting started with match tracking and post-game review.',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    features: ['Track basic stats', 'See last 3 games', 'Create cards', 'View stats'],
  },
  {
    id: 'member',
    name: 'Member',
    strapline: 'For close followers',
    description: 'A light upgrade for families and supporters who want live visibility on match day.',
    monthlyPrice: '$5',
    yearlyPrice: '$39.95',
    features: ['Everything in Free', 'Access to Match Day live scores and stats'],
  },
  {
    id: 'player',
    name: 'Player',
    strapline: 'Most selected',
    description: 'The full performance layer for athletes committed to long-term development and comparison.',
    monthlyPrice: '$15',
    yearlyPrice: '$84.95',
    features: [
      'Everything in Member',
      'Track advanced stats',
      'Unlimited games, seasons, and player profile history',
      'Leaderboards and eligibility access',
    ],
    highlight: true,
  },
  {
    id: 'club',
    name: 'Club',
    strapline: 'For official programs',
    description: 'Operational control for squads, staff, linked teams, and broader club workflows.',
    monthlyPrice: '$99.95',
    yearlyPrice: '$999.95',
    features: [
      'Everything above',
      'Full official squad management',
      'Line-up generator, guest linking, and opposition linking',
      'Club roles and activities',
    ],
  },
]

const comparisonRows = [
  {
    label: 'Stat coverage',
    values: ['Basic stats', 'Basic + live match day', 'Advanced player tracking', 'Advanced + team tracking'],
  },
  {
    label: 'History',
    values: ['Last 3 games', 'Last 3 games', 'Unlimited games and seasons', 'Unlimited club-wide history'],
  },
  {
    label: 'Match day access',
    values: ['View stats', 'Live scores and stats', 'Leaderboards and player profile', 'Linked squad and opposition tracking'],
  },
  {
    label: 'Squad tools',
    values: ['Create cards', 'Supporter visibility', 'Squad creation', 'Official squad management'],
  },
]

const pricingSignals = ['Players', 'Families', 'Clubs'] as const

function parsePrice(value: string) {
  return Number.parseFloat(value.replace('$', ''))
}

function PricingCard({
  tier,
  index,
  billingPeriod,
  isSelected,
  onSelect,
}: {
  tier: PricingTier
  index: number
  billingPeriod: BillingPeriod
  isSelected: boolean
  onSelect: (tierId: PricingPlanId) => void
}) {
  const activePrice = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice
  const frequency = billingPeriod === 'monthly' ? '/month' : '/year'
  const monthlyValue = parsePrice(tier.monthlyPrice)
  const yearlyValue = parsePrice(tier.yearlyPrice)
  const savingsPercent =
    billingPeriod === 'yearly' && monthlyValue > 0 && yearlyValue > 0
      ? Math.round((1 - yearlyValue / (monthlyValue * 12)) * 100)
      : null

  const cardClassName = isSelected
    ? 'group relative flex min-h-[448px] w-[85%] shrink-0 snap-center flex-col overflow-hidden rounded-[32px] border border-[rgba(57,255,20,0.18)] bg-[linear-gradient(180deg,rgba(57,255,20,0.045),rgba(8,18,36,0.94)_26%,rgba(5,13,28,0.98))] px-6 pb-6 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_22px_52px_rgba(0,0,0,0.26)] transition duration-300 ease-out sm:w-[68%] md:w-auto md:snap-none md:hover:-translate-y-1 md:hover:border-[rgba(57,255,20,0.24)] md:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_26px_60px_rgba(0,0,0,0.3)]'
    : 'group relative flex min-h-[448px] w-[85%] shrink-0 snap-center flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(11,20,38,0.94)_24%,rgba(5,13,28,0.98))] px-6 pb-6 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.24)] transition duration-300 ease-out sm:w-[68%] md:w-auto md:snap-none md:hover:-translate-y-1 md:hover:border-white/16 md:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_58px_rgba(0,0,0,0.3)]'
  const ctaClassName = isSelected
    ? 'mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#7CFF64]/65 bg-[#39FF14] px-4 py-3 text-sm font-semibold text-[#07111F] shadow-[0_6px_18px_rgba(57,255,20,0.25)] transition duration-300 ease-out hover:bg-[#50FF2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]'
    : 'mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 ease-out md:group-hover:border-white/28 md:group-hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55'
  const featureDotClassName = isSelected ? 'mt-[9px] h-1.5 w-1.5 rounded-full bg-[#39FF14]' : 'mt-[9px] h-1.5 w-1.5 rounded-full bg-white/55'

  return (
    <Reveal
      key={tier.name}
      as="article"
      direction="up"
      delay={index * 90}
      duration={650}
      distance={12}
      scale={0.99}
      baseOpacity={0.84}
      className={cardClassName}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
      {isSelected ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(88%_56%_at_50%_0%,rgba(57,255,20,0.06),transparent_56%)]" />
      ) : null}
      <div className="relative flex h-full flex-col">
        <div className="min-h-[108px]">
          <div className="mb-5 min-h-[28px]">
            {tier.highlight ? (
              <p className="inline-flex w-fit rounded-full border border-[#7CFF64]/30 bg-[#39FF14]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C7FFBC]">
                Recommended
              </p>
            ) : null}
          </div>
          <p className="text-[13px] font-medium tracking-[0.01em] text-slate-400">{tier.strapline}</p>
          <p className="mt-2 text-[29px] font-semibold tracking-tight text-white">{tier.name}</p>
        </div>
        <div className="mt-6 min-h-[94px]">
          <p className="text-[48px] font-semibold leading-none tracking-tight text-white">
            {activePrice}
            <span className="ml-1.5 text-sm font-normal tracking-normal text-slate-400">{frequency}</span>
          </p>
          <div className="relative mt-3 min-h-[34px]">
            <div
              className={`absolute inset-0 flex items-center gap-2 transition-all duration-[240ms] ease-out ${
                billingPeriod === 'yearly' ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              {savingsPercent ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                  Save {savingsPercent}%
                </span>
              ) : null}
              <span className="text-xs text-slate-400">Billed annually</span>
            </div>
            <div
              className={`absolute inset-0 flex items-center gap-2 transition-all duration-[240ms] ease-out ${
                billingPeriod === 'monthly' ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <span className="text-xs text-slate-400">Billed monthly</span>
            </div>
          </div>
        </div>
        <p className="mt-5 min-h-[72px] text-sm leading-6 text-slate-300">{tier.description}</p>
        <div className="mt-6 flex-1 space-y-3.5 border-t border-white/8 pt-5">
          {tier.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <span className={`shrink-0 ${featureDotClassName}`} />
              <p className="text-sm leading-6 text-slate-200">{feature}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onSelect(tier.id)} className={ctaClassName}>
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    </Reveal>
  )
}

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [selectedTier, setSelectedTier] = useState<PricingPlanId>('player')

  return (
    <section id="pricing" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,26,0)_0%,rgba(6,17,42,0.28)_55%,rgba(3,10,26,0)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(90deg,rgba(2,9,26,0.96),rgba(2,9,26,0))] md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(270deg,rgba(2,9,26,0.96),rgba(2,9,26,0))] md:hidden" />

      <div className="relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[760px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.56))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="up" distance={14} baseOpacity={0.8} className="text-xs uppercase tracking-[0.24em] text-slate-400">Pricing</Reveal>
            <Reveal as="h2" direction="up" delay={50} distance={16} baseOpacity={0.76} className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Choose Your Performance Tier
            </Reveal>
            <Reveal as="p" direction="up" delay={100} distance={16} baseOpacity={0.74} className="mt-5 max-w-[60ch] text-base leading-relaxed text-slate-300 sm:text-lg">
              All features are currently free for all users for a limited time, so you can explore the full
              KickChasers platform during launch. These plans show the long-term structure for players, families,
              and clubs once billing begins.
            </Reveal>
            <Reveal as="p" direction="up" delay={145} distance={14} baseOpacity={0.76} className="mt-3 text-sm leading-6 text-slate-400">
              Yearly plans offer discounted pricing for long-term use.
            </Reveal>
            <div className="kc-card-cluster mt-6 flex flex-wrap gap-3">
              {pricingSignals.map((signal, index) => (
                <Reveal
                  key={signal}
                  as="div"
                  delay={185 + index * 35}
                  distance={12}
                  scale={0.99}
                  baseOpacity={0.84}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-200"
                >
                  {signal}
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal direction="up" delay={165} distance={12} scale={0.99} baseOpacity={0.84} className="lg:pb-1">
            <div className="inline-flex items-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(6,17,42,0.96),rgba(4,12,28,0.92))] p-1.5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`inline-flex min-w-[118px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
                  billingPeriod === 'monthly'
                    ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`inline-flex min-w-[118px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  billingPeriod === 'yearly'
                    ? 'bg-[linear-gradient(135deg,rgba(57,255,20,0.18),rgba(255,255,255,0.06))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yearly
                {billingPeriod === 'yearly' ? (
                  <span className="rounded-full border border-[#7CFF64]/30 bg-[#39FF14]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C7FFBC]">
                    Better value
                  </span>
                ) : null}
              </button>
            </div>
          </Reveal>
        </div>

        <div className="kc-card-cluster -mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 no-scrollbar md:mx-0 md:grid md:grid-cols-2 md:px-0 lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {pricing.map((tier, index) => (
            <PricingCard
              key={tier.name}
              tier={tier}
              index={index}
              billingPeriod={billingPeriod}
              isSelected={selectedTier === tier.id}
              onSelect={setSelectedTier}
            />
          ))}
        </div>

        <VisualMotion
          delay={240}
          duration={820}
          distance={14}
          drift={2}
          parallax={4}
          mobileParallax={2}
          scale={0.988}
          scrollScale={0.012}
          mobileScrollScale={0.006}
          baseOpacity={0.92}
          settleStart={0.96}
          settleEnd={0.38}
          className="mt-10"
        >
        <Reveal
          direction="up"
          delay={0}
          distance={18}
          scale={0.982}
          className="relative rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(11,20,38,0.94)_24%,rgba(5,13,28,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.24)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[34px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
          <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(80%_55%_at_50%_0%,rgba(255,255,255,0.028),transparent_58%)]" />
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">Compare the structure at a glance</p>
              <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-slate-400">
                A compact view of how access expands from individual tracking through to full club operations.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Comparison support</p>
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008))] lg:grid lg:grid-cols-[1.18fr_repeat(4,minmax(0,1fr))] lg:gap-x-0">
            <div className="border-b border-white/[0.04] px-7 py-6" />
            {pricing.map((tier) => {
              const isSelectedColumn = tier.id === selectedTier
              return (
                <div
                  key={tier.name}
                  className={`group/column border-b border-white/[0.04] px-6 py-6 text-center transition duration-200 ${
                    isSelectedColumn
                      ? 'bg-[linear-gradient(180deg,rgba(57,255,20,0.06),rgba(57,255,20,0.02))] shadow-[inset_1px_0_0_rgba(57,255,20,0.2),inset_-1px_0_0_rgba(57,255,20,0.2),0_0_28px_rgba(57,255,20,0.03)] hover:bg-[linear-gradient(180deg,rgba(57,255,20,0.09),rgba(57,255,20,0.03))] hover:shadow-[inset_1px_0_0_rgba(57,255,20,0.28),inset_-1px_0_0_rgba(57,255,20,0.28),0_0_32px_rgba(57,255,20,0.06)]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <p className={`text-[17px] font-semibold tracking-[0.01em] ${isSelectedColumn ? 'text-white' : 'text-slate-100'}`}>
                    {tier.name}
                  </p>
                </div>
              )
            })}
            {comparisonRows.map((row, rowIndex) => (
              <Fragment key={row.label}>
                <div className={`border-r border-white/[0.04] px-7 py-7 text-sm font-semibold leading-6 text-white ${rowIndex % 2 === 0 ? 'bg-white/[0.012]' : 'bg-transparent'}`}>
                  {row.label}
                </div>
                {row.values.map((value, index) => {
                  const isSelectedColumn = pricing[index]?.id === selectedTier
                  const rowTone = rowIndex % 2 === 0 ? 'bg-white/[0.008]' : 'bg-transparent'
                  return (
                    <div
                      key={`${row.label}-${value}`}
                      className={`group/column px-6 py-7 text-sm leading-6 text-slate-200 transition duration-200 ${rowTone} ${
                        isSelectedColumn
                          ? 'bg-[linear-gradient(180deg,rgba(57,255,20,0.06),rgba(57,255,20,0.02))] shadow-[inset_1px_0_0_rgba(57,255,20,0.2),inset_-1px_0_0_rgba(57,255,20,0.2)] hover:bg-[linear-gradient(180deg,rgba(57,255,20,0.09),rgba(57,255,20,0.03))] hover:shadow-[inset_1px_0_0_rgba(57,255,20,0.28),inset_-1px_0_0_rgba(57,255,20,0.28),0_0_24px_rgba(57,255,20,0.05)]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                            isSelectedColumn ? 'bg-[#39FF14]' : index === 0 ? 'bg-white/38' : index === 1 ? 'bg-white/48' : 'bg-white/58'
                          }`}
                        />
                        <span className="block min-w-0">{value}</span>
                      </div>
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:hidden">
            {comparisonRows.map((row) => (
              <div
                key={row.label}
                className="rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.024),rgba(255,255,255,0.012))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_34px_rgba(0,0,0,0.14)]"
              >
                <p className="pl-1 text-sm font-semibold leading-6 text-white">{row.label}</p>
                <div className="mt-4 space-y-3">
                  {pricing.map((tier, index) => (
                    <div
                      key={`${row.label}-${tier.name}`}
                      className={`rounded-2xl border p-3.5 ${
                        tier.id === selectedTier
                          ? 'border-[rgba(57,255,20,0.18)] bg-[linear-gradient(180deg,rgba(57,255,20,0.08),rgba(7,16,31,0.88))] shadow-[inset_0_1px_0_rgba(57,255,20,0.12),0_0_20px_rgba(57,255,20,0.04)]'
                          : 'border-white/8 bg-[#07101F]/78'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className={`text-[13px] font-semibold leading-5 ${tier.id === selectedTier ? 'text-white' : 'text-slate-100'}`}>
                          {tier.name}
                        </p>
                        {tier.highlight ? (
                          <span className="rounded-full border border-[#7CFF64]/30 bg-[#39FF14]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C7FFBC]">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-start gap-3">
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                            tier.id === selectedTier ? 'bg-[#39FF14]' : index === 0 ? 'bg-white/38' : index === 1 ? 'bg-white/48' : 'bg-white/58'
                          }`}
                        />
                        <p className="text-sm leading-6 text-slate-200">{row.values[index]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        </VisualMotion>

        {selectedTier ? (
          <Reveal direction="up" delay={290} distance={12} scale={0.99} baseOpacity={0.86} className="mt-8 flex justify-center">
            <Link
              to="/sign-up"
              className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-[#7CFF64]/65 bg-[#39FF14] px-6 py-3 text-sm font-semibold text-[#07111F] shadow-[0_6px_18px_rgba(57,255,20,0.25)] transition hover:bg-[#50FF2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Create account to log in to purchase
            </Link>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
