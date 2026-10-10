# KickChasers components registry

Last verified: 2026-08-11

Source of truth: component imports from reachable routes plus implementations under `components/`. A file existing is not evidence of a live feature.

## Reusable application shell

- `components/navigation/SwipeableTabsNavigator.tsx` and `SwipeableTabsContainer.tsx`: six-page swipe/tab navigation.
- `components/top-profile-bar.tsx`: shared profile/notification header.
- `components/ui/SwipeDownModal.tsx`, `SelectionSheet.tsx`, and `ClubLogoRailSelector.tsx`: standard modal/picker surfaces.
- `components/common/BackButton.tsx`: stacked-route back control.
- `components/layout/useAdaptiveGridColumns.ts`: responsive grid sizing.
- `components/launch/LaunchScreen.tsx`, `AppUpdatePrompt.tsx`: launch and database-configured update prompt.
- `components/errors/CrashFallbackScreen.tsx`: root production error-boundary fallback.

## Tracking

- `components/tracker/StatPadSetupScreen.tsx`, `EditableStatPad.tsx`, `CustomStatEditor.tsx`, `StatGridEditor.tsx`: stat selection, ordering, mapping, modifiers, colours, and up to five scoped custom counters.
- `components/tracker/SinglePlayerIpadTracker.tsx`, `SinglePlayerIpadHeaderBanner.tsx`, `SinglePlayerQuarterSelector.tsx`: iPad single-player layout.
- `components/tracker/ActionButton.tsx`, `ActionGrid.tsx`, `ActionCategoryTabs.tsx`, `StatPad.tsx`, `QuarterTabs.tsx`, `BottomActions.tsx`, `TrackerHeader.tsx`, `EventFeed.tsx`, `ScoreSummaryCard.tsx`: reusable tracker controls. They remain tightly coupled to tracker data shapes.
- `components/team-tracker/PhoneTeamTracker.tsx`, `PlayerCarousel.tsx`, `StatActionPad.tsx`: phone team-tracker shell.
- `components/team-tracker/side-menu/*`: iPad team/player/game-log panel. Do not use outside the team tracker without separating its tracker-specific contracts.

## Field and live analysis

- `components/field/AFLField.tsx`: field canvas/composition.
- `components/field/MapRails.tsx`: quarter/stat filter controls.
- `components/field/FieldHeatMapLayer.tsx`: density rendering from located events.
- `components/field/ShotTrajectoryLayer.tsx`: goal/behind trajectory overlay.
- `components/team-stats-game/OvalInput.tsx`: map entry and review surface shared by tracker/summary.
- `components/team-stats-game/LiveInsightPanels.tsx`: live team-stat differential (“Momentum Indicator”) and key stats.
- `components/team-stats-game/ScoreWormCard.tsx`: score lead progression by quarter.
- `components/timeline/InfluenceTimeline.tsx`: event-derived player influence timeline; distinct from score worm and season momentum.

## Summaries and export

- `components/team-tracker/SummaryHeroHeader.tsx`, `SummaryStickyHeader.tsx`: team summary identity/header.
- `components/team-tracker/summary/*`: scope filters, player table, team bars, headline tiles, sections, and shared summary tokens.
- `components/team-tracker/summary/pdf/team-summary-pdf.ts`: HTML → Expo Print PDF → share/save. Includes selected custom-stat definitions.
- `components/summary/GameSummaryHero.tsx`: single/manual summary hero.
- `components/StatCard.tsx`: deterministic player stat display card. It has one visual implementation and no premium entitlement selector.

## Feed and shareable content

- `components/feed/FeedPostCard.tsx`: post dispatcher/container.
- `FeedSocialCard.tsx`, `TeamTrackedFeedSocialCard.tsx`, `ManualFeedSocialCard.tsx`, `PlayerStatCardPost.tsx`: typed recap cards and image export.
- `InstagramPosterView.tsx`, `InstagramPosterPreviewModal.tsx`: on-device poster rendering/capture.
- `LiveTrackersStrip.tsx`, `LiveTeamGamesRow.tsx`, `LiveTeamGameCard.tsx`: authenticated live-game discovery inside the feed.
- `RecommendationsRow.tsx`: follow recommendations.
- `cards/SeasonSnapshotCard.tsx` and `MomentumCard.tsx`: player season snapshot/rating trend. This “momentum” is a cross-game chart.

## Player/profile

- `components/profile/ProfileScreen.tsx`: own/other profile tabs for matches, stats, awards placeholder, and posts.
- `components/me/MeHeader.tsx`, `MeProfileTab.tsx`, `GameLogTab.tsx`: Me experience, stats, tracked/manual game log, and recap sharing.
- `components/benchmarks/*`: benchmark bars/chips/indicators used by summaries and profiles.

## Squads, clubs, and team selection

- `components/teams/TeamsTab.tsx`, `MySquadsTab.tsx`, `FollowingTab.tsx`, `TeamTile.tsx`, `SquadCard.tsx`: discovery/membership lists.
- `SquadSummaryHeader.tsx`, `MemberRow.tsx`, `SquadApprovalsSections.tsx`, `SquadSideChips.tsx`: squad detail and roster.
- `CreateSquadSheet.tsx`, `InviteMemberSheet.tsx`, `BulkMembersSheet.tsx`, `GuestMemberSheet.tsx`: squad mutation surfaces; callers and server RPC/RLS must both enforce permission.
- `StatePickerSheet.tsx`, `LeaguePickerSheet.tsx`, `GradePickerSheet.tsx`, `PositionPickerSheet.tsx`, `JerseyNumberPickerModal.tsx`, `ChangeLeagueSheet.tsx`: shared squad/directory selectors. Position consumers use the canonical `FWD`/`MID`/`RUC`/`DEF` options from `constants/positions.ts`; Profile editing uses the picker rather than free text.
- `TeamSelectionScreen.tsx` and `components/teams/team-selection/*`: lineup authoring, poster capture, sponsor logo, and team-selection activity cards.
- `StatsLeaderboard.tsx`, `TeamSeasonAverages.tsx`: squad statistics.

## Administration and safety

- `components/admin/ModerationPostCard.tsx`: platform moderation post review.
- `components/admin/PendingSquadRequestsSection.tsx`: platform official-squad request queue.

## Onboarding

- `components/onboarding/OnboardingWizard.tsx` and `steps/*`: welcome, personal details, club, photos, and role setup. Player-position selection shares the canonical four-position domain, including Ruck.

## Reference/obsolete boundaries

- `components/hello-wave.tsx`, `parallax-scroll-view.tsx`, `themed-text.tsx`, and `themed-view.tsx` are Expo-template-era utilities with no material current product role.
- `docs/web-summary-reference/Summary.tsx` and files under `design/` are references/specifications, not reusable runtime components.
- `components/StatCard.tsx` should not be described as a premium-card system; export cards are free deterministic templates.
- Avoid starting new flows from legacy design specs without checking the current component and route implementations.
