# Player Card Final Refinements — Stage 2E.2

Status: implementation complete; physical-device image validation remains required.

Last verified: 2026-08-02

## Scope

Stage 2E.2 makes two isolated changes. White Editorial secondary copy now uses resolved squad branding, and the iOS cutout editor's Keep brush can restore canonical source pixels that Apple Vision omitted. There are no feed, post, database, Supabase, subscription, Android, renderer-layout, or production-navigation changes.

## White Editorial secondary text token

`secondaryAccentText` is resolved once per template scene from `PlayerPerformanceCardModel.club.colours.secondary`. It is applied only to player position/jumper metadata and the labels beneath headline statistics. Preview, positioning, generation, and export all consume the same scene, so there is no separate export colour calculation.

The supplied colour is preserved when it parses as an opaque-enough CSS hex/RGB colour (alpha at least `0.85`) and reaches WCAG contrast `4.5:1` against the approved `#F5F6F8` card surface. Otherwise the existing resolved primary accent is used when readable; if that also fails, the approved White Editorial accent `#176CE8` is used. The fallback is deterministic and does not query or mutate branding data.

## Previous Keep limitation

The editor previously decoded only the transparent Vision PNG. Keep raised editable alpha no higher than the Vision alpha and copied RGB from that already-masked PNG. A pixel classified as background therefore contained neither usable alpha nor RGB, making a detached football impossible to restore.

## Source-backed non-destructive compositor

Editor version `1.3.0` renders from three aligned buffers:

```text
canonical source RGBA
        +
original Vision alpha
        +
ordered Keep / Remove operations
        =
source RGB composited with final editable alpha
```

The editable buffer begins as the immutable Vision cutout. Remove lowers its alpha. Keep raises alpha toward the canonical source alpha, including where Vision alpha was zero. After every ordered operation is applied, RGB is rebuilt from the canonical source and premultiplied against final alpha. Vision is not rerun and no pixels are invented. The final PNG contains no editor guidance, reference opacity, or coloured overlay.

The live SVG preview mirrors this model with a Vision base layer and an ordered source-restoration layer, so detached content appears immediately. The native Core Graphics result remains authoritative for exact feathering and edge protection.

## Alignment and orientation

The Stage 2B.2 pipeline still canonicalises orientation before crop, Vision, editing, and save. The editor now requires canonical source and Vision images to have identical pixel dimensions. A mismatched or missing legacy asset returns a structured invalid-input failure rather than attempting a misaligned composite.

## Cache compatibility

New drafts use asset version `2`; editor version is `1.3.0`. Version 2 means source-backed RGB plus editable-alpha output. Legacy manifests without `assetVersion` normalise to version `1`. Existing legacy drafts migrate when both their canonical source and Vision files remain present; their next successful render is saved as version 2. Missing source files or mismatched dimensions fail safely without crashing.

The existing history remains ordered stroke metadata rather than bitmap snapshots, so Keep, Remove, undo, redo, reset, save, and reload retain their established semantics.

## Validation focus

Automated coverage includes source restoration where Vision alpha is zero, partial alpha, Remove followed by Keep, source RGB premultiplication, feather coverage, history behavior, legacy metadata, version-2 reload metadata, secondary-colour resolution, contrast fallback, and preview/export scene parity.

Physical-device validation must use a rebuilt iOS development client and confirm a detached football, partially included ball, hair and finger edge over checkerboard/white/dark; undo/redo; crop and rotated inputs; save/reload; and the final White Editorial card. Static tests cannot establish real-photo edge quality.

## Known limitations

- Keep is a deliberate brush operation, not guided AI segmentation; it can restore nearby background if the brush crosses it.
- The responsive SVG preview approximates the native feather while Core Graphics produces the saved alpha.
- The canonical source and Vision output must share dimensions, which is required for pixel-accurate restoration.
- Local cache remains purgeable and is not permanent PlayerImage storage.

## Stage 2F gate

The implementation is a technical GO after static and native build validation. Product GO still requires the physical-device checklist to pass on representative AFL photos, especially detached-football restoration and saved-card output.
