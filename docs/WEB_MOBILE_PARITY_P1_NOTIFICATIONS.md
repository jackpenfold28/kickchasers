# Web ↔ Mobile Parity — P1 Notifications

Date: 2026-08-18  
Scope: P1-14 Notifications, plus the directly coupled P2-05 canonical repository contract  
Database changes: none

## Outcome

P1-14 is remediated within the existing web route surface. Web notification listing, unread count and mark-read now use `f_notifications_list`, `f_notifications_unread_count` and `f_notifications_mark_read`. A single authenticated provider owns list/count state for the notification page, expanded/collapsed sidebar and mobile-sized web navigation. It also owns one recipient-filtered Realtime channel and focus/visibility refetch.

Estimated parity moves from **72/100 to 75/100**. Browser app-icon badges remain intentionally out of scope; web parity is the in-app badge and unread list state.

## Re-verification before remediation

| Concern | Web before | Mobile/current authority | Resolved web behaviour |
|---|---|---|---|
| List | Direct `notifications` table select, fixed 100-row page | Recipient-scoped list contract with cursor | `f_notifications_list`, 50-row cursor pages |
| Unread | Counted only unread rows in the loaded page | Dedicated canonical unread count | `f_notifications_unread_count`; unknown is never shown as zero |
| Mark read | Direct table update | Canonical mark-read function | Optimistic shared update through `f_notifications_mark_read`, rollback on failure |
| State ownership | Page-local list and Realtime; no sidebar badge | Shared query state and invalidation | One provider shared by layout, desktop sidebar, mobile web nav and page |
| Refresh | Realtime existed only while `/notifications` was mounted | Recipient Realtime plus lifecycle refresh | Layout-lifetime recipient channel, debounced invalidation, reconnect fallback, focus/visibility refresh |
| Routing | Missing follower/team-selection/admin routes; social dead ends; unknown became invite | Pure type resolver covering current type set | Exhaustive pure web adapter with supported/fallback/unsupported result |
| Failure state | Error could appear with “caught up” empty copy | Loading/error/empty are distinct | First-load error cannot render the empty state; unread failures remain unknown |

Mobile marks visible non-actionable items read while retaining actions for `squad_invite` and `track_request`. The web page now matches that behaviour, while clicking a row also marks it read before navigation. List and unread state update together without a full reload.

## Destination matrix

| Notification intent | Web destination | Status |
|---|---|---|
| Squad invite/decision, admin promotion, squad role, join decision, guest merge | `/teams/:squadId` | Supported |
| Join request created | `/teams/:squadId?tab=manage&focus=pending-requests` | Supported |
| Club role | `/settings/roles` | Supported |
| Official request created | `/admin/requests` | Supported |
| Official directory decision | `/settings` | Supported |
| Track request/decision and normal live game | `/games/:gameId` | Supported |
| User followed | `/users/:userId` | Supported |
| Social activity tied to manual/tracked game | Exact manual/tracked summary | Supported |
| Team selection posted | Team activity | Safe parent fallback; dedicated selection detail is deferred with P1-09 |
| Team Stats Game live | Canonical game summary | Safe capability fallback; web has no coach-only surface |
| Vote card | Team detail | Safe parent fallback; no authenticated web vote-card route exists |
| Feed-only social item, malformed, stale or unknown item | Remain on Notifications with a non-destructive message | Unsupported/safe fallback |

The adapter never fabricates `/feed`, an authenticated vote route, or a public token URL. IDs are encoded before entering React Router. Unsupported/fallback outcomes emit developer-visible warnings in development.

## Lifecycle and security

- Provider creation requires the authenticated layout identity.
- Realtime uses `recipient_id=eq.<user id>`, cleans up on unmount/logout and is not recreated by notification state changes.
- Insert/update/delete events debounce a canonical list/count refresh.
- channel errors/timeouts/closure schedule lifecycle refresh with bounded backoff; focus and visible-tab transitions also refresh.
- No raw `notifications` table read/update remains in the web repository.
- No migration, schema, RLS or RPC definition was added or changed.

## Tests and validation

`tests/notifications-parity-contracts.test.ts` contains 34 focused cases: ordering, pagination/deduplication, unread/read representation, optimistic count state, mobile visible-read semantics, every current notification type, Team Stats fallback, social/malformed/unknown safety, RPC wiring, shared badge state and Realtime cleanup.

Validation commands:

```text
npm test
npm run typecheck
npm run build
```

## Remaining intentional gaps

- P1-09 Team Selection remains **DEFERRED / PRODUCT CONSTRAINT**. Its notification routes to team activity, not a fabricated selection screen.
- Web has no authenticated vote-card UI, feed/post detail UI or coach-only Team Stats Game summary. Notifications use explicit safe fallbacks and remain test-covered.
- Native iOS/Android app-icon badges are mobile-only. No browser badge API was introduced.
