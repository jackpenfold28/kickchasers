import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { buildAuthenticatedVoteCardRoute, buildInitialVoteSelections as buildInitialSelections, buildVoteGroupRoute, buildVoteSubmitEntries as buildSubmitEntries, mapVoteCardContext, mapVoteGroupRows, matchesVoteManagementContract, parsePointValues, validateVoteMatchupInput, validateVoteSelections as validateSelections } from '../src/lib/canonical/squad-votes.ts'
import type { PublicVoteCardContext } from '../src/components/vote-card/publicVoteCard.types.ts'

const groups = mapVoteGroupRows(
  [{ id: 'g1', squad_id: 's1', name: 'Seniors', description: '2026', sort_order: 2, is_active: true }, { id: 'g2', squad_id: 's1', name: 'Archive', sort_order: 1, is_active: false }],
  [{ id: 'a1', group_id: 'g1', name: 'Best & Fairest', category: 'best_and_fairest', point_values: [5, 4, 3], max_cards_per_matchup: 2, color_key: null, is_active: true }],
  [{ id: 'm1', group_id: 'g1' }],
  [{ id: 'c1', matchup_id: 'm1', status: 'pending' }, { id: 'c2', matchup_id: 'm1', status: 'submitted' }],
)

const role = (overrides: Parameters<typeof matchesVoteManagementContract>[0] = {}) => matchesVoteManagementContract({ viewerUserId: 'viewer', ownerUserId: 'owner', squadMemberStatus: 'accepted', ...overrides })
test('custom owner management matches server', () => assert.equal(role({ viewerUserId: 'owner' }), true))
test('custom accepted admin management matches server', () => assert.equal(role({ squadRole: 'admin' }), true))
test('custom coach management matches server', () => assert.equal(role({ squadRole: 'coach' }), false))
test('custom tracker management matches server', () => assert.equal(role({ squadRole: 'tracker' }), false))
test('ordinary member management matches server', () => assert.equal(role({ squadRole: 'member' }), false))
test('guest management matches server', () => assert.equal(role({ viewerUserId: null }), false))
test('unrelated authenticated user management matches server', () => assert.equal(role(), false))
test('official club admin management matches server', () => assert.equal(role({ isOfficial: true, clubRoles: ['admin'] }), true))
test('official club coach management matches server', () => assert.equal(role({ isOfficial: true, clubRoles: ['coach'] }), true))
test('official club tracker management matches server', () => assert.equal(role({ isOfficial: true, clubRoles: ['tracker'] }), false))
test('platform admin management matches server', () => assert.equal(role({ isPlatformAdmin: true }), true))
test('pending custom admin is denied by server contract', () => assert.equal(role({ squadRole: 'admin', squadMemberStatus: 'pending' }), false))

test('group list preserves exact squad identity', () => assert.equal(groups[0].squadId, 's1'))
test('group list preserves names', () => assert.equal(groups[0].name, 'Seniors'))
test('active lifecycle is preserved', () => assert.equal(groups[0].isActive, true))
test('archived lifecycle is preserved', () => assert.equal(groups[1].isActive, false))
test('matchup count is scoped by group', () => assert.equal(groups[0].matchupCount, 1))
test('pending card count excludes submitted cards', () => assert.equal(groups[0].pendingCardCount, 1))
test('award types remain attached to exact group', () => assert.equal(groups[0].awardTypes[0].groupId, 'g1'))
test('award category is preserved', () => assert.equal(groups[0].awardTypes[0].category, 'best_and_fairest'))
test('point rules preserve order', () => assert.deepEqual(groups[0].awardTypes[0].pointValues, [5, 4, 3]))
test('card limit is preserved', () => assert.equal(groups[0].awardTypes[0].maxCardsPerMatchup, 2))

test('point parser accepts unique positive values', () => assert.deepEqual(parsePointValues('5, 4,3,2,1'), [5, 4, 3, 2, 1]))
test('point parser rejects blank values', () => assert.throws(() => parsePointValues(''), /unique positive/))
test('point parser rejects duplicate allocations', () => assert.throws(() => parsePointValues('5,5,3'), /unique positive/))
test('point parser rejects zero and negative-only rules', () => assert.throws(() => parsePointValues('0,-1'), /unique positive/))
test('manual matchup requires round', () => assert.throws(() => validateVoteMatchupInput({ sourceType: 'manual', opponentName: 'A', matchupDate: '2026-01-01' }), /round/))
test('manual matchup requires opponent', () => assert.throws(() => validateVoteMatchupInput({ sourceType: 'manual', roundLabel: '1', matchupDate: '2026-01-01' }), /opponent/))
test('manual matchup requires date', () => assert.throws(() => validateVoteMatchupInput({ sourceType: 'manual', roundLabel: '1', opponentName: 'A' }), /date/))
test('complete manual matchup is accepted', () => assert.doesNotThrow(() => validateVoteMatchupInput({ sourceType: 'manual', roundLabel: '1', opponentName: 'A', matchupDate: '2026-01-01' })))
test('tracked matchup requires game identity', () => assert.throws(() => validateVoteMatchupInput({ sourceType: 'tracked_game' }), /tracked game/))
test('tracked matchup accepts exact game identity', () => assert.doesNotThrow(() => validateVoteMatchupInput({ sourceType: 'tracked_game', gameId: 'game-1' })))

const rpcPayload = {
  card: { id: 'card-1', cardIndex: 1, status: 'pending', assignedVoterName: 'Voter' },
  squad: { id: 's1', name: 'Squad', logoUrl: null }, voteGroup: { id: 'g1', name: 'Seniors', description: '2026' },
  matchup: { id: 'm1', sourceType: 'manual', roundLabel: 'Round 1', opponentName: 'Rivals', matchupDate: '2026-01-01', gameId: null, gameSquadId: null, gameTeamSide: null },
  awardType: { id: 'a1', name: 'Best & Fairest', category: 'best_and_fairest', colorKey: null, pointValues: [3, 2, 1], maxCardsPerMatchup: 1 },
  candidatePool: [
    { gamePlayerId: null, squadMemberId: 'sm1', profileUserId: 'u1', subjectKey: 'squad_member:sm1', subjectName: 'One', jerseyNumber: 1, isGuest: false },
    { gamePlayerId: null, squadMemberId: 'sm2', profileUserId: null, subjectKey: 'squad_member:sm2', subjectName: 'Guest', jerseyNumber: 2, isGuest: true },
    { gamePlayerId: null, squadMemberId: 'sm3', profileUserId: 'u3', subjectKey: 'squad_member:sm3', subjectName: 'Three', jerseyNumber: 3, isGuest: false },
  ], entries: [],
}
const context = mapVoteCardContext(rpcPayload)

test('authenticated context maps valid access', () => assert.equal(context.accessState, 'valid'))
test('authenticated context preserves card identity', () => assert.equal(context.card.id, 'card-1'))
test('authenticated context preserves squad identity', () => assert.equal(context.squad.id, 's1'))
test('authenticated context preserves matchup identity', () => assert.equal(context.matchup.id, 'm1'))
test('authenticated context preserves candidate squad-member IDs', () => assert.equal(context.candidatePool[0].squadMemberId, 'sm1'))
test('authenticated context preserves guest identity', () => assert.equal(context.candidatePool[1].isGuest, true))
test('submitted context maps submitted access', () => assert.equal(mapVoteCardContext({ ...rpcPayload, card: { ...rpcPayload.card, status: 'submitted' } }).accessState, 'submitted'))
test('void context maps invalid access', () => assert.equal(mapVoteCardContext({ ...rpcPayload, card: { ...rpcPayload.card, status: 'void' } }).accessState, 'invalid'))

const initial = buildInitialSelections(context)
test('configured points create exact vote slots', () => assert.deepEqual(initial.map((entry) => entry.pointsValue), [3, 2, 1]))
test('incomplete vote is rejected', () => assert.match(validateSelections(context, initial).formError ?? '', /Complete every/))
const complete = initial.map((entry, index) => ({ ...entry, candidate: context.candidatePool[index] }))
test('complete unique vote is accepted', () => assert.equal(validateSelections(context, complete).formError, null))
test('duplicate player allocation is rejected', () => assert.match(validateSelections(context, complete.map((entry) => ({ ...entry, candidate: context.candidatePool[0] }))).formError ?? '', /Complete every/))
test('manual submission uses squad-member identity', () => assert.deepEqual(buildSubmitEntries(context, complete).map((entry) => entry.squadMemberId), ['sm1', 'sm2', 'sm3']))
test('manual submission never fabricates game-player identity', () => assert.equal(buildSubmitEntries(context, complete).some((entry) => entry.gamePlayerId), false))

const trackedContext: PublicVoteCardContext = { ...context, matchup: { ...context.matchup, sourceType: 'tracked_game', gameId: 'game-1' }, candidatePool: context.candidatePool.map((candidate, index) => ({ ...candidate, gamePlayerId: `gp${index + 1}` })) }
const trackedSelections = buildInitialSelections(trackedContext).map((entry, index) => ({ ...entry, candidate: trackedContext.candidatePool[index] }))
test('tracked submission uses game-player identity', () => assert.deepEqual(buildSubmitEntries(trackedContext, trackedSelections).map((entry) => entry.gamePlayerId), ['gp1', 'gp2', 'gp3']))
test('tracked submission never fabricates squad-member submission identity', () => assert.equal(buildSubmitEntries(trackedContext, trackedSelections).some((entry) => entry.squadMemberId), false))

test('authenticated route safely preserves squad and card ids', () => assert.equal(buildAuthenticatedVoteCardRoute('s/a', 'c/1'), '/teams/s%2Fa/votes/cards/c%2F1'))
test('group route safely preserves squad id', () => assert.equal(buildVoteGroupRoute('s/a'), '/teams/s%2Fa?tab=votes'))

test('repository uses server permission helpers', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /f_can_manage_squad_votes/); assert.match(source, /f_can_view_squad_vote_tallies/) })
test('group and member writes use guarded RPCs', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_create_squad_vote_group/); assert.match(source, /rpc_set_squad_vote_group_members/) })
test('award create update and delete use guarded RPCs', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_create_squad_vote_award_type/); assert.match(source, /rpc_update_squad_vote_award_type/); assert.match(source, /rpc_delete_squad_vote_award_type/) })
test('matchup creation uses guarded RPC and rejects Team Stats games', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_create_squad_vote_matchup/); assert.match(source, /neq\('tracker_mode', 'team_stats_game'\)/) })
test('card assignment uses canonical RPC with notifications', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_assign_squad_vote_card/); assert.match(source, /_send_notification: true/) })
test('authenticated submission uses guarded RPC', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_submit_squad_vote_card/) })
test('tally uses canonical private server output', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_get_squad_vote_tally/) })
test('breakdown uses canonical private server output', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.match(source, /rpc_get_squad_vote_matchup_breakdown/) })
test('public token page uses only token-scoped RPCs', async () => { const source = await readFile(new URL('../src/routes/PublicVoteCardPage.tsx', import.meta.url), 'utf8'); assert.match(source, /rpc_get_public_squad_vote_card_context/); assert.match(source, /rpc_submit_public_squad_vote_card/); assert.doesNotMatch(source, /from\('squad_vote_/) })
test('authenticated page uses only guarded card RPC repository', async () => { const source = await readFile(new URL('../src/routes/portal/AuthenticatedVoteCardPage.tsx', import.meta.url), 'utf8'); assert.match(source, /getVoteCardContext/); assert.match(source, /submitVoteCard/); assert.doesNotMatch(source, /supabase/) })
test('assigned and reminder notifications route to exact guarded card', async () => { const source = await readFile(new URL('../src/lib/portal-notification-routing.ts', import.meta.url), 'utf8'); assert.match(source, /votes\/cards\/\$\{encodeURIComponent\(voteCardId\)\}/) })
test('anonymous vote-card remains outside protected layout', async () => { const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'); assert.ok(source.indexOf("path: 'vote-card/:token'") < source.indexOf('element: <PortalLayout')) })
test('authenticated card remains inside protected layout', async () => { const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'); assert.ok(source.indexOf("path: 'teams/:id/votes/cards/:cardId'") > source.indexOf('element: <PortalLayout')) })
test('team hub entry uses live server capability', async () => { const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8'); assert.match(source, /getSquadVoteAccess/); assert.match(source, /canManageVotes/) })
test('voting UI distinguishes loading empty error and unauthorized', async () => { const source = await readFile(new URL('../src/components/squads/BestAndFairestPanel.tsx', import.meta.url), 'utf8'); assert.match(source, /Loading Best & Fairest/); assert.match(source, /No active voting groups/); assert.match(source, /Voting could not be loaded/); assert.match(source, /Voting manager access required/) })
test('player groups remain uncoupled from voting repository', async () => { const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8'); assert.doesNotMatch(source, /squad-votes|vote_group/) })
test('Coaches Team Stats module remains uncoupled from voting', async () => { const source = await readFile(new URL('../src/lib/team-stats-games.ts', import.meta.url), 'utf8'); assert.doesNotMatch(source, /squad-votes|vote_group/) })
test('Team Selection remains uncoupled from voting', async () => { const source = await readFile(new URL('../src/routes/portal/TeamSelectionPage.tsx', import.meta.url), 'utf8'); assert.doesNotMatch(source, /squad-votes|vote_group/) })
test('voting source adds no migration or raw vote-table writes', async () => { const source = await readFile(new URL('../src/lib/squad-votes.ts', import.meta.url), 'utf8'); assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(|create table|alter table|migration/i) })
