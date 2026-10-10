# Premium Player Cutout Editor — Stage 2B / 2B.1

Status: Stage 2B.1 usability and edge-precision implementation complete; physical-device interaction and image-quality validation required before production progression.

Last verified: 2026-07-31

## Scope and isolation

Stage 2B adds a non-destructive iOS cutout editor to the existing Admin → Developer → Player Cutout Lab. It does not change the live feed, player cards, card-template foundation, social/export paths, subscriptions, player models, Supabase, or Android.

The editor is reachable only after the Stage 2A.2 lab has produced a successful selected-subject PNG. Both the lab and editor independently retain the existing `__DEV__` and platform-admin gates.

The editor is a separate subsystem. Future card renderers consume only a final PNG and must never depend on its brush, gesture, history, or cache implementation.

## Architecture

```text
Player Cutout Lab
       |
       | successful Vision cutout + original local image
       v
PlayerCutoutEditor TypeScript API
       |
       +--> local draft/cache manager
       +--> command history and geometry helpers
       |
       v
Premium Editor Screen
       |
       +--> SVG live preview
       +--> gesture controller
       +--> toolbar and brush controls
       |
       | Save only
       v
PlayerCutoutEditor Expo Module
       |
       v
CoreGraphicsPlayerCutoutEditor
       |
       v
full-resolution transparent edited PNG
```

The native compositor has its own Expo module and does not alter or bypass `PlayerCutoutEngine`, `PlayerCutoutNativeEngine`, or `AppleVisionEngine`.

## Non-destructive editing model

Each draft owns three distinct assets:

1. a private copy of the original photo, used only as an optional tracing reference;
2. an immutable copy of the original Vision-generated transparent PNG;
3. an optional edited PNG produced by the most recent explicit Save.

Edits are an ordered, versioned command log. A stroke contains a tool, normalised image-space points, normalised brush diameter, feather value, identifier, and timestamp. No stroke modifies the Vision PNG.

```text
immutable Vision PNG
       +
commands[0...history cursor]
       |
       +--> SVG mask for immediate screen preview
       |
       +--> Core Graphics compositor for final Save
```

Erase lowers alpha. Restore copies alpha back from the immutable Vision result; it does not re-run Vision or invent pixels from the source photo. Reset is a history command, so it can itself be undone.

The original reference image is rendered only in the preview layer and is never supplied to the native export request.

## Public API

The stable import is:

```ts
import { PlayerCutoutEditor } from '@/modules/player-cutout-editor';
```

The Stage 2B API provides:

- `checkAvailability()`
- `createDraft({ originalImageUri, cutoutResult })`
- `loadDraft(draftId)`
- `saveHistory(draftId, history)`
- `renderAndSave(draftId, history)`
- `deleteEditedCutout(draftId)`
- `deleteDraft(draftId)`

The API returns structured draft and render results rather than exposing native Core Graphics types. The native renderer receives the immutable Vision PNG and resolved normalised strokes only.

## Brush engine

### Live preview

The editor uses a screen-resolution SVG luminance mask over the Vision PNG. Stroke coordinates remain normalised to the original image canvas, so preview size, letterboxing, zoom, and pan do not change stored edits.

Input points are distance-filtered and rendered as smoothed quadratic paths. Rounded line caps and joins prevent square pixels and visible gaps during rapid drawing. The illuminated circular cursor reflects the actual image-space brush diameter at the current zoom.

### Final compositor

On Save, the Swift compositor:

1. validates and decodes the immutable Vision PNG;
2. creates one editable premultiplied RGBA buffer and one protected original-pixel copy;
3. converts normalised stroke points and diameter to output pixels;
4. interpolates circular dabs along every segment at a spacing derived from brush radius;
5. applies a smooth feather falloff;
6. erases alpha toward zero or restores alpha toward the original Vision value;
7. preserves correct premultiplied colour values;
8. encodes a full-resolution transparent PNG;
9. returns timing, dimensions, size, alpha, stroke count, and estimated working-set diagnostics.

The live SVG preview is intentionally lightweight. The saved native result is authoritative for final feather and alpha quality.

## Gesture system

- one finger paints;
- two fingers pan;
- pinch zooms around the gesture focal point;
- double tap alternates between fit and 100%;
- Reset View restores aspect-fit zoom and centred pan.

Pinch and two-finger pan are simultaneous navigation gestures. Painting is exclusive to one finger, so navigation does not create brush strokes. The viewport transform is inverted when recording a point; gestures never alter the cutout or its saved coordinates.

Zoom is bounded from fit to 8×. “100%” is calculated from source pixels to fitted display pixels and is bounded by the same safe range.

## Undo, redo, and reset

History uses a command array plus cursor:

- Undo moves the cursor backward.
- Redo moves it forward.
- A new stroke after Undo discards only the abandoned redo branch.
- Reset adds a reset command instead of deleting history.
- Rendering resolves only commands up to the cursor and discards strokes before the latest active reset.

This gives practical unlimited undo/redo without retaining a full-resolution bitmap after every stroke. The limiting factors are JSON size and live SVG path count, not image-buffer history.

## Memory and performance strategy

- No full-resolution bitmap is copied during painting.
- Live feedback is a screen-resolution vector mask.
- Full-resolution allocation occurs only during explicit Save.
- Native rendering runs on a serial background queue.
- Swift image buffers are scoped to one render operation and released on return.
- Inputs above the native safety ceiling are rejected with a structured error.
- Temporary native render outputs are pruned.
- Local drafts are bounded to the five most recently used drafts.
- Stroke points are sampled before storage to constrain command and path size.

The compositor's approximate working set is exposed in its result. Long sessions containing hundreds of detailed strokes still need physical-device profiling; a future mask-tile/raster-compaction layer can be added behind the same TypeScript API without changing card consumers.

## Cache behaviour

Drafts are local-only under:

```text
Paths.cache/kickchasers-player-cutout-editor/<draftId>/
```

A draft contains:

- copied original reference image;
- protected `vision-original.png`;
- versioned `draft.json` command metadata;
- optional overwritable `edited.png`.

The metadata records image dimensions, creation/update dates, Vision processor version, editor version, selected subject identifiers, command history, and last native render diagnostics.

Saving overwrites only `edited.png`. Deleting the edited result retains the Vision original and command history. Reset Edits changes history but does not destroy either image. Delete Draft removes that draft's local directory. Nothing is uploaded or written to Supabase.

## Product-quality interaction details

The full-screen editor uses a restrained dark, industrial-luxe treatment with KickChasers gold as the active accent. Controls use rounded floating panels, high-contrast states, system iconography, safe-area positioning, and mobile-sized touch targets.

The editor supports checkerboard, white, and dark inspection backgrounds plus Off, Low, Medium, and High original-image reference levels. Tool switches, mode changes, brush-size completion, history actions, edge-protection changes, reset, and save use subtle iOS haptics. Live painting never displays a processing spinner; only the explicit full-resolution Save reports processing.

## Stage 2B.1 usability model

The primary editor is intentionally limited to Keep, Remove, three brush sizes, Undo, Redo, Refine Edges, and Done. Quick Select is the default. Keep restores only pixels that exist in the protected Apple cutout. Remove lowers the editable alpha. Neither operation invents pixels or changes the original photo.

The canvas shows a temporary translucent green Keep stroke or red Remove stroke while the finger is down. The colour is guidance only and is never part of the editable mask or exported PNG. Background, original-reference level, Edge Protection, Reset View, Start Over, and local deletion remain in the compact secondary menu. Technical mask language is not shown in the normal workflow.

## Why Vision can merge players

Foreground instance masks identify perceptually distinct foreground subjects; they do not guarantee one instance per human. Apple documents that touching subjects can be returned as a combined subject and that crowded person segmentation may miss or combine people. Shared silhouettes, crossing limbs, similar uniforms, occlusion, motion blur, and a football connecting two bodies can therefore produce one label in an AFL image.

A bounding box describes where a mask is. Resizing a box cannot create a missing pixel-level separation inside a combined mask. Stage 2A.2 can select only the instance labels Vision actually produced.

## Interactive Vision refinement feasibility

The foreground-instance API used by Stage 2A accepts an image and instance indices. It does not accept positive or negative strokes to refine an existing `VNInstanceMaskObservation`.

Apple announced `GenerateIterativeSegmentationRequest` at WWDC26. The beta API supports seed points, boxes, and scribbles followed by included and excluded points. It is not adopted in Stage 2B.1 because it is beta, requires an on-device model download, limits refinement to 13 points for point/scribble seeds or 11 for a box seed, and introduces a new OS/SDK availability and fallback contract.

Quick Select therefore does not rerun, retrain, or refine Vision. It is an honest non-destructive mask-editing workflow over the protected result.

Official references:

- [GenerateIterativeSegmentationRequest](https://developer.apple.com/documentation/vision/generateiterativesegmentationrequest)
- [Segmenting objects using taps, scribbles or rectangles](https://developer.apple.com/documentation/vision/segmenting-objects-using-taps-scribbles-or-rectangles)
- [Lift subjects from images in your app](https://developer.apple.com/videos/play/wwdc2023/10176/)

## Edge Protection

Edge Protection is Off, Normal, or Strong; Normal is the default and affects Remove only. For each interpolated native brush dab, the compositor compares local unpremultiplied colour with the dab centre and measures horizontal and vertical original-alpha gradients. Coverage falls smoothly where these signals indicate a likely boundary. Strong uses earlier thresholds and lower minimum influence; Off applies the original coverage.

This is deterministic edge-aware painting, not semantic AI. It cannot know that a similarly coloured arm belongs to another player. The lightweight SVG preview shows the full brush geometry; the final Core Graphics render remains authoritative for exact protection and feather coverage. Physical testing must calibrate the thresholds.

## Refine mode and loupe

Refine mode narrows the brush range, adds Firm/Soft/Softer feather presets, and presents a 132-point magnifier away from the active finger. The loupe uses the same normalised image point and current commands as the canvas, includes a low original-image reference, and shows a fixed centre crosshair. It disappears when the stroke ends. Returning to Quick Select never changes history.

## Coordinate and gesture guarantees

The editor removes aspect-fit letterboxing and pan, then divides by zoom and fitted image dimensions to store a normalised image point. Brush diameter is normalised against the source image's shorter dimension. The cursor converts that same diameter through aspect-fit scale and current zoom.

Device pixel ratio is not applied because Gesture Handler and React Native layout both report logical points. Native output independently maps the normalised value to full-resolution pixels. Adding a second pointer fails and discards the active paint stroke. A diameter-aware movement minimum rejects accidental taps. Native saving interpolates circular dabs at 22% of brush radius to prevent fast-stroke gaps.

## Working resolution and metadata

The working mask remains a versioned vector-command model in full-output normalised coordinates. The SVG preview is display resolution; no raster mask is repeatedly encoded. On Done, native code evaluates the commands against the full Vision PNG once. `workingMaskWidth` and `workingMaskHeight` record that full logical canvas. Older drafts infer these fields from their existing output dimensions. New strokes record Edge Protection and editing mode. Stage 2B.1 used editor version `1.1.0`; Stage 2B.2 uses `1.2.0` and remains backward-compatible.

## Conservative fragment cleanup decision

Connected-component and conservative fragment-candidate helpers are implemented and tested, but the action is deliberately not exposed. The current SVG command model has no authoritative raster mask until Done, and a size threshold could remove a detached football, fingers, flying hair, or a boot. A safe undoable preview requires a versioned raster-mask operation/checkpoint and belongs in the Stage 2C working-mask spike.

## Error and recovery behaviour

- A missing native compositor explains that a new iOS development build is required.
- A missing or corrupt draft returns to the lab with a meaningful alert.
- Save failures leave the Vision original, history, and prior edited PNG intact.
- Exiting the editor autosaves command history.
- Choosing or generating a new lab image clears the previous editor hand-off state.
- Deleting an edited PNG is distinct from deleting the whole draft.

## Validation

Automated focused tests cover:

- command ordering;
- undo/redo;
- abandoned redo branches;
- undoable reset;
- restore commands;
- aspect-fit layout;
- pan/zoom coordinate inversion;
- rejection outside the image canvas;
- 100% zoom bounds;
- brush point sampling;
- smooth path generation.

Static validation includes the isolated TypeScript project, changed-file ESLint, Expo module autolinking, CocoaPods installation, the native iOS module build, and `git diff --check`.

Because this stage adds a native Expo module, an existing development build cannot load it. Install a newly built iOS development client before physical-device testing.

## Physical-device checklist

Test on at least one modern iPhone and, where available, the oldest supported iPhone:

1. remove part of an overlapping defender;
2. remove an umpire and spectator;
3. restore an accidentally erased arm, football, and hair;
4. draw slowly and quickly at several brush sizes;
5. inspect feathering on checkerboard, white, and dark;
6. verify reference levels at Off, Low, Medium, and High;
7. verify one-finger paint, two-finger pan, focal pinch, double-tap fit/100%, and Reset View;
8. verify Undo, Redo, undoable Reset, and a new stroke after Undo;
9. Save, return to the lab, and confirm the edited PNG is shown;
10. reopen the editor and confirm history reloads;
11. delete the edited PNG and confirm the Vision original remains recoverable;
12. confirm orientation, dimensions, transparency, and edge colour after save;
13. confirm the reference photo never appears in the saved PNG;
14. profile a long, high-resolution editing session for frame rate, render time, and peak memory.

## Known limitations

- iOS only; Android remains a future engine implementation.
- The native module requires a custom Expo development build and does not run in Expo Go.
- The editor changes alpha only. Colour correction, healing, edge smoothing, shadow generation, blur, and lighting are not implemented.
- Restore is limited to pixels and alpha present in the original Vision cutout.
- The live SVG feather is an approximation of the higher-quality native saved result.
- Edge Protection is deterministic colour/alpha boundary weighting, not semantic or interactive AI segmentation.
- Apple’s iterative segmentation API is beta and is not used by Quick Select.
- Conservative fragment cleanup is analysed and tested but not exposed until it can be previewed and undone safely.
- Very long command histories can increase SVG path count and JSON size.
- The cache is disposable operating-system cache storage, not durable user-document storage.
- Final interaction, orientation, alpha-edge, and memory quality require the physical-device matrix above.

## Future extension points

The command union can add versioned tools such as Magic Heal, Edge Smooth, Feather Edge, or Auto Clean. The renderer protocol can add alternative native implementations. The live preview can move to a tiled GPU/raster mask while retaining the draft and public API. Export storage can later move behind a separate asset repository without exposing editor internals to cards.

## Stage 2C recommendation

Recommendation: **conditional GO** after the Stage 2B physical-device checklist passes.

Stage 2C should be an editor hardening and quality-calibration stage, not a performance-card stage. It should:

- measure frame rate and peak memory across the supported iPhone range;
- compare live-preview and saved feather/alpha parity;
- validate EXIF orientation and large HEIC/JPEG inputs;
- compact long histories into tiled mask checkpoints if profiling justifies it;
- add native cancellation/progress for unusually long final renders;
- establish visual regression fixtures for hair, footballs, limbs, and overlapping players;
- define durable asset ownership separately from disposable lab cache;
- freeze a versioned edited-cutout contract for later card templates.

Do not begin the White Editorial Performance Card until that quality gate is complete.
