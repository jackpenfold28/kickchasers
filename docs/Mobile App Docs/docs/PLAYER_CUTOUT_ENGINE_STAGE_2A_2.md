# Player Cutout Engine — Stage 2A.2

Status: implementation and static/native build validation complete; physical-device multi-subject validation required before Stage 2B.

Last verified: 2026-07-30

## Scope and isolation

Stage 2A.2 extends the existing iOS Player Cutout Engine with foreground-instance detection and deliberate subject selection. It remains an Admin-only technical lab. It does not touch the live feed, player cards, exports, sharing, Supabase, subscriptions, player models, Android, or the Stage 1 player-card template foundation.

The lab remains protected by both existing controls:

1. its Admin entry is rendered only when `__DEV__` is true; and
2. the screen independently redirects outside development and requires the existing platform-admin permission check.

The native module remains optional at the JavaScript boundary. Expo Go, Android, web, an old development client, and unsupported iOS versions return structured availability/errors rather than crashing during import.

## Extended architecture

```text
Player Cutout Lab
       |
       v
PlayerCutoutEngine TypeScript API
       |                         |
       |                         +--> selection validation
       |                         +--> aspect-fit overlay geometry
       |                         +--> Expo FileSystem cache schema v2
       v
PlayerCutoutEngine Expo Module
       |
       v
PlayerCutoutNativeEngine protocol
       |
       v
AppleVisionEngine
       |
       +--> bounded AppleVisionDetectionSession
       |
       v
VNGenerateForegroundInstanceMaskRequest
```

React Native never receives a Vision observation, mask label, `IndexSet`, request handler, or other Apple-specific type. The TypeScript contract uses opaque session/subject identifiers and generic bounding-box/result types so Android ML Kit or a future ONNX engine can implement the same application API.

## Public TypeScript API

The stable import remains:

```ts
import { PlayerCutoutEngine } from '@/modules/player-cutout-engine';
```

Stage 2A.2 adds:

```ts
detectSubjects({ originalUri, requestId? })

createSelectedCutout({
  detectionSessionId,
  selection: { mode: 'all' }
    | { mode: 'subjects', subjectIds: string[] },
  requestId?,
})

disposeDetectionSession(detectionSessionId?)

getTemporaryFileCount()
```

Existing methods remain:

- `checkAvailability()`
- `getEngineInfo()`
- `createCutout({ originalUri, requestId? })`
- `cancelProcessing(requestId?)`
- `clearTemporaryFiles()`
- `saveToCache(result, originalUri)`
- `reloadCachedCutout(cacheKey?)`
- `deleteCachedCutout(cacheKey?)`

`createCutout()` preserves Stage 2A.1 meaning: it performs a fresh Vision request and combines every detected foreground instance. When more than one instance is combined it returns `MULTIPLE_SUBJECTS_COMBINED`. Existing callers therefore do not silently change behaviour.

## Detection result contract

`detectSubjects()` returns a structured `DetectPlayerSubjectsResult` containing:

- success and structured warnings/errors;
- engine and processor version;
- request and detection-session identifiers;
- detection time;
- oriented source dimensions;
- subject count;
- temporary preview-file count;
- memory-warning count;
- a list of detected subjects.

Each subject contains:

- an opaque identifier valid only for that detection session;
- a one-based display index;
- pixel and normalised bounding boxes;
- transparent cropped preview PNG URI and dimensions;
- estimated mask area as a proportion of the source canvas;
- image-boundary contact state;
- subject-specific warnings;
- `confidence: null` and `confidenceSource: not-provided-by-engine`.

Apple Vision does not provide a meaningful confidence value for individual foreground instances through this API. The engine deliberately does not present mask area, instance order, or another inference as confidence.

## Detection-session lifecycle

```text
Choose local image
    |
    v
detectSubjects()
    |
    +--> previous session and previews removed
    +--> one Vision observation generated
    +--> opaque subject map and previews created
    |
    v
detectionSessionId + subjectIds
    |
    v
createSelectedCutout()
    |
    +--> session/source/selection validated
    +--> selected Vision instances combined
    +--> full-canvas transparent PNG generated
    |
    v
disposeDetectionSession()
```

Lifecycle rules:

- only one native detection session is retained;
- a new detection disposes the previous session;
- choosing a new image clears React selection/result state and explicitly disposes the old session;
- a session expires after five minutes of inactivity;
- a subject identifier is accepted only with its owning session;
- the source file size and modification date are checked before final rendering;
- leaving the lab disposes the current session;
- `clearTemporaryFiles()` also removes the active session;
- memory pressure releases session data at the next safe operation boundary;
- preview directories are removed on failure, cancellation, replacement, expiration, explicit disposal, or cleanup.
- stale session directories left by an interrupted app process are removed before a new detection;
- temporary final outputs are capped at the ten newest PNGs, while explicitly cached PNGs use the separate cache directory.

Opaque identifiers deliberately do not encode or expose Apple Vision instance labels. The native session owns the subject-to-instance mapping.

## Native Apple Vision pipeline

Detection:

1. validate a readable local URI;
2. read dimensions and EXIF orientation through ImageIO;
3. reject corrupt or over-80-megapixel images;
4. create an orientation-aware `VNImageRequestHandler`;
5. run `VNGenerateForegroundInstanceMaskRequest`;
6. enumerate `allInstances`;
7. scan the labelled instance-mask buffer once to calculate bounds, area, and boundary contact;
8. assign opaque KickChasers subject identifiers;
9. generate a cropped transparent preview for each subject, bounded to 320 pixels on its longest side;
10. retain one bounded native session for final output.

Selected output:

1. validate session age and identity;
2. validate that the source has not changed;
3. validate and deduplicate selected subject identifiers;
4. map opaque identifiers back to the retained Vision instances;
5. combine selected instances in an `IndexSet`;
6. generate a non-cropped masked image;
7. preserve the original oriented canvas and transparent pixels elsewhere;
8. verify that non-opaque alpha exists;
9. encode a full-resolution PNG;
10. return structured diagnostics and selection provenance.

The final PNG is never tightly cropped. Only lab thumbnails are cropped and downsampled.

## Memory strategy and trade-off

Stage 2A.2 retains one Vision observation and its request handler for a maximum of five minutes. This was chosen over regenerating the observation because Vision instance labels are implementation details and must not be assumed stable across separate requests. Retention guarantees that a subject selected in the lab maps to the same observation used to create the final PNG.

Controls around that choice:

- maximum one session;
- explicit disposal;
- short inactivity expiry;
- replacement on new detection;
- aggressive preview cleanup;
- Core Image intermediate caching disabled;
- preview output downsampled;
- full-resolution buffers created only for final output;
- memory-warning tracking and post-operation session purge;
- 80-megapixel input ceiling.

The remaining cost is that the oriented source image, request handler, and observation can remain resident during selection. Physical-device memory profiling should determine whether the five-minute limit and 80-megapixel ceiling should be reduced before production use.

## Cancellation

Detection cancellation calls `cancel()` on the active Vision request and also records cancellation state for boundaries between decoding, detection, preview generation, and file output.

Selected-output cancellation is cooperative because Apple does not expose a cancellable request object for `generateMaskedImage`. The operation is marked active, cancellation is recorded, and the pipeline aborts at the next safe boundary. A partially written PNG is deleted. Cancellation returns the existing structured `CANCELLED` error and does not install partial detection state.

## Lab subject-preview approach

The existing Player Cutout Lab now uses both approved identification methods:

- selectable numbered bounding boxes over the original image; and
- selectable transparent subject thumbnails.

Bounding boxes use a pure aspect-fit calculation that includes horizontal/vertical letterboxing. The same subject can be toggled from either representation.

Default behaviour:

- exactly one detected subject is selected automatically;
- two or more subjects start with no selection;
- `Select All` and `Clear Selection` are explicit;
- final generation is disabled for an empty selection;
- no “main player” is inferred.

The lab also retains a labelled Stage 2A.1 all-subject action for backward-compatibility validation.

## Cache schema v2

The reusable cache remains local under:

```text
Paths.cache/kickchasers-player-cutouts/
```

Schema v2 adds:

- detection-session identifier;
- selected subject identifiers;
- selection mode (`all` or `subjects`).

Existing schema-v1 indexes are accepted and normalised to v2 when read. Legacy records have no selection provenance. The cached PNG always represents the final cutout result passed to `saveToCache`.

No cloud or database storage was added. Detection-session identifiers are diagnostic provenance, not durable identifiers and cannot recreate an expired native session.

## Errors

Stage 2A.2 adds structured codes:

- `EMPTY_SELECTION`
- `INVALID_SUBJECT_IDENTIFIER`
- `SESSION_EXPIRED`
- `SESSION_MISMATCH`
- `IMAGE_CHANGED`

Existing unsupported-platform, unsupported-OS, simulator, module, input, corrupt-image, size, no-subject, cancellation, memory, processing, write, and cache errors remain.

## Automated and build validation

Focused TypeScript tests cover:

- single-subject default selection;
- deliberate multi-subject selection;
- select-all;
- empty selection;
- session mismatch;
- invalid identifiers;
- selection deduplication;
- aspect-fit letterboxing;
- normalised bounding-box conversion;
- cache selection provenance;
- Stage 2A.1 cache backward compatibility.

Completed validation:

- 12 focused tests pass;
- the Stage 2A.2 TypeScript project passes;
- ESLint passes for every changed TypeScript/TSX file;
- Expo autolinking resolves `player-cutout-engine` and `PlayerCutoutEngineModule`;
- CocoaPods installs the local module successfully;
- the `PlayerCutoutEngine` Debug iPhoneOS scheme builds successfully without code signing;
- `git diff --check` passes.

The repository-wide typecheck and lint remain red from pre-existing unrelated failures. The scoped checks above contain no Stage 2A.2 errors.

Validation commands:

```sh
npx tsc -p tsconfig.player-cutout-stage-2.json
npx eslint app/admin/player-cutout-lab.tsx modules/player-cutout-engine
xcodebuild -project ios/Pods/Pods.xcodeproj -scheme PlayerCutoutEngine \
  -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' \
  CODE_SIGNING_ALLOWED=NO build
npx expo-modules-autolinking resolve --platform apple
cd ios && pod install --no-repo-update
git diff --check
```

Because native Swift changed, testing requires a newly compiled Expo development build. A Stage 2A.1 binary cannot receive these native changes through Metro.

## Physical-device checklist

For every image, record detection time, final output time, subject count, selected count, output dimensions/size, alpha state, memory warnings, and temporary-file count.

Test:

1. one isolated player;
2. two players contesting a mark;
3. a tackle;
4. player and umpire;
5. player near spectators;
6. several players at similar scale;
7. large foreground player plus small background players;
8. player holding a football;
9. partial player at an image edge;
10. low-light match;
11. busy fence/advertising background;
12. team celebration.

Confirm:

- overlays align after EXIF rotation and with portrait/landscape letterboxing;
- subjects are separate where Vision supports separation;
- no selection begins on multi-subject photos;
- the intended player can be selected;
- unselected people are transparent;
- two or more selected subjects combine correctly;
- football grouping is acceptable and documented;
- choosing a new image clears all old boxes, thumbnails, IDs, and cutout state;
- expired/invalid sessions show specific errors;
- cancellation allows a subsequent detection/generation;
- checkerboard, white, and dark previews show real alpha without white outlines;
- cached selected PNG reloads and deletes correctly;
- leaving/reopening the lab does not accumulate preview files.

## Known Apple Vision limitations

- iOS 17+ physical devices only.
- Apple controls instance detection, boundaries, and object grouping.
- Nearby/contacting players may be grouped into one instance.
- A ball may be grouped with a player, separated, or omitted depending on the photo.
- Spectators or umpires may be foreground instances.
- Small background players may not be returned.
- Detection order is not semantic and does not imply importance.
- Bounding boxes come from Vision's lower-resolution instance mask and are approximate.
- There is no manual mask correction.
- Preview generation is sequential.
- Progress is indeterminate because Vision exposes no useful segmentation percentage.
- Selected-output cancellation is cooperative rather than instantaneous.
- PNG files can be large.
- Cache storage remains purgeable by iOS.
- Live resident memory is estimated/observed indirectly, not sampled precisely.

## Stage 2B recommendation

**NO-GO until the physical-device checklist passes on representative multi-subject AFL photos.**

The implementation establishes the correct abstraction and build foundation, but simulator/static tests cannot prove instance grouping, football preservation, overlay orientation, alpha-edge quality, latency, or memory safety. Once that evidence passes, Stage 2B should be a separate local-only transform/editor foundation:

- consume a selected cutout through `PlayerCutoutEngine`, never Apple Vision directly;
- add drag, pinch, rotate, reset, safe-area bounds, and normalised transform persistence;
- keep editor state independent of any particular card template;
- add deterministic canvas/output coordinate conversion;
- test high-resolution export composition locally;
- remain outside the live feed, database, subscriptions, and production renderer.

Do not begin a premium card template until the cutout-quality gate and editor coordinate contract are both proven.
