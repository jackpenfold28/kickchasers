Last updated: 2026-02-15

Last updated: 2026-03-24

# Components Registry

## Primitives & Layout
- `components/themed-view.tsx`, `components/themed-text.tsx` – Theme-aware wrappers with light/dark overrides. Use for screen backgrounds and headings.
- `components/ui/SwipeDownModal.tsx` – Bottom-sheet style modal with swipe-to-dismiss; used across teams/admin flows.
- `components/ui/collapsible.tsx` – Expand/collapse block with animated chevron.
- `components/ui/icon-symbol.tsx`, `components/ui/icon-symbol.ios.tsx` – Icon wrapper for consistent symbol usage.
- `components/common/BackButton.tsx` – Back navigation button used on stacked screens.
- `components/layout/useAdaptiveGridColumns.ts` – Grid column helper for responsive layouts.
- `components/external-link.tsx` – External link wrapper.

## Navigation
- `components/navigation/SwipeableTabsContainer.tsx` & `SwipeableTabsNavigator.tsx` – Pager-powered tab scaffolding for `(tabs)` screens.
- `components/haptic-tab.tsx` – Tab bar button with haptic press; reuse for any custom tab button.
- `components/top-profile-bar.tsx` – Header with profile chip + notifications bell (realtime subscription + badge). Ensure props include `profile` and loading state to avoid null crashes.

## Feed & Hub
- Feed shell: `components/feed/FeedHero.tsx`, `components/feed/LiveTrackersStrip.tsx`, `components/feed/LiveTeamGamesRow.tsx`, `components/feed/LiveTeamGameCard.tsx`, `components/feed/HomeStatsCard.tsx`.
- Feed cards: `components/feed/FeedSocialCard.tsx`, `components/feed/TeamTrackedFeedSocialCard.tsx`, `components/feed/cards/MomentumCard.tsx`, `components/feed/cards/SeasonSnapshotCard.tsx`.
- Social helpers: `components/feed/ManualFeedSocialCard.tsx`, `components/feed/InstagramPosterView.tsx`, `components/feed/InstagramPosterPreviewModal.tsx`, `components/feed/RecommendationsRow.tsx`, `components/feed/manual/manual-post-adapter.ts`.
- `components/feed/PlayerStatCardPost.tsx` – Builds per-post stat cards from `posts`/`games`/`game_players`/`events`; requires `postId`, `gameId`, `teamSide`, `playerNumber`.
- Hub cards: `components/hub/*` (`hero-card`, `game-card`, `quick-actions-row`, `stats-snapshot-card`, `team-avatar`). `game-card` handles start/resume/summary CTA state; pass booleans for deleting/actioning to avoid mixed loading UI.

## Match Day
- `components/match-day/LiveLeagueGameCard.tsx` – Live league fixture card with score, quarter, and logo tinting.

## Teams & Roster
- `components/teams/SquadSummaryHeader.tsx` – Squad hero (cover, avatar, grade tags, actions). Actions typed as `SquadSummaryAction[]`; respect permission gating before rendering destructive CTAs.
- `components/teams/TeamTile.tsx`, `components/teams/SquadCard.tsx`, `components/teams/OfficialSquadBadge.tsx` – Grid and list tiles for squads.
- Sheets/pickers: `CreateSquadSheet`, `InviteMemberSheet`, `BulkMembersSheet`, `GuestMemberSheet`, `ChangeLeagueSheet`, `LeaguePickerSheet`, `StatePickerSheet`, `GradePickerSheet`, `PositionPickerSheet`, `JerseyNumberPickerModal`.
- Lists: `TeamsTab`, `MySquadsTab`, `FollowingTab`, `MemberRow`, `TeamsHeader`.
- Team selection: `TeamSelectionScreen`, `components/teams/team-selection/LineupSlotTile.tsx`, `RosterPickerSheet.tsx`, `TeamSelectionPosterView.tsx`.
- League/team analytics: `AdminLeaguesTab`, `StatsLeaderboard`, `TeamSeasonAverages`.
- Role-aware behavior: roster sheets rely on caller to check `canManage` (owner/admin) before passing mutation callbacks; official squad management requires server-side checks (`f_can_manage_official_squad_members`).

## Tracker & Summary
- Tracker controls: `tracker/ActionButton`, `ActionGrid`, `ActionCategoryTabs`, `PlayersGrid`, `QuarterTabs`, `BottomActions`, `ActionLogStatus`, `StatPad`, `ScoreSummaryCard`, `TrackerHeader`, `EventFeed` – Compose the live tracker UI. Provide palette + callbacks; avoid reuse outside tracker due to tight store coupling.
- Tracker shells: `components/team-tracker/PhoneTeamTracker.tsx`, `components/team-tracker/PlayerCarousel.tsx`, `components/team-tracker/StatActionPad.tsx`.
- Side menu: `team-tracker/side-menu/*` – Animated right-panel with tabs for team stats, player stats, and game log. Pass visibility + content datasets; avoid reuse outside tracker.
- Summary (recap): `team-tracker/summary/*`, `components/team-tracker/SummaryHeroHeader.tsx`, `components/team-tracker/SummaryStickyHeader.tsx` – Sticky header, segmented tabs, filter pills, player table, key stat tiles/bars. Designed for recap screens only; keep theme tokens from `summary/theme.ts`.
- `components/summary/GameSummaryHero.tsx` – Summary hero used in recap screens and profile stats.
- `components/StatCard.tsx` – Shareable stat card generator; accepts player/team/game metadata and stat payloads.

## Profile & Me
- `components/me/MeHeader.tsx` – Header for Me tab with avatar, settings, and add actions.
- `components/me/GameLogTab.tsx` – Game history list with track-request context (accepted/assigned); feeds profile stats and recap links.
- `components/me/MeProfileTab.tsx` – Profile summary + stats panels; embeds `GameSummaryHero`.
- `components/profile/ProfileScreen.tsx` – Editable profile screen content used under `/me`.

## Benchmarks
- `components/benchmarks/BenchmarkBar.tsx`, `BenchmarkChip.tsx`, `BenchmarkIndicator.tsx` – Used for stat benchmark UI and summary chips.

## Manual Stats
- `components/manual-stats/ManualStatsFields.tsx` – Manual stat input fields used in admin/manual summary creation.
- `components/LogoPickerField.tsx` – Club/opponent logo picker with upload helpers.

## Do Not Reuse / Legacy
- `docs/web-summary-reference/Summary.tsx` is a web-only reference export; avoid using it in mobile flows.
