# Automatic Player Card Generation — Stage 2E

Last verified: 2026-08-02

## Scope and outcome

Stage 2E proves an on-device, developer-only automatic generation path for completed Team Tracker player games. It does not publish posts, write to Supabase, alter the feed, change the White Editorial template, or change the existing export flow.

```text
Completed Team Tracker player game
  → Stage 2D production hydration
  → PlayerPerformanceCardModel
  → approved local player cutout lookup
  → White Editorial template scene
  → hidden generic renderer
  → exact 1080 × 1350 PNG in local cache
  → Admin developer preview
```

## Architecture

`PlayerCardGenerationService` is the reusable orchestration boundary. Its dependencies are injected so hydration, cutout lookup and output persistence can be tested independently. The service knows nothing about screens, feeds, posts, sharing or Supabase.

The service has two phases:

1. `prepare(option)` validates that the input is a completed Team Tracker player game, delegates to the Stage 2D hydrator, resolves the canonical player ID, finds an approved local cutout, validates the resulting model and builds the approved White Editorial scene.
2. `complete(request, temporaryUri)` persists the rendered bitmap, verifies exact Instagram dimensions and returns structured generation metadata.

React Native view capture necessarily requires a mounted view. `PlayerCardGenerationRenderer` owns only that platform boundary: it renders the existing generic `PerformanceCardRenderer` off-screen, waits for required assets, captures the view and returns a temporary URI. The Admin screen orchestrates state and displays results; it contains no card-rendering rules.

## Approved cutout association

The Stage 2A cache predates production player IDs, so its records cannot safely prove which player a cached cutout belongs to. Stage 2E therefore never silently assigns the latest cached image to a player.

`ApprovedPlayerCutoutRepository` maintains a small cache-only player-ID-to-cutout association. A platform admin must explicitly choose either:

- the latest saved Player Cutout Lab result; or
- a replacement PNG from the photo library.

The selected file is copied into the Stage 2E local cache and associated with the canonical hydrated player ID. This is device-local metadata only. It is not uploaded and is not a database write. A missing association produces the normal `cutout_required` status rather than an exception or broken card.

## Input and status contract

Stage 2E currently accepts only expanded Team Tracker player-game options whose existing `games.status` is `final` or `completed`.

Preparation returns one of:

- `cutout_required`: includes player ID, game ID, display name and hydrated model so the UI can resolve the missing local prerequisite.
- `ready_to_render`: includes an immutable render request containing generation ID, template/version, canonical model, transform and player/game/cutout identifiers.

This discriminated result leaves room for Single Player Tracker, manual games and imported games without changing the renderer.

## Render output

The generated result contains:

- local image URI;
- exact `1080 × 1350` dimensions;
- PNG file size;
- end-to-end generation time;
- template ID and version;
- player ID, game ID and cutout ID;
- generation ID and creation date.

The capture uses the existing density-aware logical canvas. `GenerationOutputRepository` normalises any device-density variance to 1080 × 1350 PNG, validates the result, then retains at most ten generated previews in the local cache.

## Optional assets and errors

The existing White Editorial scene controls asset optionality. Missing opponent and club logos settle as optional render layers and do not block generation. The approved cutout is required. Missing optional statistics and metadata continue to use the Stage 2D model and approved template fallbacks.

Meaningful failures are preserved for unsupported/incomplete games, failed hydration, unreadable cutouts, required player-layer load failure, capture failure and invalid output dimensions.

## Developer tool and access

`Admin → Developer Tools → Player Card Generator` is guarded by both `__DEV__` and the existing platform-admin check. It can:

1. select a completed Team Tracker player game;
2. generate automatically;
3. resolve `Cutout Required` explicitly;
4. preview the local PNG;
5. regenerate or replace the approved cutout;
6. inspect timing and generation identifiers.

There is deliberately no publish, share, feed, post or database action.

## Performance strategy

- Hydration and read-only game-status lookup reuse the existing production repositories.
- The template scene is built before mounting so contract failures happen early.
- Images settle once, then the renderer performs one capture.
- PNG resizing/encoding happens once per generation, never during interaction.
- Generated previews and approved cutouts live in bounded/local cache storage.
- `generationTimeMs` measures the full prepare-to-persist path against the under-two-second device target.

Actual device timing depends on remote logo availability, source cutout size and iPhone model and must be recorded during physical-device validation.

## Extension points

- Add a new completed-game repository adapter and reuse the same `prepare`/`complete` boundary for Single Player Tracker or manual games.
- Accept a template ID when alternate approved templates exist; no screen-specific renderer change is required.
- Replace the cache-only approved-cutout repository with a production asset source later while retaining `findApprovedCutout(playerId)` semantics.
- A future publishing service should consume the generated asset separately. Publishing must never be added to this generation service.

## Physical-device checklist

- Generate from several completed Team Tracker games across different clubs and squad colours.
- Confirm missing approved cutout shows `Cutout Required` without a crash.
- Approve the latest lab result and confirm it is reused only for that player.
- Replace the cutout and regenerate.
- Confirm missing club/opponent logos do not block output.
- Confirm the preview is sharp, correctly oriented and exactly 1080 × 1350.
- Confirm reported generation time is under two seconds on the target device where network assets are already cached.
- Confirm no post appears in the feed and no Supabase mutation occurs.

