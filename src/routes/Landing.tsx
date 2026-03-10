import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProductShot } from '../components/landing/ProductShot'
import { HeroStaggerItem, Reveal } from '../components/landing/Motion'

const authLink = (path: string) => `/login?next=${encodeURIComponent(path)}`

const navItems = [
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'Pricing', href: '#pricing', id: 'pricing' },
  { label: 'Portal', href: '#portal', id: 'portal' },
]

const pricing = [
  {
    name: 'Free',
    label: 'For first games',
    price: '$0',
    frequency: '/month',
    description: 'Start tracking your game with core match stats and player snapshots.',
    features: ['Live match logging', 'Basic player profile', 'Limited history'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Player',
    label: 'Most selected',
    price: '$14',
    frequency: '/month',
    description: 'Advanced visibility for athletes committed to measurable progress.',
    features: ['Full match history', 'Player ratings', 'Performance trends'],
    cta: 'Choose Player',
    highlight: true,
  },
  {
    name: 'Club',
    label: 'For programs',
    price: '$59',
    frequency: '/month',
    description: 'Shared performance intelligence across squads, staff, and families.',
    features: ['Multi-team access', 'Club-wide analytics', 'Priority support'],
    cta: 'Choose Club',
    highlight: false,
  },
]

export default function Landing() {
  const [activeSection, setActiveSection] = useState('features')

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.id)
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-42% 0px -45% 0px',
        threshold: [0.1, 0.25, 0.45, 0.7],
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
      observer.disconnect()
    }
  }, [])

  return (
    <main className="relative overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_720px_at_8%_-12%,rgba(20,92,255,0.25),transparent_58%),radial-gradient(950px_620px_at_90%_4%,rgba(57,255,20,0.08),transparent_50%),linear-gradient(180deg,#02091A_0%,#040B1C_44%,#030A1A_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_560px_at_50%_114%,rgba(0,0,0,0.5),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[16vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.26),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[16vw] bg-[linear-gradient(270deg,rgba(0,0,0,0.26),transparent)]" />

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-1 py-2 sm:px-2">
          <div className="flex items-center gap-3">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-14 w-auto" />
          </div>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Landing sections">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/45 ${
                    isActive ? 'text-white' : 'text-slate-200/95 hover:text-white'
                  }`}
                >
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
            <Link
              to="/login"
              className="rounded-xl border border-white/25 bg-white/[0.03] px-4 py-2 text-slate-100 transition-colors hover:border-white/35 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/50"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-[#7CFF64]/65 bg-[#39FF14]/92 px-4 py-2 font-semibold text-white shadow-[0_6px_18px_rgba(57,255,20,0.25)] transition hover:bg-[#50FF2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Create Account
            </Link>
          </div>
        </div>
        <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pb-14 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:px-10 lg:pb-16 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,#051733_0%,#031027_44%,#02091A_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_340px_at_78%_18%,rgba(0,255,150,0.1),transparent_72%)]" />
        <div className="max-w-2xl">
          <HeroStaggerItem
            as="p"
            delay={40}
            className="inline-flex rounded-full border border-white/15 bg-white/[0.02] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-300"
          >
            PERFORMANCE PLATFORM FOR FOOTBALLERS
          </HeroStaggerItem>
          <HeroStaggerItem
            as="h1"
            delay={140}
            className="mt-5 max-w-[14ch] text-4xl font-semibold leading-[1.01] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Track Your Performance.
            <span className="block text-[#39FF14]">Chase the Next Level.</span>
          </HeroStaggerItem>
          <HeroStaggerItem as="p" delay={240} className="mt-6 max-w-[52ch] text-base leading-relaxed text-slate-300 sm:text-lg">
            KickChasers is built for Australian Rules Football athletes, families, and clubs. Capture live match
            moments, review your numbers, and turn match data into clear performance direction.
          </HeroStaggerItem>
          <HeroStaggerItem as="div" delay={320} className="mt-8 flex flex-wrap gap-3.5">
            <Link
              to={authLink('/new')}
              className="rounded-xl bg-[#39FF14] px-7 py-3 text-base font-semibold text-[#07111F] shadow-[0_14px_34px_rgba(57,255,20,0.18)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/20 px-7 py-3 text-base font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55"
            >
              View Product Story
            </a>
          </HeroStaggerItem>
        </div>

        <div>
          <ProductShot
            src="/mockups/landing/01-see-every-match-moment.png"
            fallback="/mockups/live-viewer.png"
            alt="KickChasers live tracking screen"
            wrapperClassName="relative mx-auto w-full max-w-[455px]"
            glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.24)_0%,rgba(12,56,150,0.14)_44%,rgba(2,9,26,0)_72%)] blur-3xl"
            imageClassName="block h-auto w-full object-contain"
          />
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section id="features" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_380px_at_72%_50%,rgba(0,255,150,0.12),rgba(12,56,150,0.08)_42%,transparent_72%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal
            direction="right"
            duration={600}
            distance={24}
            className="relative mx-auto w-full max-w-[620px] pb-6 pt-6 lg:-mb-24 lg:z-20"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,150,0.2)_0%,rgba(10,84,186,0.16)_42%,rgba(11,145,166,0.12)_58%,transparent_76%)] blur-3xl" />
            <img
              src="/mockups/landing/02-track-every-afl-stat-live.png"
              alt="KickChasers live tracking on tablet"
              loading="lazy"
              className="relative z-10 ml-auto w-[76%] object-contain drop-shadow-[0_34px_66px_rgba(0,0,0,0.55)]"
            />
            <img
              src="/mockups/landing/04-two-trackers-one-game.png"
              alt="KickChasers live tracking on mobile"
              loading="lazy"
              className="absolute bottom-0 left-[5%] z-20 w-[60%] object-contain drop-shadow-[0_28px_52px_rgba(0,0,0,0.5)]"
            />
          </Reveal>
          <Reveal direction="left" duration={600} distance={18} className="max-w-[580px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live Match Tracking</p>
            <h2 className="mt-3 max-w-[15ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Track Every Moment Of The Game
            </h2>
            <p className="mt-4 max-w-[50ch] text-lg leading-relaxed text-slate-300">
              Log disposals, tackles, marks and scoring chains live from the boundary, bench, or coaches box.
              KickChasers syncs instantly across tablet and mobile so the entire team sees the same performance
              picture.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-28 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,28,0)_0%,rgba(5,14,33,0.34)_35%,rgba(5,14,33,0.12)_100%)]" />
        <div className="relative mt-0 grid items-center gap-8 lg:grid-cols-[.98fr_1.02fr]">
          <Reveal direction="up" className="max-w-[620px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Performance Insight</p>
            <h2 className="mt-3 max-w-[12ch] text-3xl font-semibold tracking-tight sm:text-5xl">Understand Your Performance</h2>
            <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-slate-300">
              Ratings, trends, and match summaries are organized to show what is actually improving. Follow your form,
              identify weak phases, and make each next game more intentional.
            </p>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-400">
              Designed for serious progression, not vanity metrics.
            </p>
          </Reveal>

          <Reveal direction="right" delay={90}>
            <ProductShot
              src="/mockups/landing/09-professional-match-summaries.png"
              fallback="/mockups/live-viewer.png"
              alt="Performance summary and ratings screen"
              wrapperClassName="relative mx-auto w-full max-w-[400px]"
            />
          </Reveal>
        </div>

        <div className="relative mx-auto mt-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="relative mt-8 grid items-center gap-8 lg:grid-cols-[1.04fr_.96fr] lg:gap-6">
          <Reveal direction="up" delay={70} className="relative z-10 max-w-[580px] lg:self-center">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Competition Layer</p>
            <h2 className="mt-3 max-w-[12ch] text-3xl font-semibold tracking-tight sm:text-5xl">Climb The Leaderboards</h2>
            <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-slate-300">
              Compare output across your competition, track consistency, and see where your season stands against
              peers in real time.
            </p>
          </Reveal>
          <Reveal direction="left" className="relative z-20 mx-auto w-full max-w-[460px] md:-mb-12 lg:-mb-24 lg:-mt-6 lg:ml-auto lg:max-w-[430px]">
            <ProductShot
              src="/mockups/landing/03-climb-the-leaderboards.png"
              fallback="/mockups/live-viewer.png"
              alt="Leaderboard and season comparison screen"
              wrapperClassName="relative mx-auto w-full max-w-[390px] lg:translate-x-6"
              glowClassName="pointer-events-none absolute left-[48%] top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.2)_0%,rgba(7,66,145,0.14)_45%,transparent_76%)] blur-3xl"
            />
          </Reveal>
        </div>

        <div className="relative z-10 mt-12 grid items-center gap-8 lg:mt-8 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal direction="left" className="relative">
            <ProductShot
              src="/mockups/landing/07-see-whos-dominating.png"
              fallback="/mockups/live-viewer.png"
              alt="Players, leagues, and squads ecosystem view"
              wrapperClassName="relative mx-auto w-full max-w-[520px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,150,0.14),rgba(12,56,150,0.08)_45%,transparent_74%)] blur-3xl"
            />
          </Reveal>
          <Reveal direction="up" delay={70} className="max-w-[600px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Football Ecosystem</p>
            <h2 className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Built For Players, Parents And Clubs
            </h2>
            <p className="mt-4 max-w-[50ch] text-lg leading-relaxed text-slate-300">
              Match day tracking works from the boundary, bench, or coaches box, with mobile and tablet sync keeping
              everyone aligned. Families follow progress while clubs maintain one shared performance picture.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section id="portal" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 pb-20 pt-8 lg:px-10 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,28,0)_0%,rgba(5,14,33,0.28)_52%,rgba(4,11,28,0.12)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_78%_54%,rgba(0,255,150,0.1),transparent_70%)]" />
        <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_1fr]">
          <Reveal direction="up" className="max-w-[580px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portal</p>
            <h2 className="mt-3 max-w-[13ch] text-3xl font-semibold tracking-tight sm:text-5xl">Beyond Game Day</h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-slate-300">
              The portal supports your performance workflow with profile management, squads, and season history on a
              larger screen.
            </p>
          </Reveal>
          <Reveal direction="right" delay={90} className="relative z-20 md:-mt-10 lg:-mt-20">
            <ProductShot
              src="/mockups/landing/10-your-complete-player-profile.png"
              fallback="/mockups/hub.png"
              alt="KickChasers portal profile and squad view"
              wrapperClassName="relative mx-auto w-full max-w-[470px] lg:max-w-[540px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.16),transparent_72%)] blur-3xl"
            />
          </Reveal>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_280px_at_30%_50%,rgba(0,255,150,0.1),transparent_72%)]" />
        <div className="relative grid items-center gap-7 lg:grid-cols-[.96fr_1.04fr]">
          <Reveal direction="left">
            <ProductShot
              src="/mockups/landing/11-instant-club-content-creation.png"
              fallback="/mockups/live-viewer.png"
              alt="Social content creation workflow in KickChasers"
              wrapperClassName="relative mx-auto w-full max-w-[500px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.14),transparent_70%)] blur-3xl"
            />
          </Reveal>
          <Reveal direction="up" delay={90} className="max-w-[620px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Secondary Ecosystem Benefit</p>
            <h2 className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Social Media Creation At Your Fingertips
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-slate-300">
              Turn performances into polished, share-ready visuals in seconds and keep club communication consistent
              without extra design tools.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section id="pricing" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,26,0)_0%,rgba(6,17,42,0.28)_55%,rgba(3,10,26,0)_100%)]" />
        <div className="relative">
          <Reveal direction="up" className="max-w-[780px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Choose Your Performance Tier</h2>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricing.map((tier, index) => (
              <Reveal
                key={tier.name}
                as="article"
                direction="up"
                delay={index * 90}
                duration={650}
                className={`rounded-[28px] border px-6 pb-6 pt-5 transition duration-200 ${
                  tier.highlight
                    ? 'relative border-[#39FF14]/55 bg-[linear-gradient(180deg,rgba(57,255,20,0.14),rgba(6,17,42,0.7))] shadow-[0_20px_50px_rgba(57,255,20,0.12)]'
                    : 'border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]'
                }`}
              >
                {tier.highlight ? (
                  <p className="mb-4 inline-flex rounded-full border border-[#88FF73]/45 bg-[#39FF14]/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8FFAA]">
                    Most Popular
                  </p>
                ) : null}
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{tier.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{tier.name}</p>
                <p className="mt-4 text-5xl font-semibold leading-none tracking-tight">
                  {tier.price}
                  <span className="ml-1 text-sm font-normal text-slate-400">{tier.frequency}</span>
                </p>
                <p className="mt-4 min-h-[52px] text-sm leading-relaxed text-slate-300">{tier.description}</p>
                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm text-slate-300">
                  {tier.features.map((feature) => (
                    <p key={feature}>{feature}</p>
                  ))}
                </div>
                <Link
                  to="/register"
                  className={`mt-7 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55 ${
                    tier.highlight
                      ? 'bg-[#39FF14] text-[#07111F] hover:brightness-110'
                      : 'border border-white/20 text-white hover:border-white/35 hover:bg-white/[0.03]'
                  }`}
                >
                  {tier.cta}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative py-20 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_240px_at_50%_40%,rgba(57,255,20,0.14),transparent_75%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 text-center lg:px-10">
          <Reveal as="h2" direction="up" className="max-w-[14ch] text-4xl font-semibold tracking-tight sm:text-5xl">
            Start Tracking Your Game
          </Reveal>
          <Reveal direction="up" delay={90}>
            <Link
              to="/register"
              className="mt-6 inline-flex rounded-xl bg-[#39FF14] px-8 py-3 text-base font-semibold text-[#07111F] shadow-[0_14px_30px_rgba(57,255,20,0.2)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Create Your Account
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="relative border-t border-white/10 bg-[#030A1A]/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
            <span className="text-sm text-slate-300">KickChasers</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
            <Link to="/login" className="hover:text-white">
              Login
            </Link>
            <Link to="/register" className="hover:text-white">
              Register
            </Link>
            <Link to={authLink('/hub')} className="hover:text-white">
              Portal
            </Link>
            <span className="text-slate-500">Privacy</span>
            <span className="text-slate-500">Terms</span>
          </nav>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} KickChasers. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
