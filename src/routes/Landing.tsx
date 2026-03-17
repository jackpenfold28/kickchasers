import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductShot } from '../components/landing/ProductShot'
import { HeroStaggerItem, Reveal, VisualMotion } from '../components/landing/Motion'
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

const audienceCards = [
  {
    title: 'Players',
    description: 'See live output, form lines, and proof of progress after every game.',
  },
  {
    title: 'Families',
    description: 'Follow the match story in real time without relying on patchy updates.',
  },
  {
    title: 'Clubs',
    description: 'Keep squads, staff, and season performance aligned in one operating picture.',
  },
] as const

const trackingMoments = ['Boundary entry', 'Bench-side sync', 'Coaches-box visibility'] as const
const insightSignals = ['Trend lines', 'Ratings context', 'Match-summary takeaways'] as const
const leaderboardSignals = ['Round-by-round rank', 'Consistency pressure', 'Category leaders'] as const
const portalSignals = ['Profile management', 'Squad workflows', 'Season history'] as const

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

        <HeroStaggerItem as="div" delay={420} duration={820} direction="right" distance={22} className="relative">
          <div className="pointer-events-none absolute left-[58%] top-[34%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.12)_0%,rgba(57,255,20,0.05)_34%,rgba(2,9,26,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute left-[56%] top-[72%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.07)_0%,rgba(12,56,150,0.04)_42%,rgba(2,9,26,0)_72%)] blur-3xl" />
          <div className="relative mx-auto hidden w-full max-w-[560px] md:block">
            <VisualMotion className="relative z-10" delay={60} duration={900} direction="right" distance={14} drift={6} parallax={12} mobileParallax={0} scale={0.982}>
              <ProductShot
                src="/mockups/landing/04-two-trackers-one-game.png"
                fallback="/mockups/live-viewer.png"
                alt="KickChasers iPad and mobile live tracking interface"
                wrapperClassName="relative mx-auto w-full max-w-[520px]"
                glowClassName="pointer-events-none absolute left-1/2 top-[46%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.08)_0%,rgba(57,255,20,0.03)_36%,rgba(2,9,26,0)_72%)] blur-3xl"
                imageClassName="block h-auto w-full object-contain drop-shadow-[0_30px_68px_rgba(0,0,0,0.48)]"
              />
            </VisualMotion>

            <VisualMotion
              className="absolute bottom-[-2%] left-[8%] z-20 w-[30%] max-w-[160px] overflow-hidden sm:max-w-[190px] lg:bottom-0 lg:left-[9%]"
              delay={130}
              duration={860}
              direction="right"
              distance={12}
              drift={4}
              parallax={7}
              mobileParallax={0}
              scale={0.984}
            >
              <ProductShot
                src="/mockups/landing/02-track-every-afl-stat-live.png"
                fallback="/mockups/live-viewer.png"
                alt="KickChasers live match tracking phone interface"
                wrapperClassName="relative mx-auto w-full"
                glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.1)_0%,transparent_72%)] blur-3xl"
                imageClassName="block h-auto w-full object-contain drop-shadow-[0_24px_44px_rgba(0,0,0,0.42)]"
              />
            </VisualMotion>
          </div>

          <div className="relative mx-auto w-full max-w-[440px] md:hidden">
            <VisualMotion delay={80} duration={720} direction="right" drift={3} parallax={4} mobileParallax={3} distance={10} scale={0.986}>
              <ProductShot
                src="/mockups/landing/02-track-every-afl-stat-live.png"
                fallback="/mockups/live-viewer.png"
                alt="KickChasers live match tracking interface"
                wrapperClassName="relative mx-auto w-full max-w-[360px]"
                glowClassName="pointer-events-none absolute left-1/2 top-[46%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.08)_0%,rgba(57,255,20,0.03)_36%,rgba(2,9,26,0)_72%)] blur-3xl"
                imageClassName="block h-auto w-full object-contain drop-shadow-[0_28px_58px_rgba(0,0,0,0.46)]"
              />
            </VisualMotion>
          </div>
        </HeroStaggerItem>

        <div className="lg:col-span-2">
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            {heroValidationItems.map((item, index) => (
              <HeroStaggerItem
                key={item.title}
                as="div"
                delay={560 + index * 70}
                duration={620}
                className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(7,19,39,0.85))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.45)]" />
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
              </HeroStaggerItem>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <section className="relative mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_240px_at_50%_20%,rgba(57,255,20,0.08),transparent_72%)]" />
        <div className="kc-card-cluster relative grid gap-4 md:grid-cols-3">
          {audienceCards.map((item, index) => (
            <Reveal
              key={item.title}
              as="article"
              delay={index * 70}
              duration={620}
              distance={12}
              scale={0.992}
              baseOpacity={0.8}
              className="kc-story-panel rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,18,37,0.92))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_44px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-white">{item.title}</p>
                <span className="h-2.5 w-2.5 rounded-full bg-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.4)]" />
              </div>
              <p className="mt-3 max-w-[30ch] text-sm leading-6 text-slate-300">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section id="features" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_380px_at_72%_50%,rgba(0,255,150,0.12),rgba(12,56,150,0.08)_42%,transparent_72%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative mx-auto w-full max-w-[620px] pb-6 pt-6 lg:-mb-24 lg:z-20">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,150,0.2)_0%,rgba(10,84,186,0.16)_42%,rgba(11,145,166,0.12)_58%,transparent_76%)] blur-3xl" />
            <VisualMotion
              className="relative z-10"
              delay={120}
              direction="right"
              distance={12}
              drift={4}
              parallax={7}
              mobileParallax={2}
              scale={0.982}
              scrollScale={0.02}
              mobileScrollScale={0.01}
              baseOpacity={0.94}
              settleStart={1}
              settleEnd={0.3}
            >
              <img
                src="/mockups/landing/02-track-every-afl-stat-live.png"
                alt="KickChasers live tracking on tablet"
                loading="lazy"
                className="ml-auto w-[76%] object-contain drop-shadow-[0_34px_66px_rgba(0,0,0,0.55)]"
              />
            </VisualMotion>
            <VisualMotion
              className="absolute bottom-0 left-[5%] z-20 w-[60%]"
              delay={190}
              direction="left"
              distance={10}
              drift={2}
              parallax={10}
              mobileParallax={2}
              scale={0.988}
              scrollScale={0.016}
              mobileScrollScale={0.008}
              baseOpacity={0.96}
              settleStart={0.96}
              settleEnd={0.34}
            >
              <img
                src="/mockups/landing/04-two-trackers-one-game.png"
                alt="KickChasers live tracking on mobile"
                loading="lazy"
                className="w-full object-contain drop-shadow-[0_28px_52px_rgba(0,0,0,0.5)]"
              />
            </VisualMotion>
          </div>
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[580px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.58))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="left" duration={560} distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Live Match Tracking
            </Reveal>
            <Reveal as="h2" direction="left" delay={45} duration={600} distance={14} baseOpacity={0.74} className="mt-3 max-w-[15ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Track Every Moment Of The Game
            </Reveal>
            <Reveal as="p" direction="left" delay={95} duration={620} distance={14} baseOpacity={0.72} className="mt-4 max-w-[50ch] text-lg leading-relaxed text-slate-300">
              Log disposals, tackles, marks and scoring chains live from the boundary, bench, or coaches box.
              KickChasers syncs instantly across tablet and mobile so the entire team sees the same performance
              picture.
            </Reveal>
            <div className="kc-card-cluster mt-6 grid gap-3 sm:grid-cols-3">
              {trackingMoments.map((item, index) => (
                <Reveal
                  key={item}
                  as="div"
                  delay={150 + index * 45}
                  distance={12}
                  scale={0.99}
                  baseOpacity={0.82}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  {item}
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-28 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,28,0)_0%,rgba(5,14,33,0.34)_35%,rgba(5,14,33,0.12)_100%)]" />
        <div className="relative mt-0 grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-5">
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[590px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.52))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="up" distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">Performance Insight</Reveal>
            <Reveal as="h2" direction="up" delay={45} distance={14} baseOpacity={0.74} className="mt-3 max-w-[12ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Understand Your Performance
            </Reveal>
            <Reveal as="p" direction="up" delay={95} distance={14} baseOpacity={0.72} className="mt-4 max-w-[48ch] text-lg leading-relaxed text-slate-300">
              Ratings, trends, and match summaries are organized to show what is actually improving. Follow your form,
              identify weak phases, and make each next game more intentional.
            </Reveal>
            <Reveal as="p" direction="up" delay={135} distance={12} baseOpacity={0.74} className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-400">
              Designed for serious progression, not vanity metrics.
            </Reveal>
            <div className="kc-card-cluster mt-6 grid gap-3 sm:grid-cols-3">
              {insightSignals.map((item, index) => (
                <Reveal
                  key={item}
                  as="div"
                  delay={165 + index * 40}
                  distance={12}
                  scale={0.99}
                  baseOpacity={0.82}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.38)]" />
                    <span>{item}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <VisualMotion
            className="relative mx-auto w-full max-w-[620px] md:max-w-[720px] lg:mr-[-2rem] lg:max-w-[760px]"
            delay={120}
            direction="right"
            drift={3}
            parallax={7}
            mobileParallax={2}
            distance={10}
            scale={0.99}
            scrollScale={0.016}
            mobileScrollScale={0.007}
            baseOpacity={0.96}
            settleStart={0.94}
            settleEnd={0.36}
          >
            <ProductShot
              src="/mockups/landing/09-professional-match-summaries.png"
              fallback="/mockups/live-viewer.png"
              alt="Performance summary and ratings screen"
              wrapperClassName="relative mx-auto w-full max-w-[560px] sm:max-w-[620px] lg:max-w-[700px]"
              glowClassName="pointer-events-none absolute left-[52%] top-[46%] h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.16)_0%,rgba(7,66,145,0.12)_42%,transparent_76%)] blur-3xl"
            />
          </VisualMotion>
        </div>

        <div className="relative mx-auto mt-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="relative mt-8 grid items-center gap-8 lg:grid-cols-[1.04fr_.96fr] lg:gap-6">
          <div className="kc-story-panel kc-reveal-copy kc-section-copy relative z-10 max-w-[580px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.52))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8 lg:self-center">
            <Reveal as="p" direction="up" delay={70} distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">Competition Layer</Reveal>
            <Reveal as="h2" direction="up" delay={120} distance={14} baseOpacity={0.74} className="mt-3 max-w-[12ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Climb The Leaderboards
            </Reveal>
            <Reveal as="p" direction="up" delay={170} distance={14} baseOpacity={0.72} className="mt-4 max-w-[48ch] text-lg leading-relaxed text-slate-300">
              Compare output across your competition, track consistency, and see where your season stands against
              peers in real time.
            </Reveal>
            <div className="kc-card-cluster mt-6 grid gap-3 sm:grid-cols-3">
              {leaderboardSignals.map((item, index) => (
                <Reveal
                  key={item}
                  as="div"
                  delay={210 + index * 40}
                  distance={12}
                  scale={0.99}
                  baseOpacity={0.82}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  {item}
                </Reveal>
              ))}
            </div>
          </div>
          <VisualMotion
            className="relative z-20 mx-auto w-full max-w-[460px] md:-mb-12 lg:-mb-24 lg:-mt-6 lg:ml-auto lg:max-w-[430px]"
            direction="left"
            delay={130}
            drift={3}
            parallax={7}
            mobileParallax={2}
            distance={12}
            scale={0.985}
            scrollScale={0.018}
            mobileScrollScale={0.008}
            baseOpacity={0.95}
            settleStart={0.98}
            settleEnd={0.34}
          >
            <ProductShot
              src="/mockups/landing/03-climb-the-leaderboards.png"
              fallback="/mockups/live-viewer.png"
              alt="Leaderboard and season comparison screen"
              wrapperClassName="relative mx-auto w-full max-w-[390px] lg:translate-x-6"
              glowClassName="pointer-events-none absolute left-[48%] top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.2)_0%,rgba(7,66,145,0.14)_45%,transparent_76%)] blur-3xl"
            />
          </VisualMotion>
        </div>

        <div className="relative z-10 mt-12 grid items-center gap-8 lg:mt-8 lg:grid-cols-[1.05fr_.95fr]">
          <VisualMotion
            className="relative"
            direction="left"
            delay={140}
            drift={2}
            parallax={5}
            mobileParallax={1.5}
            distance={10}
            scale={0.988}
            scrollScale={0.014}
            mobileScrollScale={0.006}
            baseOpacity={0.95}
            settleStart={0.96}
            settleEnd={0.36}
          >
            <ProductShot
              src="/mockups/landing/07-see-whos-dominating.png"
              fallback="/mockups/live-viewer.png"
              alt="Players, leagues, and squads ecosystem view"
              wrapperClassName="relative mx-auto w-full max-w-[520px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,150,0.14),rgba(12,56,150,0.08)_45%,transparent_74%)] blur-3xl"
            />
          </VisualMotion>
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[600px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.52))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="up" delay={70} distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">Football Ecosystem</Reveal>
            <Reveal as="h2" direction="up" delay={120} distance={14} baseOpacity={0.74} className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Built For Players, Parents And Clubs
            </Reveal>
            <Reveal as="p" direction="up" delay={170} distance={14} baseOpacity={0.72} className="mt-4 max-w-[50ch] text-lg leading-relaxed text-slate-300">
              Match day tracking works from the boundary, bench, or coaches box, with mobile and tablet sync keeping
              everyone aligned. Families follow progress while clubs maintain one shared performance picture.
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section id="portal" className="scroll-mt-28 relative mx-auto w-full max-w-7xl px-6 pb-20 pt-8 lg:px-10 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,28,0)_0%,rgba(5,14,33,0.28)_52%,rgba(4,11,28,0.12)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_78%_54%,rgba(0,255,150,0.1),transparent_70%)]" />
        <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_1fr]">
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[580px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.52))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="up" distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">Portal</Reveal>
            <Reveal as="h2" direction="up" delay={45} distance={14} baseOpacity={0.74} className="mt-3 max-w-[13ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Beyond Game Day
            </Reveal>
            <Reveal as="p" direction="up" delay={95} distance={14} baseOpacity={0.72} className="mt-4 max-w-[52ch] text-lg leading-relaxed text-slate-300">
              The portal supports your performance workflow with profile management, squads, and season history on a
              larger screen.
            </Reveal>
            <div className="kc-card-cluster mt-6 grid gap-3 sm:grid-cols-3">
              {portalSignals.map((item, index) => (
                <Reveal
                  key={item}
                  as="div"
                  delay={150 + index * 40}
                  distance={12}
                  scale={0.99}
                  baseOpacity={0.82}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  {item}
                </Reveal>
              ))}
            </div>
          </div>
          <VisualMotion
            className="relative z-20 md:-mt-10 lg:-mt-20"
            direction="right"
            delay={140}
            drift={2}
            parallax={5}
            mobileParallax={1.5}
            distance={10}
            scale={0.988}
            scrollScale={0.014}
            mobileScrollScale={0.006}
            baseOpacity={0.95}
            settleStart={0.98}
            settleEnd={0.36}
          >
            <ProductShot
              src="/mockups/landing/10-your-complete-player-profile.png"
              fallback="/mockups/hub.png"
              alt="KickChasers portal profile and squad view"
              wrapperClassName="relative mx-auto w-full max-w-[470px] lg:max-w-[540px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.16),transparent_72%)] blur-3xl"
            />
          </VisualMotion>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_280px_at_30%_50%,rgba(0,255,150,0.1),transparent_72%)]" />
        <div className="relative grid items-center gap-7 lg:grid-cols-[.96fr_1.04fr]">
          <VisualMotion
            direction="left"
            delay={140}
            drift={2}
            parallax={4}
            mobileParallax={1.5}
            distance={10}
            scale={0.988}
            scrollScale={0.012}
            mobileScrollScale={0.005}
            baseOpacity={0.95}
            settleStart={0.98}
            settleEnd={0.36}
          >
            <ProductShot
              src="/mockups/landing/11-instant-club-content-creation.png"
              fallback="/mockups/live-viewer.png"
              alt="Social content creation workflow in KickChasers"
              wrapperClassName="relative mx-auto w-full max-w-[500px]"
              glowClassName="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.14),transparent_70%)] blur-3xl"
            />
          </VisualMotion>
          <div className="kc-story-panel kc-reveal-copy kc-section-copy max-w-[620px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(5,14,33,0.52))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
            <Reveal as="p" direction="up" delay={90} distance={12} baseOpacity={0.78} className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Secondary Ecosystem Benefit
            </Reveal>
            <Reveal as="h2" direction="up" delay={140} distance={14} baseOpacity={0.74} className="mt-3 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-5xl">
              Social Media Creation At Your Fingertips
            </Reveal>
            <Reveal as="p" direction="up" delay={190} distance={14} baseOpacity={0.72} className="mt-4 max-w-[52ch] text-lg leading-relaxed text-slate-300">
              Turn performances into polished, share-ready visuals in seconds and keep club communication consistent
              without extra design tools.
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <PricingSection />

      <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <section className="kc-cta-stage relative py-20 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_240px_at_50%_40%,rgba(57,255,20,0.14),transparent_75%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 text-center lg:px-10">
          <Reveal
            as="div"
            distance={12}
            scale={0.99}
            baseOpacity={0.82}
            className="kc-story-panel mb-8 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300"
          >
            Your next match becomes your next proof point
          </Reveal>
          <Reveal as="h2" direction="up" distance={14} baseOpacity={0.76} className="max-w-[14ch] text-4xl font-semibold tracking-tight sm:text-5xl">
            Start Tracking Your Game
          </Reveal>
          <Reveal direction="up" delay={70} distance={12} scale={0.99} baseOpacity={0.84}>
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
