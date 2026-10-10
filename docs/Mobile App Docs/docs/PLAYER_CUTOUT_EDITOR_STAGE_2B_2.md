# Player Cutout Workflow — Stage 2B.2

Status: implementation complete; physical-device orientation and image-quality validation remains the release gate.

Last verified: 2026-07-31

## Scope

Stage 2B.2 fixes editor export orientation and Remove-brush trails, then adds an optional local pre-crop before Apple Vision. It remains isolated to the `__DEV__` and platform-admin-protected Player Cutout Lab. It does not change feed, cards, Stage 1 templates, social export, Supabase, subscriptions, Android, or production navigation.

## Audit findings and orientation root cause

The photo picker could return an image whose displayed orientation depended on EXIF metadata. Stage 2A passed the original `CGImage` plus that orientation to Vision. Vision then produced a pixel-oriented PNG with no EXIF transform. The editor decoded that PNG as an upright bitmap, but its Core Graphics compositor unconditionally translated and vertically scaled the drawing context before drawing it. The extra flip was not paired with an inverse transform before PNG encoding, so the canvas preview could be correct while the saved file was upside-down.

The fix is not a compensating rotation. The new pipeline normalises the picker result once with Expo Image Manipulator immediately after selection. That operation decodes the source orientation and writes a local PNG whose pixels match its displayed orientation. The resulting canonical PNG has an effective orientation of `up` and becomes the only image supplied to crop, Vision detection, Vision cutout generation, subject overlays, the editor reference, brush coordinates, final output, and cache. The native editor no longer applies its duplicate vertical flip.

```text
picker asset (may contain EXIF orientation)
        |
        v
one-time decode + canonical PNG, orientation up
        |
        +--> Use Full Image ------------------------+
        |                                           |
        +--> rotate/crop --> canonical working PNG  |
                                                    v
Vision --> protected Vision PNG --> edit commands --> oriented transparent PNG
```

No later stage reapplies picker EXIF orientation.

## Optional crop architecture

`PlayerCutoutPipeline` owns a bounded, local crop-session lifecycle. It is separate from `PlayerCutoutEngine` and `PlayerCutoutEditor` so Vision and editor public APIs remain stable.

1. The lab selects an image and creates a crop session.
2. The pipeline copies the original locally and creates the canonical full PNG.
3. The admin-only crop screen offers pan, pinch zoom, four-corner crop resizing, Freeform/Original aspect modes, 90-degree rotation, Reset, Cancel, Use Full Image, and Confirm Crop.
4. Use Full Image selects the canonical full PNG. Confirm Crop writes a separate canonical working PNG.
5. Returning to the lab atomically adopts only a `ready` session and clears stale detection/editor state.
6. Vision receives the working PNG, never the picker URI.

The crop frame is converted from viewport points by removing aspect-fit letterboxing, pan, and zoom. It is then converted to rotated image pixels and mapped back to a normalised rectangle in the unrotated canonical source. Confirmation is rejected unless the image fully covers the crop frame. Crop sessions are cache-only and bounded to five recent sessions.

Cropping removes irrelevant surroundings and often reduces Vision and editor memory cost. It cannot split people who touch inside the crop, and it does not replace Stage 2A subject selection or Keep/Remove cleanup.

## Crop metadata contract

Crop metadata schema 1 records:

- whether the tester chose `full-image` or `crop`;
- original local source URI;
- canonical full-image URI;
- working image URI;
- original, canonical, and output dimensions;
- normalised crop rectangle in canonical source coordinates;
- clockwise rotation (`0`, `90`, `180`, or `270`);
- creation date;
- pipeline version.

The same optional metadata is copied into the selected-cutout cache record and editor draft. Older Stage 2B.1 records have no field; normalisation treats it as `null`, so they continue to load without migration or a crash. The editor version is now `1.2.0`; crop metadata schema and pipeline version are independently versioned.

## Remove-brush root cause and fix

The native saved operation already interpolated circular dabs, but the live SVG mask drew each Remove stroke twice: a full-width mid-grey path followed by a narrower black path. The grey perimeter represented feathering, but appeared as a persistent outline/trail. Edge Protection could also reduce coverage through the centre of a dab, leaving a semi-opaque rail after a fast stroke.

Stage 2B.2 removes the grey outline construction. The live mask uses one round, full-diameter removal path; the red path remains a temporary touch guide only and disappears at stroke end. Final save remains authoritative and rasterises filled circular dabs into the editable alpha:

- samples are interpolated at no more than 22% of brush radius;
- every dab has circular coverage and smooth feather falloff;
- the decisive centre of an erase dab bypasses Edge Protection;
- protection applies only toward the perimeter;
- Remove lowers alpha and updates premultiplied RGB consistently;
- Keep uses identical geometry and restores only protected Vision pixels;
- no overlay, SVG stroke colour, checkerboard, reference, cursor, crop UI, or selection box reaches native export.

Undo, redo, Reset, and the immutable Vision PNG model are unchanged.

## Editor simplification

The primary toolbar now contains Remove, Keep, Brush Size, Undo, Redo, and Done. Refine Edges and Before/After moved into the secondary menu with background, reference opacity, edge protection, view reset, and Start Over. No additional editing tools were introduced.

## Performance and storage

Canonicalisation happens once per selection. After a crop is confirmed, Vision and the editor use only the smaller working image and do not repeatedly decode the full picker source. Crop UI rendering uses the canonical asset at display resolution; final crop and final edit each encode once. Crop sessions and editor drafts are separately bounded to five. All assets remain under `Paths.cache`; there are no database writes or uploads.

## Validation coverage

Focused tests cover aspect fit, letterboxing, pan/zoom conversion, crop-frame coverage, four-corner resizing, locked aspect ratio, rotation dimensions, rotated-to-source mapping, slow/fast/curved/repeated brush sampling, small and large brushes, boundaries, zoom-coordinate invariance, undo/redo, reset, crop-cache metadata, and legacy metadata compatibility.

Static validation includes the Stage 2B.2 TypeScript project, changed-file ESLint, focused Node tests, native iOS build, Expo autolinking/CocoaPods resolution, scope-diff inspection, and `git diff --check`.

## Physical-device checklist

Before Stage 2C, validate on a rebuilt iOS development client:

- portrait, landscape, upside-down capture, front-camera image, Photos-edited image, screenshot, and EXIF-rotated source;
- portrait/landscape crop, Use Full Image, and each 90-degree rotation;
- Vision overlay alignment and original-reference alignment;
- long, fast, curved, repeated, small, large, boundary, and zoomed Remove strokes;
- football and limb refinement with Edge Protection Off/Normal/Strong;
- Save, reload, undo/redo, Start Over, change image, and delete;
- compare editor preview and exported PNG over checkerboard, white, and dark backgrounds.

The mandatory pass criteria are: no inverted/rotated saved output, no grey or coloured brush trail, valid alpha, and stable cache reload. Automated and simulator checks cannot replace this physical-device image-quality gate.

## Known limitations

- Apple Vision may still merge touching or occluded players inside a crop.
- Crop rotation is limited to 90-degree increments; there is no perspective or horizon tool.
- Full-image canonical PNGs trade larger temporary storage for lossless orientation normalisation.
- The live SVG mask is a responsive preview; native Core Graphics remains authoritative for exact feather and edge-protection output.
- Cache storage is purgeable by iOS and is not permanent media storage.

## Stage 2C recommendation

NO-GO at implementation handoff because the mandatory physical-device matrix has not yet been completed. This becomes GO only after the matrix passes on at least one modern iPhone and one older supported device. If any orientation mismatch or semi-opaque Remove rail remains, Stage 2C stays NO-GO until the failing source or brush case is captured and corrected. Do not begin performance-card work merely because static validation passes.
