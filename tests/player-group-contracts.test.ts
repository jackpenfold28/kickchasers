import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  activePlayerGroupMemberships,
  activePlayerGroups,
  buildPlayerGroupAssignment,
  canonicalizePlayerGroupName,
  matchesPlayerGroupManagementContract,
  membershipsForSquadMember,
  primaryGroupIdForSquadMember,
  removePlayerGroupSelection,
  summarizePlayerGroups,
  uniquePlayerGroupIds,
  type PlayerGroupMembershipRecord,
  type PlayerGroupRecord,
} from '../src/lib/canonical/player-groups.ts'

const groups: PlayerGroupRecord[] = [
  { id: 'u18', squadId: 'squad-1', name: 'U18', slug: 'u18', sortOrder: 20, isDefault: true, archivedAt: null },
  { id: 'senior', squadId: 'squad-1', name: 'Seniors', slug: 'seniors', sortOrder: 10, isDefault: true, archivedAt: null },
  { id: 'archived', squadId: 'squad-1', name: 'Old side', slug: 'old-side', sortOrder: 0, isDefault: false, archivedAt: '2026-01-01' },
]

const memberships: PlayerGroupMembershipRecord[] = [
  { squadId: 'squad-1', groupId: 'senior', squadMemberId: 'linked-1', isPrimary: true, assignedAt: 'now' },
  { squadId: 'squad-1', groupId: 'u18', squadMemberId: 'linked-1', isPrimary: false, assignedAt: 'now' },
  { squadId: 'squad-1', groupId: 'u18', squadMemberId: 'guest-1', isPrimary: true, assignedAt: 'now' },
  { squadId: 'squad-1', groupId: 'archived', squadMemberId: 'linked-1', isPrimary: false, assignedAt: 'then' },
]

test('active groups list correctly', () => assert.deepEqual(activePlayerGroups(groups).map((group) => group.id), ['senior', 'u18']))
test('archived groups are excluded from the active list', () => assert.equal(activePlayerGroups(groups).some((group) => group.id === 'archived'), false))
test('active groups use server sort order then name', () => assert.deepEqual(activePlayerGroups(groups).map((group) => group.name), ['Seniors', 'U18']))
test('member counts map to stable group ids', () => assert.deepEqual(summarizePlayerGroups(groups, memberships).map((group) => group.memberCount), [1, 2]))
test('primary member counts resolve independently', () => assert.deepEqual(summarizePlayerGroups(groups, memberships).map((group) => group.primaryMemberCount), [1, 1]))
test('archived memberships are excluded from active membership state', () => assert.equal(activePlayerGroupMemberships(groups, memberships).length, 3))
test('membership lookup uses squad-member identity', () => assert.equal(membershipsForSquadMember(memberships, 'linked-1').length, 3))
test('primary membership resolves by explicit flag', () => assert.equal(primaryGroupIdForSquadMember(memberships, 'linked-1'), 'senior'))
test('a member may have no primary group', () => assert.equal(primaryGroupIdForSquadMember(memberships, 'missing'), null))

test('create and rename names trim without client slug generation', () => assert.equal(canonicalizePlayerGroupName('  Reserves  '), 'Reserves'))
test('blank group names are rejected before mutation', () => assert.throws(() => canonicalizePlayerGroupName('  '), /valid side name/))
test('non-string group names are rejected before mutation', () => assert.throws(() => canonicalizePlayerGroupName(null), /valid side name/))
test('duplicate group ids collapse before assignment', () => assert.deepEqual(uniquePlayerGroupIds(['u18', 'u18', 'senior']), ['u18', 'senior']))
test('empty group ids never reach the assignment RPC', () => assert.deepEqual(uniquePlayerGroupIds(['', '  ', 'u18']), ['u18']))
test('multiple group membership is preserved', () => assert.deepEqual(buildPlayerGroupAssignment(['senior', 'u18'], 'senior').groupIds, ['senior', 'u18']))
test('a primary group is always included in the RPC group array', () => assert.deepEqual(buildPlayerGroupAssignment(['u18'], 'senior').groupIds, ['u18', 'senior']))
test('assignment may deliberately have no primary', () => assert.equal(buildPlayerGroupAssignment(['u18'], null).primaryGroupId, null))
test('unassigning a non-primary group preserves the primary', () => assert.deepEqual(removePlayerGroupSelection(['senior', 'u18'], 'senior', 'u18'), { groupIds: ['senior'], primaryGroupId: 'senior' }))
test('unassigning the primary leaves no inferred fallback', () => assert.deepEqual(removePlayerGroupSelection(['senior', 'u18'], 'senior', 'senior'), { groupIds: ['u18'], primaryGroupId: null }))
test('unassign all preserves the squad member and only clears group ids', () => assert.deepEqual(buildPlayerGroupAssignment([], null), { groupIds: [], primaryGroupId: null }))

test('custom squad owner is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOwner: true, isOfficial: false }), true))
test('custom accepted admin is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false, squadRole: 'admin', squadMemberStatus: 'accepted' }), true))
test('custom accepted coach is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false, squadRole: 'coach', squadMemberStatus: 'accepted' }), true))
test('custom tracker is denied by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false, squadRole: 'tracker', squadMemberStatus: 'accepted' }), false))
test('ordinary member is denied by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false, squadRole: 'member', squadMemberStatus: 'accepted' }), false))
test('pending member is denied by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false, squadRole: 'admin', squadMemberStatus: 'pending' }), false))
test('guest or unrelated authenticated user is denied by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: false }), false))
test('platform admin is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isPlatformAdmin: true, isOfficial: true }), true))
test('official club admin is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: true, clubRoles: ['admin'] }), true))
test('official club coach is allowed by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: true, clubRoles: ['coach'] }), true))
test('official club tracker is denied by the deployed contract', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: true, clubRoles: ['tracker'] }), false))
test('official squad-role admin alone does not replace club-role authority', () => assert.equal(matchesPlayerGroupManagementContract({ isOfficial: true, squadRole: 'admin', squadMemberStatus: 'accepted' }), false))

test('repository reads capability RPCs and active RLS-protected rows', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.match(source, /f_can_read_squad_player_groups/)
  assert.match(source, /f_can_manage_squad_player_groups/)
  assert.match(source, /from\('squad_player_groups'\)/)
  assert.match(source, /\.is\('archived_at', null\)/)
  assert.match(source, /from\('squad_player_group_members'\)/)
})

test('create rename and archive use canonical atomic RPCs', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.match(source, /rpc\('rpc_create_squad_player_group'/)
  assert.match(source, /rpc\('rpc_rename_squad_player_group'/)
  assert.match(source, /rpc\('rpc_archive_squad_player_group'/)
  assert.doesNotMatch(source, /insert\(/)
  assert.doesNotMatch(source, /delete\(/)
})

test('membership save is one atomic bulk-assignment RPC using squad-member id', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.match(source, /rpc\('rpc_set_squad_member_player_groups'/)
  assert.match(source, /_squad_member_id: squadMemberId/)
  assert.match(source, /_primary_group_id: assignment\.primaryGroupId/)
})

test('page load never invokes ensure or legacy backfill mutations', async () => {
  const [repository, page] = await Promise.all([
    readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(repository, /rpc_ensure_squad_player_groups/)
  assert.doesNotMatch(repository, /rpc_backfill_squad_player_group_assignments/)
  assert.doesNotMatch(page, /rpc_ensure_squad_player_groups|rpc_backfill_squad_player_group_assignments/)
})

test('roster UI exposes group badges, primary state, and an explicit edit action', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /Edit player sides/)
  assert.match(source, /membership\.isPrimary \? ' • Primary'/)
  assert.match(source, /openPlayerGroupAssignment\(actionMember\)/)
})

test('successful mutations refresh group state and relevant roster state without reload', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /refreshPlayerGroups\(true\)/)
  assert.match(source, /loadPlayerGroups\(\)/)
  assert.match(source, /includeRoster \? loadDetail\(true\)/)
  assert.doesNotMatch(source, /window\.location\.reload/)
})

test('loading error unauthorized and empty states remain distinct', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading player sides/)
  assert.match(source, /Try again/)
  assert.match(source, /current server role cannot read/)
  assert.match(source, /No active player sides/)
})

test('canonical roster position values remain wired unchanged', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /PLAYER_POSITIONS\.map/)
})

test('Team Selection is not coupled to the player-group repository', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /team.selection|team_selection/i)
})

test('player stats and game history modules are outside this slice', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /portal-stats|portal-games|player-event|benchmark|impact/i)
})
