# Player Card Production Workflow — Stage 2F

Status: implemented on `feature/player-card-production-workflow`

## Scope

Stage 2F exposes the existing White Editorial Player Card workflow from production completed-game surfaces. It does not publish Player Cards to the feed, change the database, or alter Team Summary generation/posting.

## Shared workflow

All production entry points navigate to `/player-card/create` with a stable completed-game identity:

```text
Production entry point
  -> completed game identity
  -> completed-game option resolver
  -> PlayerCardProductionWorkflowService
  -> PlayerCardGenerationService
  -> PlayerPerformanceCardBuilder
  -> PlayerPerformanceCardModel
  -> White Editorial renderer
  -> local 1080 x 1350 PNG
```

The workflow never passes a raw database row to the renderer. Team Tracker and Single Player Tracker options are hydrated through the existing Stage 2D source adapter and canonical model builder. Production entry points resolve the exact requested game ID rather than searching a paginated recent-feed list. If a completed game was not published, a read-only in-memory feed source is hydrated for the builder; no post is created and no database write occurs.

## Entry points

### Single Player Tracker summary

A completed player summary displays `Create Player Card`. The route carries the game ID and the strongest available player identity: profile ID first, then player number and team side.

### Game Log

Eligible completed, event-backed games in the signed-in player's Game Log display a Player Card action. Manual games and incomplete games remain excluded from Stage 2F.

### Team Tracker

The Team Tracker summary remains unchanged. A user selects a player through the existing player table, which opens that player's existing game summary. The shared `Create Player Card` action then generates a card for that player only.

## Returning-player path

Before asking for a photo, the production workflow checks the existing local approved Player Image repository:

- Found: hydrate the model, apply the saved transparent PNG and placement, then render immediately.
- Missing, with an action photo: download the hydrated profile action photo into temporary local storage and continue automatically through the existing on-device Vision workflow.
- Missing, without an action photo: show Camera and Photo Library actions and continue through the existing on-device Vision workflow.
- `Change Player Image`: explicitly returns to photo selection without changing stored data.

The repository remains device-local. Stage 2F adds no database persistence or cloud sync. The existing Player Image naming prototype remains non-persistent.

## Editing

The finished card appears before editing. `Edit Player` reuses the established positioning canvas for move, scale and rotation. Newly generated images can open the established non-destructive Keep/Remove editor and can be replaced/cropped. A saved legacy local image without an editor draft safely falls back to selecting a replacement photo for detailed cleanup.

## Team Summary regression boundary

No Team Tracker summary, Team Summary renderer, post creation function, feed component, database migration, or Supabase write path is changed. In particular, `finalizeTrackedGame` and `createTeamGamePost` retain their prior call sites and behaviour.

## Known limitations before Stage 2G

- Player Images remain local-only and are not synced between devices.
- The naming screen remains a prototype and does not persist a new Player Image.
- Android remains outside the Apple Vision cutout scope.
- Player Cards are shared as local PNGs only; no Player Card post is created.

## Physical-device checklist

1. Finish a Single Player Tracker game and open `Create Player Card` from its summary.
2. Generate from Camera and Photo Library, confirm automatic cutout and 1080 x 1350 preview.
3. Use Edit Player, positioning, crop/replacement, Keep and Remove; confirm immediate regeneration.
4. Open an eligible Game Log row through its Player Card action.
5. Open a completed Team Tracker summary, select a player, and create that player's card.
6. Confirm Team Summary Save/Post and the existing feed result remain unchanged.
7. Confirm an existing local approved Player Image skips photo selection.
8. Confirm Change Player Image starts photo selection.
9. Confirm Done/Share and the non-persistent naming prototype.
