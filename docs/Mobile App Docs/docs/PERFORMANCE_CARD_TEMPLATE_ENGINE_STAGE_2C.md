# Stage 2C — Performance Card Template Engine and White Editorial

## Scope

Stage 2C adds a local, developer-only performance-card workflow after the Player Cutout Lab. It does not touch feed cards, production player cards, Supabase, subscriptions, Android, public navigation, or production data queries.

The approved visual reference is documented in `docs/design-reference/WHITE_EDITORIAL_PERFORMANCE_CARD_REFERENCE.md`.

## Workflow

```text
Photo → canonical crop → Vision subjects → selected cutout → optional cleanup
      → local performance-card session → player positioning → final preview
      → 1080 × 1350 PNG → local cache / Photos
```

The Player Cutout Lab creates a local session using the best available cutout in this order: saved edited cutout, Vision result, cached cutout. The card screens independently repeat the existing `__DEV__` and platform-admin access checks.

## Architecture

```text
Future PlayerPerformanceCardBuilder       Stage 2C mock builder
                    \                     /
                 PlayerPerformanceCardModel
                              ↓
                PerformanceCardTemplateRegistry
                              ↓
                  PerformanceCardTemplate
                              ↓
                    PerformanceCardScene
                              ↓
                 PerformanceCardRenderer
                    ↙                 ↘
          Live positioning         PNG export surface
```

The renderer has no White Editorial, player-stat, club, database, or Supabase branches. It understands generic layer types only: shape, path, line, text, image, icon, and player. Templates own composition and turn a model into a versioned scene.

Future templates register another `PerformanceCardTemplate` with their own canvas, safe areas, scene builder, default player transform, assets and version. They do not fork the renderer.

## PlayerPerformanceCardModel

`PlayerPerformanceCardModel` is the production boundary for Stage 2D. It includes:

- player identity, position, jersey number and cutout asset;
- club and opponent identities, logos and colours;
- match identity, round, venue, ISO date and display date;
- rating and ordered headline statistics;
- explicit provenance and builder version.

The model contains no rows, query clients, repository objects, hooks, or display components. Stage 2D should introduce a `PlayerPerformanceCardBuilder` that reads production sources and emits this exact contract. The template engine should not change.

Stage 2C uses one realistic mock model. The logo assets are bundled development fixtures and are intentionally replaceable through the model. Stage 2C.1 makes the opponent logo optional at validation/render time without changing the model shape.

## White Editorial template

`whiteEditorialTemplate` declares the approved 1080 × 1350 layout: warm-white background, cobalt rating and diagonal strike, translucent jersey number, dominant cutout, name/meta hierarchy, four stat columns, and a match footer. All typography comes from shared tokens. Canvas measurements are authored in 1080 × 1350 design coordinates, not device pixels.

## Positioning system

Only the `player` layer is interactive. Drag, pinch and rotation gestures write scale, canvas-coordinate translation, conservatively bounded rotation, and `canvasVersion`. Reanimated shared values update the player without rebuilding the scene on each touch sample. Reset restores the template default. Center changes horizontal alignment while retaining vertical position, scale and rotation.

Safe-area guides are rendered by the positioning screen above the card. They are not template layers and cannot appear in preview or export.

## Scaling and preview parity

Every scene uses the canonical coordinate system. Preview frames, typography, image frames and transforms use one scale factor: `renderWidth / canvas.width`. The export surface uses the same renderer, model, template and transform.

The export surface is sized using the active device pixel ratio so `react-native-view-shot` targets exactly 1080 × 1350 physical pixels. A normalization boundary downscales any platform-density variance to a lossless 1080 × 1350 PNG, then reads the dimensions back and rejects the file only if the normalized result still does not match.

## Export pipeline

1. Wait for the export surface's required cutout and home logo to load. Optional artwork never blocks export.
2. Capture the generic renderer using density-aware logical dimensions.
3. Normalize to and verify an exact 1080 × 1350 PNG.
4. Copy into the bounded local session cache.
5. Request write-only Photos permission.
6. Save to Photos when allowed; otherwise retain the local PNG.

There is no upload, database write, social-network SDK, or compression step. Guides and controls live outside the captured renderer.

## Local sessions

Cache-only JSON sessions are capped at five. A session records template ID/version, the complete model, versioned transform, timestamps and latest export URI. The existing cutout/editor cache continues to own the transparent cutout.

## Known limitations

- Physical-device visual and export comparison remains mandatory.
- The approved inline reference could not be persisted because no local source file was exposed.
- Typography uses an iOS system condensed face; an embedded licensed brand font would improve cross-device determinism later.
- Only 1080 × 1350 and iOS testing are supported.
- Mock logos demonstrate the image contract but are not production club data. Missing or failed opponent artwork is intentionally non-blocking.
- Cache is purgeable and is not permanent media storage.
- Device testing must confirm local-image readiness, alpha edges and capture parity.

## Stage 2D boundary

Stage 2D should add production hydration behind `PlayerPerformanceCardBuilder`, mapping tests and production image URL resolution. It must not add Supabase calls to templates, screens, render layers or the export engine.
