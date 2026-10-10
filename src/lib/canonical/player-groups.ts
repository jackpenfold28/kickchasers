export type PlayerGroupRecord = {
  id: string
  squadId: string
  name: string
  slug: string
  sortOrder: number
  isDefault: boolean
  archivedAt: string | null
}

export type PlayerGroupMembershipRecord = {
  squadId: string
  groupId: string
  squadMemberId: string
  isPrimary: boolean
  assignedAt: string
}

export type PlayerGroupSummary = PlayerGroupRecord & {
  memberCount: number
  primaryMemberCount: number
}

export type PlayerGroupPermissionFixture = {
  isPlatformAdmin?: boolean
  isOwner?: boolean
  isOfficial: boolean
  squadRole?: string | null
  squadMemberStatus?: string | null
  clubRoles?: readonly string[]
}

// This mirrors the deployed f_can_manage_squad_player_groups predicate for fixtures and
// documentation. Runtime authority always comes from that server capability RPC.
export function matchesPlayerGroupManagementContract(fixture: PlayerGroupPermissionFixture): boolean {
  if (fixture.isPlatformAdmin || fixture.isOwner) return true
  if (fixture.isOfficial) {
    return (fixture.clubRoles ?? []).some((role) => role === 'admin' || role === 'coach')
  }
  return fixture.squadMemberStatus === 'accepted' && ['owner', 'admin', 'coach'].includes(fixture.squadRole ?? '')
}

export function canonicalizePlayerGroupName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter a valid side name.')
  const name = value.trim()
  if (!name) throw new Error('Enter a valid side name.')
  return name
}

export function uniquePlayerGroupIds(groupIds: readonly string[]): string[] {
  return Array.from(new Set(groupIds.map((id) => id.trim()).filter(Boolean)))
}

export function activePlayerGroups(groups: readonly PlayerGroupRecord[]): PlayerGroupRecord[] {
  return groups
    .filter((group) => group.archivedAt === null)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
}

export function activePlayerGroupMemberships(
  groups: readonly PlayerGroupRecord[],
  memberships: readonly PlayerGroupMembershipRecord[],
): PlayerGroupMembershipRecord[] {
  const activeIds = new Set(activePlayerGroups(groups).map((group) => group.id))
  const seen = new Set<string>()
  return memberships.filter((membership) => {
    const key = `${membership.groupId}:${membership.squadMemberId}`
    if (!activeIds.has(membership.groupId) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function summarizePlayerGroups(
  groups: readonly PlayerGroupRecord[],
  memberships: readonly PlayerGroupMembershipRecord[],
): PlayerGroupSummary[] {
  const activeMemberships = activePlayerGroupMemberships(groups, memberships)
  return activePlayerGroups(groups).map((group) => ({
    ...group,
    memberCount: activeMemberships.filter((membership) => membership.groupId === group.id).length,
    primaryMemberCount: activeMemberships.filter(
      (membership) => membership.groupId === group.id && membership.isPrimary,
    ).length,
  }))
}

export function membershipsForSquadMember(
  memberships: readonly PlayerGroupMembershipRecord[],
  squadMemberId: string,
): PlayerGroupMembershipRecord[] {
  return memberships.filter((membership) => membership.squadMemberId === squadMemberId)
}

export function primaryGroupIdForSquadMember(
  memberships: readonly PlayerGroupMembershipRecord[],
  squadMemberId: string,
): string | null {
  return membershipsForSquadMember(memberships, squadMemberId).find((membership) => membership.isPrimary)?.groupId ?? null
}

export function buildPlayerGroupAssignment(
  selectedGroupIds: readonly string[],
  primaryGroupId: string | null,
): { groupIds: string[]; primaryGroupId: string | null } {
  const groupIds = uniquePlayerGroupIds(selectedGroupIds)
  if (primaryGroupId && !groupIds.includes(primaryGroupId)) groupIds.push(primaryGroupId)
  return { groupIds, primaryGroupId: primaryGroupId || null }
}

export function removePlayerGroupSelection(
  selectedGroupIds: readonly string[],
  primaryGroupId: string | null,
  removedGroupId: string,
): { groupIds: string[]; primaryGroupId: string | null } {
  return {
    groupIds: uniquePlayerGroupIds(selectedGroupIds).filter((groupId) => groupId !== removedGroupId),
    primaryGroupId: primaryGroupId === removedGroupId ? null : primaryGroupId,
  }
}
