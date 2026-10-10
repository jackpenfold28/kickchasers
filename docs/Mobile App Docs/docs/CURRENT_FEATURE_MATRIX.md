# Current feature matrix

Last verified: 2026-07-23

Source of truth: reachable routes and their active components/hooks/repositories, current migrations, Edge Functions, and native/build configuration.

Status terms: `LIVE`, `PARTIAL`, `INTERNAL`, `INFRASTRUCTURE`, `PLANNED`, `LEGACY`, `UNKNOWN`.

| Product area | Feature | Status | Supported platforms | Main user type | Entry route | Core implementation files | Backend dependencies | Notes or limitations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | Email/password, recovery, Google/Apple OAuth | LIVE | iOS, Android; web callback | All | `/sign-in` | `app/sign-in.tsx`, `lib/auth.ts` | Supabase Auth | Provider console configuration is external |
| Onboarding | Personal, club, media, role setup | LIVE | iOS, Android | All | `/onboarding` | `OnboardingWizard`, `use-onboarding-draft` | `profiles`, directory, Storage | Required after sign-in until complete |
| Tracking | Single-player live tracker | LIVE | iOS, Android | Player, parent, tracker | `/tracker` | `app/tracker.tsx`, tracker components | `games`, `events`, teams | Can track self or accepted track-for subject |
| Tracking | Full-team player tracker | LIVE | iOS, Android | Team tracker | `/new-game/team-tracker/*` | team setup routes, common team game | games/squads/players/events RPCs | Direct network writes |
| Tracking | Track both teams on one device | LIVE | iOS, Android | Team tracker | team setup switch | `setup.tsx`, `game.tsx` | `game_squads`, `events` | Requires both squads/players |
| Tracking | Two-device linked team game | LIVE | iOS, Android | Two team trackers | link-code action | team tracker + repository | link RPCs, Realtime, linked-state RPCs | Creator controls timer/quarter; network required |
| Tracking | Team Stats Game without players | LIVE | iOS, Android | Coach/tracker | `/new-game/team-stats-game/setup` | team-stats routes, common tracker | tracker mode, playerless events | Excluded from public Match Day |
| Tracking | Scores and score mapping | LIVE | iOS, Android | Tracker/viewer | live trackers/summaries | `team-tracker-summary`, `score-worm` | `events` G/B/RB | Deterministic built-in mapping, not user-configurable |
| Tracking | Quarter timers and clock labels | LIVE | iOS, Android | Tracker | tracker | timer libraries, live screens | linked state columns/RPCs | Single/team local persistence differs |
| Tracking | Undo/event history | LIVE | iOS, Android | Tracker | tracker | `EventFeed`, team side-menu | event delete RLS | Synced single-player undo requires network |
| Tracking | Offline event queue | PARTIAL | iOS, Android | Single-player tracker | `/tracker` | `lib/offline.ts` | later sync to `events` | Single-player only; locked/final rows can remain stranded |
| Tracking | Stat modifiers | LIVE | iOS, Android | Tracker | stat-pad setup/live | tracker modifier logic | derived events | Built-in sequence rules |
| Tracking | Custom stat selection/order | LIVE | iOS, Android | Tracker | stat-pad setup | `StatPadSetupScreen`, layout hook | definitions/preferences | Single-player, full/linked team, and Team Stats Game paths |
| Tracking | Custom stat creation | LIVE | iOS, Android | Player/squad manager | stat-pad editor | `CustomStatEditor`, definitions repo | custom-stat RPC/RLS | Counter-only; max five per scope |
| Tracking | Location mapping | LIVE | iOS, Android | Tracker | live oval | `OvalInput`, field components | event x/y/source | Selected stats can require placement |
| Tracking | Voice recognition | INFRASTRUCTURE | None | Tracker | None | no runtime files | entitlement enum only | Not implemented |
| Analysis | Player stat mapping | LIVE | iOS, Android | Tracker/player | team setup/summary | game player snapshots, aggregation | `game_players`, `events` | Guest/linked identity fallbacks are complex |
| Analysis | Heat map | LIVE | iOS, Android | Player/coach | summaries | `FieldHeatMapLayer`, `OvalInput` | located events | Requires mapped events |
| Analysis | Shot trajectory | LIVE | iOS, Android | Player/coach | summaries | `ShotTrajectoryLayer` | goal/behind located events | Deterministic visual |
| Analysis | Player influence timeline | LIVE | iOS, Android | Player | single summary | `InfluenceTimeline` | timed events | Not the same as team momentum |
| Analysis | Live team momentum indicator | LIVE | iOS, Android | Coach/tracker | team tracker | `LiveInsightPanels` | current totals | Stat differential, not predictive AI |
| Analysis | Score worm | LIVE | iOS, Android | Coach/supporter | team tracker/summary | `ScoreWormCard`, `score-worm.ts` | scoring events + clock | Separate from influence/momentum |
| Analysis | Season momentum chart | LIVE | iOS, Android | Player | feed/profile | `MomentumCard` | per-game ratings | Cross-game rating trend |
| Player | Tracked and manual game log | LIVE | iOS, Android | Player | `/me?tab=log` | `GameLogTab`, manual routes | events/manual totals | Manual stats do not include arbitrary custom counters |
| Player | Season totals/averages | LIVE | iOS, Android | Player | `/me`, `/users/[id]` | `ProfileScreen`, `MeProfileTab` | totals views + client compute | Authenticated profiles only |
| Player | Career stats | LIVE | iOS, Android | Player | profile All Stats | `ProfileScreen` | loaded tracked/manual games | Career means all loaded eligible games |
| Player | Last-three and benchmarks | LIVE | iOS, Android | Player | profile/summary | benchmark components/evaluation | benchmarks + game context | Impact 7 is deterministic |
| Player | Player comparisons | PARTIAL | iOS, Android | Player | leaderboards/profile | leaderboards, benchmark cards | official views | No direct head-to-head comparison builder |
| Player | Shareable stat cards | LIVE | iOS, Android | Player | finalise/game log/feed | feed cards, captureRef | post/image data | On-device deterministic templates |
| Player | Premium card variants | PLANNED | None | Player | None | no selector/paywall | commerce tables only | Multi-card team export is not a premium tier |
| Player | Profile awards history | PARTIAL | iOS, Android placeholder | Player | profile Awards tab | `ProfileScreen` placeholder | squad voting data not connected | Squad voting is live; the profile tab is not |
| Player | Milestones/achievements | PLANNED | None | Player | None | no achievement implementation found | none | Impact 7 “milestone” bonuses are rating rules, not achievements |
| Community | User/player following | LIVE | iOS, Android | Player/supporter | feed/friends/profile | follows repositories | `follows` | Follow notification generated |
| Community | Club and league following | LIVE | iOS, Android | Supporter | Teams/Match Day | team/match-day repositories | follow tables | Home league can auto-follow |
| Community | Match Day discovery | LIVE | iOS, Android | Supporter | `/match-day` | `useMatchDay` | official games/squads/events | Signed-in; followed leagues; 25-second polling |
| Community | Live match summary | LIVE | iOS, Android | Supporter/coach | Match Day card | team summary | authenticated match reads | 10-second polling until final |
| Community | Anonymous live-game viewing | PLANNED | None | Supporter | None | share route is auth-gated | broad auth reads only | Public vote card is unrelated |
| Community | Feed posts | LIVE | iOS, Android | All | `/feed` | feed route/cards/repository | typed `posts`, feed view | Recap/team-selection oriented |
| Community | Likes/comments | LIVE | iOS, Android | All | feed | `useFeed`, repository | likes/comments + triggers | Comment editing/moderation included |
| Community | Blocking/reporting | LIVE | iOS, Android | All | feed/settings | moderation repository | blocks/reports RLS | Platform review available |
| Content | Single/manual/team recap generation | LIVE | iOS, Android | Player/tracker | finalise/summary | tracker, game log, team repository | typed posts/RPCs | Template/data-driven, not AI |
| Content | Instagram-style poster/image export | LIVE | iOS, Android | Player/team | feed/team selection | poster views, view-shot | local media permission | Device layout QA not automated |
| Content | Team selection poster and post | LIVE | iOS, Android | Team admin/member | `/teams/[id]/team-selection` | TeamSelection components | team-selection RPC/posts | Sends team-selection notification |
| Content | Team-summary PDF | LIVE | iOS, Android | Coach/tracker | team summary | `team-summary-pdf.ts` | current summary data | Expo Print/Sharing; no automated device matrix |
| Content | Player/quarter PDF reports | PLANNED | None | Player/coach | None | none | none | Team PDF is the only PDF exporter |
| Content | AI match reports/captions | PLANNED | None | Tracker/marketing | None | none | none | No model integration |
| Squad | Custom squad creation/multi-squad membership | LIVE | iOS, Android | Team admin/player | Teams | squad routes/components | squads/members/RPCs | Users can belong to multiple squads |
| Squad | Official squad/directory | LIVE | iOS, Android | Club/admin/supporter | Teams/requests | repositories/admin screens | clubs/leagues/requests | One official squad per club constraint |
| Squad | Invites/join requests/approvals | LIVE | iOS, Android | Admin/player | squad detail/approvals | membership/admin repos | request RPCs/triggers | Role-dependent |
| Squad | Guest players and profile merging | LIVE | iOS, Android | Tracker/admin/player | squad detail/guest users | guest repositories | merge tables/RPCs | Admin approval paths |
| Squad | Player sides/groups | LIVE | iOS, Android | Coach/admin | squad detail | player-group repo/chips | player-group tables/RPCs | Default age groups plus custom rename/archive |
| Squad | Team colours/branding | LIVE | iOS, Android | Admin/tracker | squad detail/colours | media/colour helpers | squad columns, Storage | Club colours can drive stat pad |
| Squad | Team season averages/stats | LIVE | iOS, Android | Coach/player | squad detail/preview | `TeamSeasonAverages`, leaderboard | squad event RPC/views | Official counting rules apply |
| Squad | Team leaderboards | LIVE | iOS, Android | Coach/supporter | squad/detail + global Leaders | leaderboard components/routes | official views | Client filters; no ladder/fixture system |
| Squad | Multi-team club management | PLANNED | None | Club admin | None | none | schema constrains one official squad/club | User multi-squad is not club hierarchy |
| Awards | Best & Fairest/squad votes | LIVE | iOS, Android | Coach/admin | `/teams/[id]/votes` | vote routes/hooks/repository | `squad_vote_*`, RPCs | Full workflow; separate from profile Awards |
| Awards | External/public vote card | LIVE | iOS, Android, web route | External voter | `/vote-card/[token]` | public vote route | token RPCs | Only explicitly unauthenticated product flow |
| Administration | Platform admin console | LIVE | iOS, Android | Platform admin | `/admin` | admin route/repositories | admin RPCs/tables | Large mobile console |
| Administration | Official requests and squad archiving | LIVE | iOS, Android | Platform admin | `/admin` | admin repositories | request/archive RPCs | Directory and official squad queues |
| Administration | Moderation feed | LIVE | iOS, Android | Platform admin | `/admin` | moderation card/repository | reports + moderation RPC | Hide/unhide, review/action state |
| Administration | Manual feed publishing | LIVE | iOS, Android | Platform admin | `/admin/manual-feed-post` | admin post route | manual totals/posts | Internal/admin-only |
| Platform | Account deletion | LIVE | iOS, Android | Account owner | `/settings` | settings + delete Edge Function | `f_delete_account_data`, Auth admin | Storage cleanup best-effort/capped |
| Platform | Push notifications | PARTIAL | iOS, Android | All | global | push hooks/function/routing | tokens, notifications, `pg_net` | Credentials/deployment/device delivery unverified |
| Platform | Subscription/paywall | INFRASTRUCTURE | None | Business | None | no client flow | commerce/entitlement tables | Product is free |
| Platform | Product analytics | PLANNED | None | Product owner | None | no analytics SDK | admin aggregate RPCs only | Sentry is error telemetry |
| Platform | App update settings | LIVE | iOS, Android | All | global prompt | `AppUpdatePrompt` | `app_settings` | Store URLs seeded blank in migration |
| Platform | iOS production support | PARTIAL | iOS/iPad | All | native app | `ios/`, `app.json`, EAS | external credentials | Strong config; store/device state external |
| Platform | Android production support | PARTIAL | Android | All | managed app | `app.json`, EAS | external credentials | No checked-in native project; store/push QA unverified |
| Platform | Universal/App Links | PARTIAL | iOS, Android | Shared-link recipient | shared game/auth | `app.json`, `game-share.ts` | remote association files | Remote domain files unavailable |
| Platform | Sentry crash telemetry | LIVE | iOS, Android production | Developers | global | `lib/sentry.ts`, root boundary | Sentry DSN | Disabled without DSN; no product events |
| Quality | Automated tests/CI | PLANNED | N/A | Developers | None | none | none | No first-party tests or CI workflow |

## Open verification items

- Production database/Edge Function parity.
- Current store releases, APNs/FCM credentials, and remote link association files.
- Physical-device reliability for Android, push, Realtime, orientation, image capture, and PDF export.
