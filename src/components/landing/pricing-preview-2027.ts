/** Proposed UI content only. Never use this file to grant or restrict product access. */
export type PreviewPlanId = 'free' | 'member' | 'tracker-pro' | 'club'
export type PreviewValue = boolean | string
export type PreviewFeature = { id: string; label: string; values: [PreviewValue, PreviewValue, PreviewValue, PreviewValue]; note?: string }
const feature = (id: string, label: string, values: PreviewFeature['values'], note?: string): PreviewFeature => ({ id, label, values, note })
const everyone: PreviewFeature['values'] = [true, true, true, true]
const advanced: PreviewFeature['values'] = [false, false, true, true]
const official: PreviewFeature['values'] = [false, false, false, true]
const planned: PreviewFeature['values'] = [false, false, 'Coming 2027', 'Coming 2027']
const clubPlanned: PreviewFeature['values'] = [false, false, false, 'Coming 2027']
const review: PreviewFeature['values'] = ['Under review', 'Under review', 'Under review', 'Under review']

export const previewCategories = [
 { id: 'tracking', title: 'Core tracking & statistics', features: [
  feature('single', 'Single-player tracking', ['Unlimited games','Unlimited games','Unlimited games','Unlimited games']),
  feature('team', 'Team tracking', ['5 players per game','5 players per game','24 players per game','Full team tracking']),
  feature('standard', 'Standard statistics', everyone, 'Kicks, Handballs, Marks, Goals, Behinds and Tackles.'),
  feature('advanced', 'Advanced statistics', advanced),
  feature('custom', 'Custom statistics', [false,false,'Up to 5','Up to 5']),
  feature('fantasy', 'Fantasy Score', advanced),
  feature('summaries', 'Game summaries', ['Basic','Basic','Advanced','Advanced']),
  feature('team-comparisons', 'Team statistics and comparisons', advanced),
  feature('maps', 'Field maps and heat maps', advanced),
  feature('voice', 'Voice-assisted tracking', planned),
  feature('team-stats', 'Team Stats Game tracker', official),
  feature('linked', 'Linked games / co-tracking', official),
 ]},
 { id: 'performance', title: 'Performance & player development', features: [
  feature('history', 'Personal game history', ['Last 3 games','Last 3 games','Full history','Full history']),
  feature('totals', 'Basic season totals', everyone),
  feature('season', 'Detailed season statistics', advanced),
  feature('career', 'Career statistics', advanced),
  feature('benchmarks', 'Player benchmarks', advanced),
  feature('impact', 'Impact 7 ratings', advanced),
  feature('player-comparisons', 'Player comparisons', advanced),
  feature('ai', 'AI performance insights', planned),
  feature('off-season', 'Personal off-season training', planned),
  feature('evolution', 'Player Evolution Card', review),
  feature('evolution-analytics', 'Advanced Evolution analytics', review),
 ]},
 { id: 'cards', title: 'Game Cards & sharing', features: [
  feature('standard-cards', 'Standard Game Cards', everyone),
  feature('premium-cards', 'Premium Game Card designs', advanced),
  feature('album', 'Game Card Album', everyone),
  feature('sharing', 'Create and share cards', everyone),
  feature('premium-evolution', 'Premium Evolution Card designs', review),
 ]},
 { id: 'live', title: 'Match Day & live statistics', features: [
  feature('completed-scores', 'Completed match scores', everyone),
  feature('completed-stats', 'Completed match statistics', everyone),
  feature('live-scores', 'Live match scores', ['Not included*',true,true,true]),
  feature('live-team', 'Live team statistics', ['Not included*',true,true,true]),
  feature('live-player', 'Live player statistics', ['Not included*',true,true,true]),
  feature('feed', 'Existing Match Day feed', everyone),
  feature('broadcast', 'Live personal squad broadcasting', [false,false,'$25/squad/season','Included for official squads']),
 ]},
 { id: 'squads', title: 'Personal squads & management', features: [
  feature('create-squads', 'Create personal squads', everyone),
  feature('squad-count', 'Number of personal squads', ['Under review','Under review','Unlimited','Unlimited personal squads']),
  feature('members', 'Personal squad membership', ['Up to 5*','Up to 5*','Maximum 25','Official squad rules apply'], 'Player/Tracker Pro: guests count towards the 25-member limit.'),
  feature('guests', 'Guest players', ['Under review','Under review',true,true]),
  feature('tracked-limit', 'Maximum players tracked per team game', ['5','5','24','Full team']),
  feature('team-games', 'Unlimited team games', everyone),
  feature('management', 'Personal squad management', ['Limited','Limited',true,true]),
  feature('verification', 'Official squad verification', official),
  feature('administration', 'Official club administration', official),
  feature('selection', 'Official team selection', official),
  feature('best-fairest', 'Best & Fairest administration', official),
 ]},
 { id: 'coaching', title: 'Coaching, club tools & reports', features: [
  feature('pdf', 'PDF statistics exports', official),
  feature('reports', 'Club-wide performance reports', official),
  feature('coaches', 'Multiple authorised coaches and trackers', official),
  feature('official-selections', 'Official team selections', official),
  feature('official-votes', 'Best & Fairest administration', official),
  feature('corner', 'Coaches Corner', clubPlanned),
  feature('committee', 'Match Committee', clubPlanned),
  feature('planner', 'Training Planner', clubPlanned),
  feature('drills', 'Drill Creator', clubPlanned),
  feature('simulation', 'Animated drill simulation', clubPlanned),
  feature('view-training', 'View published club training plans', ['Free, subject to permissions','Free, subject to permissions','Free, subject to permissions','Free, subject to permissions'], 'Subject to squad membership and visibility permissions. Planned creation and administration require Club and appropriate official roles.'),
 ]},
]

export const previewPlans: { id: PreviewPlanId; name: string; price: string; yearlyPrice: string; annualSaving?: number; audience: string; positioning: string; featured?: boolean; highlights: { feature?: string; text: string; planned?: boolean }[] }[] = [
 { id:'free', name:'Free', price:'$0', yearlyPrice:'$0', audience:'For players getting started', positioning:'Start tracking your footy.', highlights:[
  {feature:'single',text:'Unlimited single-player games'}, {feature:'team',text:'Track up to 5 players per team game'}, {feature:'standard',text:'Six essential statistics'}, {feature:'completed-stats',text:'Completed match scores and stats'}, {feature:'standard-cards',text:'Standard Game Cards'},
 ]},
 { id:'member', name:'Member', price:'$5', yearlyPrice:'$39.95', annualSaving:33, audience:'For match-day followers', positioning:'Follow the action live.', highlights:[
  {text:'Everything in Free'}, {feature:'live-scores',text:'Live match scores'}, {feature:'live-team',text:'Live team statistics'}, {feature:'live-player',text:'Live player statistics'}, {feature:'feed',text:'Access through the existing Match Day feed'},
 ]},
 { id:'tracker-pro', name:'Player/Tracker Pro', price:'$15', yearlyPrice:'$84.95', annualSaving:53, audience:'For dedicated trackers', positioning:'The complete football tracking toolkit.', featured:true, highlights:[
  {text:'Everything in Member'}, {feature:'advanced',text:'Advanced and custom statistics'}, {feature:'team',text:'Full-team tracking: 24 players per game'}, {feature:'squad-count',text:'Unlimited personal squads'}, {feature:'premium-cards',text:'Premium Game Cards'}, {feature:'season',text:'Advanced performance analysis'},
 ]},
 { id:'club', name:'Club', price:'$99.95', yearlyPrice:'$999.95', annualSaving:17, audience:'For official clubs & coaching staff', positioning:'Everything your club needs.', highlights:[
  {feature:'administration',text:'Official squad and club management'}, {feature:'coaches',text:'Multiple authorised coaches and trackers'}, {feature:'linked',text:'Linked games and Team Stats tracking'}, {feature:'selection',text:'Team selections and Best & Fairest'}, {feature:'pdf',text:'PDF reports and official live broadcasting'}, {feature:'corner',text:'Coaches Corner',planned:true},
 ]},
]

export const liveSquadPass = {
 price: '$25', cadence: 'per squad, per season',
 description: 'Enable live scores and player statistics for your personal squad. Accepted squad members can watch live without needing a Member subscription.',
 conditions: ['Requires Player/Tracker Pro.', 'One pass per personal squad, valid for one football season. A separate pass is needed for each squad.', 'Maximum 25 members per personal squad, including guests. Maximum 24 tracked players per game.', 'Official Club broadcasting is included in Club for eligible official squads.'],
}
