import { useEffect, useState } from 'react'
import { Reveal } from '@/components/landing/Motion'
import { ProductShot } from '@/components/landing/ProductShot'
import { PublicSiteShell } from '@/components/landing/PublicSiteShell'

type HowItWorksTab = {
  id: string
  label: string
  navBlurb: string
  title: string
  summary: string
  bullets: string[]
  concept: string
  image?: string
  alt?: string
}

const productLoop = ['Track Game', 'Game Summary', 'Player Profiles', 'Leaderboards', 'Feed & Sharing'] as const

const tabs: HowItWorksTab[] = [
  {
    id: 'profile-onboarding',
    label: 'Profile & Onboarding',
    navBlurb: 'Real football identity and club-linked setup',
    title: 'Create an account and connect it to real football context',
    summary:
      'KickChasers starts with account creation and onboarding. Users choose their state, league, club, squad context, role, and profile details so the account behaves like a football identity, not a blank social profile.',
    bullets: [
      'Account creation and onboarding flow',
      'Club, league, and role selection',
      'Profile setup and football identity',
      'Jersey numbers and squad-linked context',
    ],
    concept:
      'KickChasers connects every user to their real club and squad so stats belong to real football structures.',
    image: '/mockups/landing/10-your-complete-player-profile.png',
    alt: 'KickChasers profile and onboarding context',
  },
  {
    id: 'squads-teams',
    label: 'Squads & Teams',
    navBlurb: 'Official structure for rosters, requests, and roles',
    title: 'Build the structure that connects clubs, rosters, and match-day ownership',
    summary:
      'Official squads sit at the center of the platform. They manage who belongs to the team, how invites and join requests are handled, what each role can control, and how guest players fit into the roster when reality is messy.',
    bullets: [
      'Official squads, invites, and join requests',
      'Role permissions and roster management',
      'Guest players and flexible squad operations',
      'Lineup posters and club-linked team presentation',
    ],
    concept: 'Squads create the structure that connects games, players, and clubs.',
    image: '/mockups/landing/07-see-whos-dominating.png',
    alt: 'KickChasers squads and team ecosystem',
  },
  {
    id: 'live-tracking',
    label: 'Live Match Tracking',
    navBlurb: 'Structured live stat capture on real match day',
    title: 'Run structured live AFL stat capture from real match-day workflows',
    summary:
      'The core product flow is live tracking. Coaches or trackers set up the game, choose the squads and players involved, select the venue and opponent, and then record stat events live as the match unfolds.',
    bullets: [
      'Game setup and squad selection',
      'Player selection and roster-based stat logging',
      'Tracking both teams when needed',
      'Quarter control and live match context',
    ],
    concept: 'KickChasers is built around structured live stat capture during real AFL matches.',
    image: '/mockups/landing/02-track-every-afl-stat-live.png',
    alt: 'KickChasers live match tracking interface',
  },
  {
    id: 'game-summaries',
    label: 'Game Summaries',
    navBlurb: 'Readable outputs generated from one tracked game',
    title: 'Turn one tracked game into readable outputs immediately after the siren',
    summary:
      'Tracked events are transformed into full game summaries that coaches, players, and supporters can actually use. Instead of staying as raw admin data, the system produces scorelines, player rows, quarter splits, and export-ready match views.',
    bullets: [
      'Team totals and player stat rows',
      'Quarter splits and match reports',
      'Post-game recap views',
      'Export and sharing workflows',
    ],
    concept: 'One tracked game instantly becomes a full match summary.',
    image: '/mockups/landing/09-professional-match-summaries.png',
    alt: 'KickChasers game summary outputs',
  },
  {
    id: 'player-development',
    label: 'Player Development',
    navBlurb: 'Long-term game logs, trends, and season history',
    title: 'Extend every game into a long-term performance record',
    summary:
      'KickChasers turns single-game tracking into a season story. Each match feeds game logs, profile history, trends, and season stat records so players and coaches can review development across time rather than isolated one-off performances.',
    bullets: [
      'Profile game logs and season stats',
      'Performance trends and stat history',
      'Development tracking across multiple games',
      'Long-term player visibility',
    ],
    concept: 'KickChasers turns every game into a long-term performance record.',
  },
  {
    id: 'leaderboards',
    label: 'Leaderboards',
    navBlurb: 'Visible comparison across clubs, leagues, and stats',
    title: 'Make performance visible across leagues, clubs, and stat categories',
    summary:
      'Leaderboards convert tracked output into competitive context. Players can be discovered through club and league filters, staff can compare performance, and the app creates visibility around who is producing consistently.',
    bullets: [
      'Stat leaderboards and ranking views',
      'League and club filters',
      'Player comparison and discovery',
      'Competition-level visibility',
    ],
    concept: 'Performance becomes visible and competitive.',
    image: '/mockups/landing/03-climb-the-leaderboards.png',
    alt: 'KickChasers leaderboard comparison view',
  },
  {
    id: 'feed-sharing',
    label: 'Feed & Performance Sharing',
    navBlurb: 'Stat-backed sharing built on real match data',
    title: 'Share real stat-backed performances instead of generic social content',
    summary:
      'KickChasers uses tracked match data to power a follow-based social layer. Player posts, team-tracked game cards, and manual stat summary posts all connect back to real performance data so supporters can react to outcomes that are grounded in actual games.',
    bullets: [
      'Stat-backed social cards and tracked-game posts',
      'Manual stat summary posts when needed',
      'Likes, comments, and follow-based feed activity',
      'Player and supporter visibility around real performance',
    ],
    concept:
      'KickChasers posts are powered by real match data, not generic social content. Players can share stat-backed performances while supporters follow the progress.',
    image: '/mockups/landing/11-instant-club-content-creation.png',
    alt: 'KickChasers feed and shareable performance content',
  },
  {
    id: 'ratings-benchmarking',
    label: 'Ratings & Benchmarking',
    navBlurb: 'Benchmark context for interpreting performance strength',
    title: 'Interpret output against benchmarks instead of leaving stats as raw totals',
    summary:
      'KickChasers is designed to help players and coaches understand what a performance actually means. Benchmark bands, Impact-7 style scoring, and summary indicators provide context beyond a simple stat line.',
    bullets: [
      'Benchmark bands and threshold indicators',
      'Elite, Above Average, Average, and Rookie levels',
      'Impact-7 style rating interpretation',
      'Benchmark context inside summaries',
    ],
    concept:
      'KickChasers does not just record stats. It benchmarks performances against AFL-style thresholds so players and coaches can understand how strong a game actually was.',
  },
  {
    id: 'portal-club-management',
    label: 'Portal & Club Management',
    navBlurb: 'Desktop workflows for squads, approvals, and clubs',
    title: 'Carry live data into structured desktop workflows for real clubs',
    summary:
      'The web portal extends the platform beyond match day. Clubs and admins can manage squads, control rosters, review stats, approve roles, and handle official team workflows on a larger screen without recreating the mobile tracker.',
    bullets: [
      'Web portal and squad management',
      'Role approvals and roster controls',
      'Club workflows and official operations',
      'Management views connected to tracked match data',
    ],
    concept: 'KickChasers supports real clubs with structured team management tools.',
    image: '/mockups/landing/10-your-complete-player-profile.png',
    alt: 'KickChasers portal and club management workflow',
  },
]

function ScreenshotPanel({ tab }: { tab: HowItWorksTab }) {
  if (tab.image && tab.alt) {
    return (
      <div className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(12,20,38,0.94)_24%,rgba(5,13,28,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_52px_rgba(0,0,0,0.3)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.14)_0%,rgba(12,56,150,0.12)_38%,transparent_72%)] blur-3xl transition-opacity duration-300" />
        <div className="relative rounded-[24px] border border-white/8 bg-[#071327]/80 px-4 py-6 sm:px-6">
          <ProductShot
            src={tab.image}
            fallback="/mockups/live-viewer.png"
            alt={tab.alt}
            wrapperClassName="relative mx-auto w-full max-w-[400px]"
            imageClassName="block h-auto w-full object-contain drop-shadow-[0_28px_58px_rgba(0,0,0,0.48)] transition duration-300"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(12,20,38,0.94)_24%,rgba(5,13,28,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_52px_rgba(0,0,0,0.3)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(88%_56%_at_50%_0%,rgba(57,255,20,0.07),transparent_56%)]" />
      <div className="relative flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#39FF14]/30 bg-[#081325]/85 px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Visual slot</p>
        <p className="mt-3 text-xl font-semibold tracking-tight text-white">Screenshot placeholder</p>
        <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-slate-400">
          Drop a future product screenshot into this panel without changing the page layout.
        </p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab.id)

  useEffect(() => {
    document.title = 'How KickChasers Works | KickChasers'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return (
    <PublicSiteShell activeNavId="how-it-works" useLandingAnchors>
      <section className="relative mx-auto w-full max-w-7xl px-6 pb-8 pt-14 lg:px-10 lg:pb-12 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,23,51,0.34)_0%,rgba(3,16,39,0.08)_40%,rgba(2,9,26,0)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(360px_180px_at_18%_10%,rgba(20,92,255,0.12),transparent_64%),radial-gradient(560px_220px_at_50%_54%,rgba(57,255,20,0.06),transparent_68%)]" />

        <div className="relative">
          <Reveal direction="up" className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Product Walkthrough</p>
            <h1 className="mt-4 max-w-[12ch] text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-[3.25rem] lg:text-[3.75rem]">
              How KickChasers Works
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-slate-300 sm:text-[1.05rem]">
              KickChasers connects live match tracking, player development, team management, and performance analysis
              into one AFL platform.
            </p>
            <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-slate-400 sm:text-base">
              The product loop starts on match day, then keeps compounding as that data becomes summaries, player
              history, rankings, and shareable outputs across the wider football community.
            </p>
          </Reveal>

          <Reveal direction="up" delay={90} className="mt-6">
            <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(10,18,34,0.94)_20%,rgba(5,13,28,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_34px_rgba(0,0,0,0.18)] sm:p-5 lg:p-6">
              <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[220px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.05),transparent_70%)] blur-3xl lg:block" />

              <div className="relative mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Product engine</p>
                  <p className="mt-1 text-sm text-slate-400">How one tracked game becomes the rest of the platform</p>
                </div>
              </div>

              <div className="relative hidden items-stretch gap-0 lg:flex">
                {productLoop.map((step, index) => (
                  <div key={step} className="flex min-w-0 flex-1 items-center">
                    <div
                      className={`group relative min-w-0 flex-1 rounded-[18px] border px-4 py-4 transition duration-200 ease-out ${
                        index === 0
                          ? 'border-[#39FF14]/18 bg-[linear-gradient(180deg,rgba(57,255,20,0.05),rgba(7,19,39,0.86))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_24px_rgba(0,0,0,0.16)]'
                          : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(7,19,39,0.82))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                      } hover:-translate-y-0.5 hover:border-white/18 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_28px_rgba(0,0,0,0.18)]`}
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(57,255,20,0.045),transparent_55%)] opacity-0 transition duration-200 group-hover:opacity-100" />
                      <div className="relative">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          {String(index + 1).padStart(2, '0')}
                        </p>
                        <p className="mt-2 text-[15px] font-semibold tracking-tight text-white xl:text-base">{step}</p>
                      </div>
                    </div>
                    {index < productLoop.length - 1 ? (
                      <div className="pointer-events-none relative mx-2 flex w-10 shrink-0 items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-white/10 via-[#39FF14]/45 to-white/10" />
                        <div className="absolute right-0 h-0 w-0 border-b-[4px] border-l-[6px] border-t-[4px] border-b-transparent border-l-[#39FF14]/55 border-t-transparent" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="relative space-y-3 lg:hidden">
                {productLoop.map((step, index) => (
                  <div key={step} className="flex flex-col items-center gap-3">
                    <div
                      className={`w-full rounded-[18px] border px-4 py-4 ${
                        index === 0
                          ? 'border-[#39FF14]/18 bg-[linear-gradient(180deg,rgba(57,255,20,0.05),rgba(7,19,39,0.86))]'
                          : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(7,19,39,0.82))]'
                      } shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{String(index + 1).padStart(2, '0')}</p>
                      <p className="mt-2 text-[15px] font-semibold tracking-tight text-white">{step}</p>
                    </div>
                    {index < productLoop.length - 1 ? (
                      <div className="pointer-events-none relative flex h-7 items-center justify-center">
                        <div className="h-full w-px bg-gradient-to-b from-white/10 via-[#39FF14]/45 to-white/10" />
                        <div className="absolute bottom-0 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#39FF14]/55" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_380px_at_72%_50%,rgba(0,255,150,0.1),rgba(12,56,150,0.08)_42%,transparent_72%)]" />

        <div className="relative">
          <Reveal direction="up" className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Full Product Breakdown</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Explore the platform by workflow</h2>
            <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-slate-300 sm:text-lg">
              Each section below explains a real part of the product, from onboarding and squad structure through to
              live tracking, summaries, leaderboards, and club management.
            </p>
          </Reveal>

          <div className="mt-10 overflow-x-auto pb-2 lg:hidden">
            <div className="flex min-w-max gap-3" role="tablist" aria-label="How KickChasers works sections">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55 ${
                      isActive
                        ? 'border-[rgba(57,255,20,0.18)] bg-[linear-gradient(180deg,rgba(57,255,20,0.05),rgba(8,18,36,0.94)_26%,rgba(5,13,28,0.98))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_34px_rgba(0,0,0,0.22)]'
                        : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(11,20,38,0.94)_24%,rgba(5,13,28,0.98))] text-slate-300 hover:border-white/18 hover:text-white'
                    }`}
                    aria-pressed={isActive}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="hidden lg:block lg:sticky lg:top-28">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,20,38,0.94)_24%,rgba(5,13,28,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_44px_rgba(0,0,0,0.24)]">
                <p className="px-3 pb-3 pt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Feature index</p>
                <div className="space-y-2" role="tablist" aria-label="How KickChasers works sections">
                  {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTabId
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-[22px] border px-4 py-4 text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55 ${
                          isActive
                            ? 'border-[rgba(57,255,20,0.18)] bg-[linear-gradient(180deg,rgba(57,255,20,0.06),rgba(8,18,36,0.96)_28%,rgba(5,13,28,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_34px_rgba(0,0,0,0.22)]'
                            : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className={`absolute inset-y-3 left-0 w-[3px] rounded-full transition ${
                            isActive ? 'bg-[#39FF14] shadow-[0_0_14px_rgba(57,255,20,0.45)]' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#081325] text-[11px] font-semibold tracking-[0.16em] text-slate-400 transition group-hover:text-slate-200">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold transition ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {tab.label}
                          </p>
                          <p className={`mt-1 text-xs leading-relaxed transition ${isActive ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {tab.navBlurb}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            <Reveal key={activeTab.id} direction="up" duration={420}>
              <div
                id={`panel-${activeTab.id}`}
                role="tabpanel"
                aria-label={activeTab.label}
                className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,20,38,0.96)_20%,rgba(5,13,28,0.99))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.28)] transition duration-300 lg:p-8"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(88%_56%_at_50%_0%,rgba(57,255,20,0.05),transparent_56%)]" />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.88fr)] lg:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#39FF14]/20 bg-[#39FF14]/10 text-[11px] font-semibold tracking-[0.16em] text-[#98FFA3]">
                        {String(activeIndex + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Feature explorer</p>
                        <p className="mt-1 text-sm text-slate-400">{activeTab.label}</p>
                      </div>
                    </div>

                    <h3 className="mt-5 max-w-[18ch] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {activeTab.title}
                    </h3>
                    <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-slate-300">{activeTab.summary}</p>

                    <div className="mt-7">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Why it matters</p>
                      <div className="mt-3 grid gap-3">
                        {activeTab.bullets.map((bullet) => (
                          <div
                            key={bullet}
                            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(7,19,39,0.88))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                          >
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#39FF14]" />
                            <p className="text-sm leading-relaxed text-slate-300">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-7 rounded-[24px] border border-[#39FF14]/18 bg-[linear-gradient(135deg,rgba(57,255,20,0.12),rgba(255,255,255,0.03))] p-5">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#98FFA3]">Key concept</p>
                      <p className="mt-3 text-base leading-relaxed text-white">{activeTab.concept}</p>
                    </div>
                  </div>

                  <div className="transition duration-300 ease-out">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-slate-500">Product view</p>
                    <ScreenshotPanel tab={activeTab} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
