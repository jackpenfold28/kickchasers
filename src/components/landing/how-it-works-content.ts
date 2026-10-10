import type { LandingAsset } from './LandingMedia'

export type HowItWorksTab = {
  id: string
  label: string
  navBlurb: string
  title: string
  summary: string
  bullets: string[]
  concept: string
  image?: LandingAsset
  caption?: string
  alt?: string
}

export const productLoop = ['Track Game', 'Game Summary', 'Player Profiles', 'Leaderboards', 'Feed & Sharing'] as const

export const tabs: HowItWorksTab[] = [
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
    image: '10-your-complete-player-profile',
    alt: 'Player profile with football identity, season totals and game history',
    caption: 'Player identity, season totals and game history.',
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
    image: 'team-selection',
    alt: 'Northside Hawks team selection and lineup poster preview',
    caption: 'Team selection and lineup presentation from the squad workflow.',
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
    image: '04-two-trackers-one-game',
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
    image: '09-professional-match-summaries',
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
    image: '10-your-complete-player-profile',
    alt: 'Player profile showing season totals and match history',
    caption: 'Season totals and match history on the player profile.',
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
    image: '03-climb-the-leaderboards',
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
    image: '05-follow-local-footy',
    alt: 'KickChasers feed showing live and recent tracked games',
    caption: 'Live and recent tracked games in the football feed.',
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
    image: '07-see-whos-dominating',
    alt: 'Player Impact-7 rating with Elite, Above Average, Average and Rookie benchmark bands',
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
  },
]

