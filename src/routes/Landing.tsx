import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductShot } from '../components/landing/ProductShot'
import { HeroStaggerItem, Reveal } from '../components/landing/Motion'
import { PricingSection } from '../components/landing/PricingSection'
import { PublicSiteShell, publicNavItems } from '@/components/landing/PublicSiteShell'

const authLink = (path: string) => `/sign-in?redirect=${encodeURIComponent(path)}`

const navItems = publicNavItems.filter((item) => item.type === 'hash')

const heroValidationItems = [
  {
    title: 'Live Match Tracking',
    description: 'Capture every stat as the game happens.',
  },
  {
    title: 'Performance Ratings',
    description: 'Turn raw stats into clear player impact.',
  },
  {
    title: 'Season Development',
    description: 'Track performance across every game.',
  },
] as const

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
    <PublicSiteShell activeNavId={activeSection}>
      <section className="relative mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pb-10 pt-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:px-10 lg:pb-12 lg:pt-14">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,#051733_0%,#031027_44%,#02091A_100%)]" />
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
            className="mt-5 max-w-[12ch] text-4xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.5rem]"
          >
            Track Every Stat.
            <span className="block text-[#39FF14]">Prove Your Performance.</span>
          </HeroStaggerItem>
          <HeroStaggerItem as="p" delay={240} className="mt-5 max-w-[54ch] text-base leading-relaxed text-slate-300 sm:text-lg">
            KickChasers captures live match statistics for Australian Rules Football, turning every game into real
            performance insights for players, families, and clubs.
          </HeroStaggerItem>
          <HeroStaggerItem as="div" delay={320} className="mt-7 flex flex-wrap gap-3.5">
            <Link
              to={authLink('/new')}
              className="rounded-xl bg-[#39FF14] px-7 py-3 text-base font-semibold text-[#07111F] shadow-[0_14px_34px_rgba(57,255,20,0.18)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Get Started
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-xl border border-white/20 px-7 py-3 text-base font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/55"
            >
              View Product Story
            </Link>
          </HeroStaggerItem>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-[58%] top-[34%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.12)_0%,rgba(57,255,20,0.05)_34%,rgba(2,9,26,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute left-[56%] top-[72%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.07)_0%,rgba(12,56,150,0.04)_42%,rgba(2,9,26,0)_72%)] blur-3xl" />
          <div className="relative mx-auto hidden w-full max-w-[560px] md:block">
            <div className="relative z-10">
              <ProductShot
                src="/mockups/landing/04-two-trackers-one-game.png"
                fallback="/mockups/live-viewer.png"
                alt="KickChasers iPad and mobile live tracking interface"
                wrapperClassName="relative mx-auto w-full max-w-[520px]"
                glowClassName="pointer-events-none absolute left-1/2 top-[46%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.08)_0%,rgba(57,255,20,0.03)_36%,rgba(2,9,26,0)_72%)] blur-3xl"
                imageClassName="block h-auto w-full object-contain drop-shadow-[0_30px_68px_rgba(0,0,0,0.48)]"
              />
            </div>

            <div className="absolute bottom-[-2%] left-[8%] z-20 w-[30%] max-w-[160px] overflow-hidden sm:max-w-[190px] lg:bottom-0 lg:left-[9%]">
              <ProductShot
                src="/mockups/landing/02-track-every-afl-stat-live.png"
                fallback="/mockups/live-viewer.png"
                alt="KickChasers live match tracking phone interface"
                wrapperClassName="relative mx-auto w-full"
                glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.1)_0%,transparent_72%)] blur-3xl"
                imageClassName="block h-auto w-full object-contain drop-shadow-[0_24px_44px_rgba(0,0,0,0.42)]"
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px] md:hidden">
            <ProductShot
              src="/mockups/landing/02-track-every-afl-stat-live.png"
              fallback="/mockups/live-viewer.png"
              alt="KickChasers live match tracking interface"
              wrapperClassName="relative mx-auto w-full max-w-[360px]"
              glowClassName="pointer-events-none absolute left-1/2 top-[46%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.08)_0%,rgba(57,255,20,0.03)_36%,rgba(2,9,26,0)_72%)] blur-3xl"
              imageClassName="block h-auto w-full object-contain drop-shadow-[0_28px_58px_rgba(0,0,0,0.46)]"
            />
          </div>
        </div>

        <HeroStaggerItem as="div" delay={380} className="lg:col-span-2">
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            {heroValidationItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(7,19,39,0.85))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.45)]" />
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </HeroStaggerItem>
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

      <PricingSection />

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative py-20 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_240px_at_50%_40%,rgba(57,255,20,0.14),transparent_75%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 text-center lg:px-10">
          <Reveal as="h2" direction="up" className="max-w-[14ch] text-4xl font-semibold tracking-tight sm:text-5xl">
            Start Tracking Your Game
          </Reveal>
          <Reveal direction="up" delay={90}>
            <Link
              to="/sign-up"
              className="mt-6 inline-flex rounded-xl bg-[#39FF14] px-8 py-3 text-base font-semibold text-[#07111F] shadow-[0_14px_30px_rgba(57,255,20,0.2)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030A1A]"
            >
              Create Your Account
            </Link>
          </Reveal>
        </div>
      </section>
    </PublicSiteShell>
  )
}
