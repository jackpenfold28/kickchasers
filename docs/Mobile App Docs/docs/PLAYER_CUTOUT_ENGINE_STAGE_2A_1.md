# Player Cutout Engine — Stage 2A.1

Status: iOS foundation implemented; physical-device quality and performance validation required.

## Scope

Stage 2A.1 is an isolated technical foundation for producing transparent player PNGs on iOS. It does not integrate with feed cards, exports, sharing, Supabase, subscriptions, player models, or the Stage 1 card-template architecture.

The lab is visible only when both conditions are true:

1. The JavaScript bundle is a development build (`__DEV__`).
2. The signed-in user passes the existing platform-admin permission check.

The lab route redirects to Admin when opened from a non-development bundle. The native module is optional at the JavaScript boundary so Android, web, Expo Go, and an outdated development build fail safely rather than crashing at import time.

## Architecture

```text
Player Cutout Lab
       |
       v
PlayerCutoutEngine TypeScript API
       |                    |
       |                    +--> Expo FileSystem local cache + JSON metadata index
       v
PlayerCutoutEngine Expo Module
       |
       v
PlayerCutoutNativeEngine protocol
       |
       v
AppleVisionEngine
       |
       v
Apple Vision VNGenerateForegroundInstanceMaskRequest
```

The UI never imports or calls Apple Vision. The Expo module also depends only on the internal `PlayerCutoutNativeEngine` protocol, not the concrete engine type. A future Android ML Kit engine or an ONNX engine can implement the same public TypeScript contract without changing callers.

## Expo module structure

```text
modules/player-cutout-engine/
├── expo-module.config.json
├── index.ts
├── ios/
│   ├── AppleVisionEngine.swift
│   ├── PlayerCutoutEngine.podspec
│   ├── PlayerCutoutEngineModule.swift
│   └── PlayerCutoutEngineTypes.swift
└── src/
    ├── PlayerCutoutEngine.ts
    ├── PlayerCutoutEngine.types.ts
    └── PlayerCutoutEngineModule.ts
```

The root `package.json` sets `expo.autolinking.nativeModulesDir` to `./modules`. Expo autolinking then discovers `PlayerCutoutEngine.podspec` and registers `PlayerCutoutEngineModule`.

This is a local Expo Module, not an ejected Expo application and not a third-party wrapper. It requires an Expo development build because Expo Go does not contain custom native code.

## Public TypeScript API

The stable entry point is:

```ts
import { PlayerCutoutEngine } from '@/modules/player-cutout-engine';
```

Supported methods:

- `checkAvailability()`
- `getEngineInfo()`
- `createCutout({ originalUri, requestId? })`
- `cancelProcessing(requestId?)`
- `clearTemporaryFiles()`
- `saveToCache(result, originalUri)`
- `reloadCachedCutout(cacheKey?)`
- `deleteCachedCutout(cacheKey?)`

`createCutout` always resolves to a structured `PlayerCutoutResult` for expected engine failures. It does not reduce the operation to a URI.

Important result fields:

- `success`
- `engine`
- `engineVersion`
- `requestId`
- `processingTimeMs`
- `originalWidth` / `originalHeight`
- `outputWidth` / `outputHeight`
- `outputFileSize`
- `pngUri`
- `alphaDetected`
- `subjectCount`
- `estimatedWorkingSetBytes`
- `memoryWarningCount`
- `warnings`
- `errors`

Errors have stable codes, a human-readable message, and a `recoverable` flag.

## Apple Vision processing pipeline

1. Accept only a readable local file URI.
2. Read dimensions and EXIF orientation with ImageIO without eagerly caching the full source.
3. Reject corrupt images and images above the 80-megapixel safety ceiling.
4. Decode the source `CGImage`.
5. pass the image and orientation to `VNImageRequestHandler`.
6. run `VNGenerateForegroundInstanceMaskRequest`.
7. include all detected foreground instances because subject-selection UI is explicitly out of scope.
8. generate a full-resolution, non-cropped masked pixel buffer.
9. inspect the pixel buffer for at least one non-opaque alpha value.
10. render and encode a PNG with Core Image and ImageIO.
11. write the PNG to a KickChasers-owned temporary directory.
12. return diagnostics and any warnings.

When multiple instances are found, the engine includes them and returns `MULTIPLE_SUBJECTS_COMBINED`. This is intentional until subject selection is built.

## Why Apple Vision

Apple Vision is the appropriate iOS foundation because:

- foreground instance masking is an Apple-supported system API;
- processing is fully on-device;
- it has no model download, model-bundle size, cloud dependency, or per-image service cost;
- it returns a high-resolution masked image with transparent pixels;
- the commercial app does not inherit a third-party wrapper’s maintenance or API lifecycle;
- the KickChasers-owned abstraction prevents Vision-specific types from escaping into application code.

The selected request requires iOS 17 or later. The Expo module itself has a 15.1 deployment target so the rest of the app remains build-compatible; availability is checked at runtime before any iOS 17 API is used.

## Local storage

Temporary output:

```text
FileManager.default.temporaryDirectory/KickChasersPlayerCutouts/
```

Reusable cache:

```text
Paths.cache/kickchasers-player-cutouts/
├── index.json
└── <request-id>.png
```

The cache record contains:

- cache key;
- original local URI;
- cutout local URI;
- width and height;
- creation date;
- processor version;
- engine name;
- PNG file size;
- alpha verification result.

No record or image is uploaded or written to Supabase. iOS may purge cache files under storage pressure, so callers must treat the cache as reusable but non-permanent.

## Diagnostics

The lab displays:

- engine availability;
- engine name and version;
- processing time;
- original and output resolution;
- PNG file size;
- alpha detected;
- subject count;
- estimated working-set bytes;
- observed iOS memory-warning count;
- temporary URI;
- cached URI;
- device model;
- iOS version;
- cloud-processing status.

The memory value is a conservative estimate based on source pixel count, not a live per-process memory measurement. `memoryWarningCount` reports warnings observed while the engine object is alive.

## Error handling

Expected error codes include:

- `UNSUPPORTED_PLATFORM`
- `UNSUPPORTED_OS`
- `SIMULATOR_UNSUPPORTED`
- `MODULE_UNAVAILABLE`
- `INVALID_INPUT`
- `CORRUPT_IMAGE`
- `IMAGE_TOO_LARGE`
- `NO_SUBJECT`
- `CANCELLED`
- `MEMORY_PRESSURE`
- `PROCESSING_FAILED`
- `FILE_WRITE_FAILED`
- `CACHE_FAILED`

Cancellation calls `VNRequest.cancel()` for the active request and records cancellation state so cancellation is still detected between decode, Vision analysis, masking, and PNG encoding.

## Build and verification completed

- Expo SDK: 54.
- Expo autolinking resolves `player-cutout-engine` and `PlayerCutoutEngineModule`.
- CocoaPods installs the local `PlayerCutoutEngine` pod.
- The `PlayerCutoutEngine` iPhoneOS scheme compiles successfully with Xcode.
- The new TypeScript and lab files pass ESLint.
- The new files introduce no TypeScript errors.
- The repository-wide TypeScript and lint commands remain red due to pre-existing errors in unrelated files.

No physical-device timing or AFL-photo quality claim is made at this stage. Those observations require the real test matrix below.

## Physical-device validation matrix

Run the lab on at least one modern iPhone with iOS 17+ and record results for:

- single player kicking;
- player marking;
- celebration;
- player holding a football;
- busy crowd;
- fence;
- trees;
- multiple players;
- nearby umpire;
- low-light match.

For each image, inspect:

- hair;
- jumper edges;
- boots;
- football;
- fingers;
- arms;
- legs;
- missed background;
- missing body parts;
- white halo;
- dark halo;
- checkerboard transparency;
- white background;
- dark background;
- processing time;
- output dimensions;
- PNG size;
- memory warnings.

Stage 2A.1 should not be declared production-quality until this matrix is recorded on physical devices.

## Known limitations

- iOS only.
- iOS 17+ is required for processing.
- Physical-device testing is required; the lab deliberately reports the simulator as unsupported.
- All detected foreground instances are combined.
- Vision may preserve nearby players, umpires, or foreground objects.
- There is no manual mask correction.
- There is no subject picker.
- PNG encoding is lossless and may produce large cache files.
- Very large source images can create memory pressure despite the 80-megapixel hard ceiling.
- Progress is indeterminate because Vision does not expose useful per-request segmentation progress.
- Cache storage can be purged by iOS.
- Live memory footprint is estimated rather than sampled.
- Cancellation cannot interrupt every synchronous encode instruction immediately; it is checked at pipeline boundaries.

## Recommended Stage 2A.2

1. Run and document the full AFL test matrix on representative iPhone generations.
2. Add automated fixture tests for dimensions, PNG signature, alpha presence, cache metadata, reload, delete, corrupt inputs, and cancellation.
3. Decide a practical source-resolution policy using measured memory and quality data.
4. Add optional downsampling and make the applied scale explicit in results.
5. Add subject identifiers and thumbnail masks at the engine-contract level.
6. Build the separately approved subject-selection UI.
7. Add a reusable quality-review record format with pass/fail notes per edge category.
8. Compare Apple Vision output against an independently selected ONNX baseline on the same image set.
9. Add Android’s engine behind the existing interface without changing lab consumers.
10. Version cache schema, engine contract, and processor independently before any production integration.

Do not begin card templates, editor transforms, feed integration, exports, sharing, or production asset storage as part of Stage 2A.2 unless separately approved.
