import { supabase } from '@/lib/supabase'
import {
  activePlayerGroupMemberships,
  activePlayerGroups,
  buildPlayerGroupAssignment,
  canonicalizePlayerGroupName,
  type PlayerGroupMembershipRecord,
  type PlayerGroupRecord,
} from '@/lib/canonical/player-groups'

export type SquadPlayerGroupsSnapshot = {
  canRead: boolean
  canManage: boolean
  groups: PlayerGroupRecord[]
  memberships: PlayerGroupMembershipRecord[]
}

const db = supabase as any

function mapGroup(row: any): PlayerGroupRecord {
  return {
    id: row.id,
    squadId: row.squad_id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order ?? 0,
    isDefault: Boolean(row.is_default),
    archivedAt: row.archived_at ?? null,
  }
}

function mapMembership(row: any): PlayerGroupMembershipRecord {
  return {
    squadId: row.squad_id,
    groupId: row.group_id,
    squadMemberId: row.squad_member_id,
    isPrimary: Boolean(row.is_primary),
    assignedAt: row.assigned_at,
  }
}

export async function getSquadPlayerGroupsSnapshot(squadId: string): Promise<SquadPlayerGroupsSnapshot> {
  const [readResult, manageResult] = await Promise.all([
    db.rpc('f_can_read_squad_player_groups', { _squad_id: squadId }),
    db.rpc('f_can_manage_squad_player_groups', { _squad_id: squadId }),
  ])
  if (readResult.error) throw readResult.error
  if (manageResult.error) throw manageResult.error

  const canRead = Boolean(readResult.data)
  const canManage = Boolean(manageResult.data)
  if (!canRead) return { canRead, canManage, groups: [], memberships: [] }

  const [groupsResult, membershipsResult] = await Promise.all([
    db
      .from('squad_player_groups')
      .select('id,squad_id,name,slug,sort_order,is_default,archived_at')
      .eq('squad_id', squadId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    db
      .from('squad_player_group_members')
      .select('squad_id,group_id,squad_member_id,is_primary,assigned_at')
      .eq('squad_id', squadId),
  ])
  if (groupsResult.error) throw groupsResult.error
  if (membershipsResult.error) throw membershipsResult.error

  const groups = activePlayerGroups((groupsResult.data ?? []).map(mapGroup))
  return {
    canRead,
    canManage,
    groups,
    memberships: activePlayerGroupMemberships(groups, (membershipsResult.data ?? []).map(mapMembership)),
  }
}

export async function createSquadPlayerGroup(squadId: string, name: string): Promise<PlayerGroupRecord> {
  const canonicalName = canonicalizePlayerGroupName(name)
  const { data, error } = await db.rpc('rpc_create_squad_player_group', {
    _squad_id: squadId,
    _name: canonicalName,
  })
  if (error) throw error
  return mapGroup(data)
}

export async function renameSquadPlayerGroup(groupId: string, name: string): Promise<PlayerGroupRecord> {
  const canonicalName = canonicalizePlayerGroupName(name)
  const { data, error } = await db.rpc('rpc_rename_squad_player_group', {
    _group_id: groupId,
    _name: canonicalName,
  })
  if (error) throw error
  return mapGroup(data)
}

export async function archiveSquadPlayerGroup(groupId: string): Promise<void> {
  const { error } = await db.rpc('rpc_archive_squad_player_group', { _group_id: groupId })
  if (error) throw error
}

export async function setSquadMemberPlayerGroups(
  squadMemberId: string,
  selectedGroupIds: readonly string[],
  primaryGroupId: string | null,
): Promise<void> {
  const assignment = buildPlayerGroupAssignment(selectedGroupIds, primaryGroupId)
  const { error } = await db.rpc('rpc_set_squad_member_player_groups', {
    _squad_member_id: squadMemberId,
    _group_ids: assignment.groupIds,
    _primary_group_id: assignment.primaryGroupId,
  })
  if (error) throw error
}
