/** Existing public plans, verified against https://www.kickchasers.com/ on 10 October 2026. */
export type BillingPeriod = 'monthly' | 'yearly'
export type PricingPlanId = 'free' | 'member' | 'player' | 'club'

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

export const pricing: PricingTier[] = [
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

export const comparisonRows = [
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

