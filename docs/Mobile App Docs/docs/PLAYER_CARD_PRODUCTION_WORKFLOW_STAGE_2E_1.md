# Player Card Production Workflow Prototype — Stage 2E.1

Last verified: 2026-08-02

## Outcome

Stage 2E.1 turns the protected Admin Player Card Generator into a near-production workflow while leaving the approved White Editorial template, generic renderer, export engine, canonical performance model, feed and database unchanged.

```text
Select completed game
  → take or choose player photo
  → canonicalise photo orientation
  → detect foreground subjects with Apple Vision
  → automatically select the most likely foreground player
  → generate a transparent Player Image
  → apply approved White Editorial placement defaults
  → render exact 1080 × 1350 card
  → optional Edit Player
  → Done or native Share sheet
  → optional Player Image naming prototype
```

The only required decisions are the completed game and photo.

## Product language

Production-facing copy now uses **Player Image**, not “cutout.” A Player Image is the reusable product asset. Internally, the existing Apple Vision and editor modules retain their technical cutout terminology because they implement background removal and alpha-mask editing rather than the future product entity.

## Workflow service

`PlayerCardProductionWorkflowService` is independent of React screens. Its injected dependencies cover:

- engine availability;
- photo canonicalisation;
- subject detection;
- selected-subject transparent PNG generation;
- editor-draft creation;
- detection-session disposal;
- canonical model hydration and card preparation.

The production singleton composes the existing Stage 2A/2B pipeline with the Stage 2E generation service. The screen supplies progress presentation and mounts the unchanged capture renderer.

## Automatic subject selection

Apple Vision returns foreground instances but does not identify which person is the intended athlete. Stage 2E.1 uses a deterministic prototype heuristic:

1. choose the instance with the largest estimated foreground area;
2. use proximity to the image centre only when areas are effectively equal;
3. use Vision subject order only as a final deterministic tie-breaker.

This is not player recognition and is not presented as AI identity matching. When multiple subjects exist, the completed screen advises that Edit Player is available. A future production flow may need a one-tap subject correction when the heuristic chooses incorrectly.

## Automatic placement

The workflow calls the existing White Editorial template and uses its current `defaultPlayerTransform`. No positioning screen is required before the first result. The finished card appears immediately after generation.

## Optional Edit Player

Edit Player is deliberately secondary and supports:

- drag, pinch and rotate through the existing reusable `PlayerPositioningCanvas`;
- detailed Keep/Remove cleanup through the existing Player Cutout Editor;
- an optional system crop while replacing the photo;
- automatic re-detection from the current photo.

Saving cleanup returns to the generator through the existing navigation stack. The screen detects the editor’s new temporary PNG and immediately regenerates the card. Applying placement changes likewise regenerates without returning to the game/photo steps.

## Future PlayerImage model

`PlayerImage` establishes the future product contract, while `TemporaryPlayerImage` narrows this prototype to non-persistent workflow assets:

| Field | Purpose |
| --- | --- |
| `id`, `playerId`, `modelVersion` | Stable identity and migration boundary |
| `originalPhotoUri` | Recoverable source photo |
| `transparentPngUri` | Background-removed player asset |
| `position` | Scale, translation, rotation and canvas version |
| `crop` | Source crop, orientation and pipeline metadata |
| `label` | Future editable name such as Celebration or Kick |
| `createdAt`, `updatedAt` | Lifecycle timestamps |
| `favourite`, `isDefault` | Future asset-library behaviour |
| `editorDraftId`, `selectedSubjectIds`, `processorVersion` | Re-edit and provenance metadata |
| `persistence` | Explicitly `workflow-temporary` in this prototype |

No table, storage bucket, API or durable PlayerImage repository exists in Stage 2E.1.

## Done, Share and naming prototype

Done and Share both present:

**Save this player image?**

“Save this player image and positioning so future player cards can be created instantly.”

Choosing Save opens the Player Image Details prototype. It suggests `Celebration`, supports editable text and quick options for Running, Mark, Goal, Kick and General, then clearly states that nothing is saved. Share uses the native device share sheet with the already generated local PNG; it does not alter the existing export engine.

## Storage and privacy

- Processing remains on-device.
- No photo, Player Image or card is uploaded.
- No Supabase write occurs.
- No PlayerImage record is persisted.
- Existing pipeline/editor drafts and generated previews use bounded local cache storage solely to support navigation, editing and preview.
- Leaving the prototype does not promote those cache files into permanent product assets.

## Known limitations

- Apple Vision and the automatic largest-subject heuristic can choose or group the wrong person in crowded photographs.
- Camera/photo permissions and native Vision processing require an iOS development build, not Expo Go.
- System crop is used for the optional Crop / Replace action; the initial two-decision path deliberately skips crop.
- Cleanup and placement share one Edit Player experience but remain separate reusable technical surfaces internally.
- Player Image naming is intentionally non-persistent.
- Physical-device validation is required for camera permission, navigation return, share sheet, image orientation and end-to-end timing.

## Recommended Stage 2F boundary

Stage 2F should validate the workflow on representative AFL photos, settle the wrong-subject correction experience, and define a secure production PlayerImage repository/storage contract. Permanent storage should not begin until ownership, privacy, deletion, versioning, defaults and retention rules are approved.
