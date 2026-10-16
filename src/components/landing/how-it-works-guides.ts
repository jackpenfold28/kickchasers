import { tabs, type HowItWorksTab } from './how-it-works-content.ts'
import type { ProductScreen } from './ProductScreens'

export const guideGroups = ['Getting started', 'Match day', 'Your season', 'Club tools'] as const
export type GuideChapter = { title: string; description: string; screens: ProductScreen[]; layout?: 'pair' | 'wide' | 'mixed' }
export type WorkflowGuide = HowItWorksTab & { group: typeof guideGroups[number]; chapters: GuideChapter[] }
function existing(id: string, group: WorkflowGuide['group'], chapters: GuideChapter[]): WorkflowGuide {
  const original = tabs.find(tab => tab.id === id)
  if (!original) throw new Error(`Missing existing walkthrough: ${id}`)
  return { ...original, group, chapters }
}
export const guides: WorkflowGuide[] = [
  existing('profile-onboarding', 'Getting started', [{
    title:'Your football identity', description:'Your profile brings your club, squad and personal football record together.',
    screens:[{asset:'capture-profile',alt:'Player profile with club identity, season totals and recent games',label:'Start with your football identity'}],
  }]),
  existing('squads-teams', 'Getting started', [{
    title:'A home for your squad', description:'Open your official squad to see its activity, players and management tools.',
    screens:[
      {asset:'capture-squad',alt:'Northside Hawks official squad home with club identity and recent game',label:'Your squad’s home'},
      {asset:'capture-management',alt:'Squad management with members, roles and club tools',label:'Keep the squad organised'},
    ],
  },{
    title:'The right people. The right roles.', description:'Manage members and guest players, then use club roles to organise who can do what.',
    screens:[
      {asset:'capture-members',alt:'Squad member management and roster controls',label:'Manage squad members'},
      {asset:'capture-guests',alt:'Guest-player management within an official squad',label:'Include your guest players'},
      {asset:'capture-roles',alt:'Club roles and game-day responsibilities',label:'Organise club roles'},
    ],
  }]),
  {
    id:'team-selections',label:'Team Selections',navBlurb:'From your lineup to your club colours',group:'Getting started',
    title:'Put your team on the ground.',
    summary:'Build the lineup from your squad, then present it in your club’s colours. Team selection and poster design sit together in the squad workflow.',
    bullets:['Choose players for the lineup','Arrange the team across the ground','Preview club-coloured poster designs','Save the lineup or post it to your squad'],
    concept:'The team you select becomes a lineup your football community can recognise.',
    chapters:[{title:'Select it. Make it yours.',description:'Set your lineup, preview the design and use the available save or squad-post options.',layout:'mixed',screens:[
      {asset:'capture-lineup',alt:'Team selection screen with players arranged in positions on the ground',label:'Set your team'},
      {asset:'capture-selection-design',alt:'Team selection poster with navy and gold club design options',label:'Present it in your colours',sizes:'(max-width:760px) 92vw, 650px'},
    ]}],
  },
  {
    id:'single-player-tracking',label:'Single-player Tracking',navBlurb:'Stay with one player from bounce to siren',group:'Match day',
    title:'Follow the player. Capture the game.',
    summary:'Use the single-player tracker to record one player’s actions as they happen. Live totals, quarter controls and the stat pad keep the match in view on iPhone or iPad.',
    bullets:['Record actions from the stat pad','Keep track of quarters and live totals','Map actions while following the play','Review the player’s contributions throughout the game'],
    concept:'Every recorded action contributes to the player’s match record.',
    chapters:[{title:'One player, on either screen',description:'Use the larger iPad layout or the compact iPhone tracker.',layout:'pair',screens:[
      {asset:'capture-player-ipad',alt:'iPad single-player tracker with live totals, field map and Influence Timeline',label:'Single-player tracking on iPad'},
      {asset:'capture-player-phone',alt:'iPhone single-player tracker with quarter controls and stat pad',label:'Single-player tracking on iPhone'},
    ]}],
  },
  existing('live-tracking', 'Match day', [{
    title:'A complete team view',description:'Switch between players without losing the score, quarter or stat pad. Both device layouts keep the roster close to the action.',layout:'pair',screens:[
      {asset:'capture-team-ipad',alt:'iPad team tracker with roster, selected player and both teams’ stat pads',label:'Team tracking on iPad'},
      {asset:'capture-team-phone',alt:'iPhone team tracker with player switching and stat controls',label:'Team tracking on iPhone'},
    ],
  }]),
  {
    id:'custom-stat-pad',label:'Custom Stat Pads',navBlurb:'Arrange the actions you want to track',group:'Match day',
    title:'Your game. Your stat pad.',
    summary:'Arrange the actions on your stat pad, use modifiers and choose custom statistics for your tracking workflow.',
    bullets:['Arrange the stat-pad layout','Choose the actions you record','Set up action modifiers','Add and manage custom statistics'],
    concept:'Keep the tracking controls organised around the way you follow the game.',
    chapters:[{title:'Make the controls familiar',description:'The stat-pad builder handles the layout. The custom-stat editor handles the actions you add.',screens:[
      {asset:'capture-custom-pad',alt:'Stat-pad builder with action grid and modifier settings',label:'Arrange your stat pad'},
      {asset:'capture-custom-stats',alt:'Custom statistic editor showing actions and their colours',label:'Choose your custom stats'},
    ]}],
  },
  {
    id:'mapping-analysis',label:'Mapping & Match Intelligence',navBlurb:'See where the game is happening',group:'Match day',
    title:'See the play. Read the ground.',
    summary:'Map actions on the oval, filter the passages you want to review and follow the scoring story through the Score Worm and momentum indicators.',
    bullets:['Record action locations on the oval','Filter by actions and quarters','Read the Score Worm and momentum indicators','Review attacking- and defensive-half contributions'],
    concept:'Locations add context to the numbers: what happened, where it happened and how the game was turning.',
    chapters:[{title:'Map the match as it unfolds',description:'The iPad and iPhone layouts put the ground beside the tracking controls.',layout:'pair',screens:[
      {asset:'capture-map-ipad',alt:'iPad field mapping with both stat pads, Score Worm and momentum indicators',label:'Field mapping on iPad'},
      {asset:'capture-map-phone',alt:'iPhone field map with action filters and stat controls',label:'Field mapping on iPhone'},
    ]},{title:'Review the location breakdown',description:'Location analysis separates recorded actions into attacking and defensive halves.',layout:'wide',screens:[
      {asset:'capture-location-analysis',alt:'Location analysis showing kicks and marks in the attacking half and tackles in the defensive half',label:'Where the actions happened'},
    ]}],
  },
  existing('game-summaries', 'Match day', [{
    title:'From live match to final result',description:'Match Day shows the games. The summary brings the score, quarters and player rows together.',screens:[
      {asset:'capture-matchday',alt:'Match Day feed with live and completed games',label:'Find the match'},
      {asset:'capture-summary',alt:'Completed team game summary with quarter scores and player statistics',label:'Review the full result'},
    ],
  }]),
  existing('player-development', 'Your season', [{
    title:'Keep the season connected',description:'Move from a game log into season statistics and the detail of an individual performance.',screens:[
      {asset:'capture-game-log',alt:'Player game log showing recorded matches and results',label:'Return to your games'},
      {asset:'capture-history',alt:'Profile statistics with season selectors, averages and match history',label:'Review your season'},
      {asset:'capture-performance',alt:'Individual match performance with rating and action totals',label:'Look into a performance'},
    ],
  }]),
  existing('ratings-benchmarking', 'Your season', [{
    title:'Understand the rating',description:'Benchmark context helps explain the performance rather than leaving the score as a number on its own.',screens:[
      {asset:'07-see-whos-dominating',alt:'Player Impact-7 rating with Elite, Above Average, Average and Rookie benchmark bands',label:'Read the benchmark context'},
    ],
  }]),
  existing('leaderboards', 'Your season', [{
    title:'See who is producing',description:'Explore the wider leaderboard and the featured weekly performances.',screens:[
      {asset:'capture-leaders',alt:'All-player leaderboard with stat filters and ranked performances',label:'Explore the rankings'},
      {asset:'capture-weekly',alt:'Weekly leaderboard with leading disposal, fantasy and goal performances',label:'Follow the week’s standouts'},
    ],
  },{
    title:'Bring the comparison back to your squad',description:'Squad views provide a closer look at player and team performance within your football context.',screens:[
      {asset:'capture-squad-player-leaders',alt:'Squad leaderboard showing player performance rankings',label:'Compare squad players'},
      {asset:'capture-squad-team-leaders',alt:'Squad leaderboard showing team performance rankings',label:'Review team rankings'},
    ],
  }]),
  {
    id:'game-cards',label:'Game Cards & Album',navBlurb:'Create, save and share a performance',group:'Your season',
    title:'A performance worth keeping.',
    summary:'Turn a saved match into a performance card, choose a design and keep the result in your album or share it with the people who follow your footy.',
    bullets:['Generate a card from a saved match','Preview your completed performance card','Save or share the finished image','Keep your cards together in the album'],
    concept:'A Game Card gives your match a shareable finish without losing its connection to the performance.',
    chapters:[{title:'From saved match to finished card',description:'Card creation prepares the image, then presents the completed performance with save and sharing options.',screens:[
      {asset:'capture-card-creation',alt:'Performance card generation progress with photo preparation and player positioning',label:'Create the card'},
      {asset:'capture-generated',alt:'Generated player performance card with save and share actions',label:'Save or share it'},
    ]},{title:'Your colours. Your collection.',description:'Club-coloured designs give the performance its identity. The album keeps your saved cards together.',screens:[
      {asset:'capture-card',alt:'Navy and gold custom player performance card',label:'Make the card yours'},
      {asset:'capture-album',alt:'Player Card Album displaying saved performance cards',label:'Build your collection'},
    ]}],
  },
  existing('feed-sharing', 'Your season', [{
    title:'The game, in your feed',description:'Player performances and tracked results sit alongside the people and teams you follow.',screens:[
      {asset:'capture-feed-player',alt:'KickChasers feed displaying player performance content',label:'Follow player performances'},
      {asset:'capture-feed',alt:'KickChasers feed displaying a team result with score and reactions',label:'Share the match result'},
    ],
  },{
    title:'After the siren, share the story',description:'Create club-coloured match results and player rankings to celebrate the score and the players behind it.',layout:'wide',screens:[
      {asset:'capture-social-post',alt:'Team result and generated top-scorer, disposal and rating graphics',label:'The result and the standout players',sizes:'(max-width:760px) 92vw, 1000px'},
    ],
  }]),
  {
    id:'best-fairest-voting',label:'Best & Fairest Voting',navBlurb:'Set up cards, assign voters and collect votes',group:'Club tools',
    title:'Give every vote a place.',
    summary:'Organise your club’s voting groups, create vote cards and choose eligible players. Assign cards to voters or share a link, then collect the submitted votes.',
    bullets:['Organise voting groups for your club’s teams','Set up vote cards and eligible players','Assign voters or share a voting link','Submit votes, including cards linked to tracked games'],
    concept:'Voting stays connected to the team, the matchup and the submitted card.',
    chapters:[{title:'Set up the group',description:'Choose the team’s voting group, then configure its cards and eligible players.',screens:[
      {asset:'capture-voting-teams',alt:'Club voting groups for multiple teams',label:'Find your team’s group'},
      {asset:'capture-vote-setup',alt:'Voting group setup with vote cards and eligible-player tabs',label:'Create the vote cards'},
    ]},{title:'Get the voters involved',description:'Assign cards from the match screen or use the link-sharing workflow.',screens:[
      {asset:'capture-assign',alt:'Match voting screen with cards and voter assignment actions',label:'Assign a voter'},
      {asset:'capture-share-vote',alt:'Voting card link-sharing screen',label:'Share a voting link'},
    ]},{title:'Record the votes',description:'Choose the players for each vote. Tracked-game cards also show recommended votes based on game ratings.',screens:[
      {asset:'capture-vote',alt:'Best and Fairest voting card with player selections and submit action',label:'Complete the voting card'},
      {asset:'capture-tracked-vote',alt:'Tracked-game voting card with rating-based recommendations and player selections',label:'Use the tracked-game context'},
    ]}],
  },
  {
    id:'tallies-awards',label:'Tallies & Club Awards',navBlurb:'Review cards, matchups and the season tally',group:'Club tools',
    title:'The season adds up.',
    summary:'Keep Best & Fairest, club awards and submitted cards together. Review the matchup history and the tallies available to authorised coaches and admins.',
    bullets:['Review the season’s Best & Fairest tally','See club and custom award results','Check submitted cards and their recorded voters','Review completed and pending cards by matchup'],
    concept:'Separate award results remain readable while their submitted cards stay attached to the match.',
    chapters:[{title:'Read the tallies',description:'Best & Fairest totals and other award results have their own views, with submitted-card history beneath them.',screens:[
      {asset:'capture-tally',alt:'Season Best and Fairest tally with ranked vote totals',label:'Review the season tally'},
      {asset:'capture-game-tallies',alt:'Club and custom award tallies with submitted card history',label:'Look through the card history'},
    ]},{title:'Keep awards and matchups organised',description:'Review the other awards and use the matchup view to find completed or pending cards.',screens:[
      {asset:'capture-awards',alt:'Club voting tools for other awards',label:'Manage other awards'},
      {asset:'capture-vote-matchups',alt:'Voting matchups with completed and pending card counts and View Cards actions',label:'Find the matchup’s cards'},
    ]}],
  },
  existing('portal-club-management', 'Club tools', []),
]
