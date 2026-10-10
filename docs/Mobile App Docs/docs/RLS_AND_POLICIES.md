# RLS and policies

Last verified: 2026-07-23

Source of truth: ordered policies, grants, functions, and replacements under `supabase/migrations/`. This is a static reconciliation, not a remote `pg_policies` dump.

## Access summary

| Area | Read | Write |
| --- | --- | --- |
| Full `profiles` | Self | Self; service/RPC for lifecycle |
| `profiles_directory` | Authenticated | View only |
| Games/events/game players/game squads | Broad authenticated read remains | Creator/link participant subject to game, side, lock, and track-request rules |
| Squads | Broad authenticated squad row read | Owner/admin/club-role/platform rules |
| Squad members | Self/inviter plus roster visibility helpers | Owner/admin/official club role/RPC rules |
| Posts | Authenticated visibility/follow/block/hidden rules | Author; platform admin hide/unhide |
| Likes/comments | Authenticated subject to block/content access | Acting user/author; post author can moderate comments |
| Notifications | Recipient only | Security-definer triggers/RPCs or service role |
| Directory/catalog | Mostly authenticated; grade catalog also anon | Platform admin/request workflows |
| Vote cards | Managers/card assignees; public token through RPC | Guarded RPCs |
| Reports/blocks | Actor or platform admin | Actor; review by platform admin |
| Push dedupe/internal settings | Service only/no client access | Service/definer only |
| Storage media | Anonymous public object read | Authenticated owner/prefix policies |

## Important policy facts

### Broad authenticated match data

The January baseline creates `read_games_any_authenticated`, `read_events_any_authenticated`, `read_game_players_any_authenticated`, and `read_game_squads_any_authenticated`, each allowing any signed-in user. Later migrations tighten writes but do not drop these read policies. `squads_read_for_authenticated` also remains.

Consequences:

- normal UI discovery is narrower than database readability;
- “private game” should not be claimed for any authenticated tenant user;
- link/share flags do not create a strong confidentiality boundary;
- anonymous users still cannot query these tables through normal RLS.

This is the highest-priority documented privacy risk.

### Profiles

April migrations removed authenticated read of raw profiles. Users read/update/insert only their own full row. `profiles_directory` intentionally exposes a limited authenticated projection including calculated age, player metadata, club/league, and media.

### Notifications and push

Direct authenticated insert was revoked. Recipient-only reads/updates remain; list/count/mark-read functions reject `_uid != auth.uid()`. `app_internal_settings` has a no-access policy, and push dedupe rows are service-role only.

### Squads and roles

Custom squads use owner/accepted squad-role checks. Official squads use owner, platform admin, and club-role helpers. Sensitive operations use guarded security-definer RPCs. Join/admin/guest-merge request decisions verify appropriate authority.

### Events and linked games

Writes require creator or claimed linked actor, accepted/pending track request where applicable, expected tracked profile identity, unlocked/live linked state, and the actor’s assigned side. The creator owns shared timer/quarter control. Team Stats Games permit playerless events.

### Posts, follows, and moderation

Feed visibility accounts for self/follow graph and hidden state. Blocking removes follows and prevents interaction policies. Reporters can insert/read their own reports; platform admins can review/update. Platform admins hide rather than hard-delete posts.

### Awards/public vote cards

Managers use authenticated vote RPCs. Anonymous/public access is token-scoped through `rpc_get_public_squad_vote_card_context` and `rpc_submit_public_squad_vote_card`; raw vote tables are not made generally anonymous.

### Storage

Buckets are public-read. Active upload paths are user-prefixed; team-logo policies include several historical overlapping rules. Public object URLs can outlive feed/profile visibility unless deletion succeeds.

## Security-definer guidance

Security-definer helpers are necessary for notification triggers, public vote tokens, role decisions, account deletion, and cross-table statistics. Current migrations usually:

- pin `search_path`;
- derive or compare `auth.uid()`;
- revoke `public`/`anon` execution before targeted grants.

Do not assume that pattern is universal. Audit new or replaced definer functions for caller binding, object ownership, token entropy, row scope, and grants.

## Known risks and inconsistencies

- Broad authenticated match/squad reads exceed UI expectations.
- `profiles_directory` is an owner-controlled projection; its exposed age/profile fields should be an explicit product privacy choice.
- All active media buckets are public-read.
- Multiple historical storage policies overlap and a policy references `item-logos` without creating the bucket.
- Schema snapshots/types cannot be used to validate final policies.
- Realtime may require table publication and replica identity configuration not conclusively represented for `games`/`events`.
- No automated RLS regression suite exists.

## Required verification queries

Run against the migrated target before a security-sensitive release:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select n.nspname, p.proname, p.prosecdef, p.proconfig, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;

select * from pg_publication_tables where pubname = 'supabase_realtime';
```

## Open verification items

- Exact remote policy/grant state after all historical deployments.
- Whether broad authenticated match reads are intentional product policy.
- Production Realtime publication and replica identity for linked games.
- Storage objects left behind by past account/post deletion paths.
