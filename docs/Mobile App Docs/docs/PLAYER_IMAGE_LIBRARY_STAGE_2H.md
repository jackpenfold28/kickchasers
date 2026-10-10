# Stage 2H — Player Image Library

## Architecture

A Player Image is a reusable profile-owned asset, not a game result and not merely a cutout. The canonical record stores the original photo, transparent PNG, White Editorial transform, crop metadata, editor/processor versions, label, default/favourite state, and usage timestamps.

The production path is:

`player_images` + private Storage assets → `PlayerImageRepository` → existing Player Card workflow → `PlayerPerformanceCardModel` → White Editorial renderer.

The renderer, hydrated card model, feed post payload, publishing service, cutout engine, and Team Summary flow are unchanged.

## Database and storage

Migration `20260803120000_player_images.sql` creates:

- `public.player_images`, related to `profiles.user_id` with cascade deletion;
- profile/date and last-used indexes;
- a partial unique index permitting at most one default per profile;
- a trigger that makes the first image the default and atomically replaces an existing default;
- a private `player-images` bucket limited to image MIME types and 25 MB per object.

Originals use `<profile-id>/<player-image-id>/original.<ext>`. Transparent PNGs use `<profile-id>/<player-image-id>/cutout.png`.

## Security

Table RLS permits authenticated, active users to select, insert, update, and delete only rows whose `profile_id` equals `auth.uid()`. Storage policies repeat that ownership rule using the first storage path segment. The client uses the signed-in session and no service-role path.

## Library behaviour

The Player Images screen supports:

- thumbnail browsing and last-used status;
- add from camera or photo library;
- rename, favourite, set default, edit cutout, and delete;
- selection from Player Card creation;
- default-first ordering, with newest-created fallback when no default exists.

Only thumbnails are downloaded for the grid. The original is downloaded when a specific asset is selected or edited. Cached private files remain local and the remote bucket remains authoritative.

## Creation and editing

Add Player Image reuses the existing crop normalisation, Apple Vision subject detection, automatic subject choice, selected-subject cutout, non-destructive editor, and White Editorial default transform. Editing a saved image creates an editor draft from the stored canonical original and transparent PNG; a completed edit replaces only the stored cutout and updates its editor version.

## Card workflow

For the signed-in player's own performance, the generator first requests the default Player Image, then the newest image. If none exists it attempts the one-time legacy local-cutout migration, then preserves the existing action-photo/photo-selection fallbacks. A tracker cannot access another profile's private library; selected team-player performances therefore retain the existing photo workflow unless the tracker is also that player.

Changing the image opens the library selector for the owning player. Position and cutout edits to a persistent asset are saved back to that asset. `last_used_at` is updated best-effort and never blocks card creation.

## Onboarding

The optional **Add Your First Player Image** step follows the existing action-photo step. **Choose Photo** opens the same production add pipeline. **Do This Later** continues immediately. Returning with an image changes the action to **Continue**. The feature is also available later from Settings → Player Images.

## Legacy migration

When the library or card generator finds no server-backed image, it checks the existing approved local cutout cache. If present, it uploads the available original (or safely falls back to the cutout when the original no longer exists), stores the current White Editorial default transform, labels it `General`, and makes it default. If migration is impossible, the normal photo prompt remains available.

## Sharing and posted state

Generated and posted cards use the operating system's native PNG share sheet. This exposes installed destinations such as Instagram, Messages, Facebook, Save Image, and More without maintaining destination-specific integrations. Posted cards retain `Posted` and `View Post`, and add `Share Again`. Sharing does not create a feed post or mutate an existing one.

## Known limitations

- Stage 2H is iOS-first because the existing cutout/editor engine is iOS-only.
- Player Images are private to their owning profile; trackers cannot browse another player's library.
- Regenerating with a different image never overwrites an existing feed post.
- The local migration can preserve full restore capability only while its original source photo still exists.
- Native build and physical-device storage/RLS validation require the local Xcode and Supabase environments described below.

## Physical-device checklist

1. Apply the migration to a non-production Supabase environment.
2. Create a fresh user and complete onboarding both by adding an image and by choosing Do This Later.
3. Add camera and library images; verify transparent previews and editor save.
4. Rename, favourite, change default, edit, and delete; relaunch between operations.
5. Confirm a second default clears the first and deleting the default falls back to newest.
6. Generate a single-player card and verify the default loads without a photo flash.
7. Choose another saved image and confirm position/cutout edits persist into a new card.
8. Verify Share Image and Share Again open the iOS share sheet and Save Image produces a 1080 × 1350 PNG.
9. Sign in as a different user and confirm neither rows nor Storage objects from the first profile are visible.
10. Finish a Team Tracker game and verify the existing Team Summary creation/posting path is unchanged.

## Before Stage 3

- Apply and verify the migration in staging.
- Complete the physical-device matrix above, including offline cache/relaunch behaviour.
- Decide whether future template-specific transforms live on the Player Image record or in a separate per-template transform table. The current transform remains compatible with White Editorial.
- Add Android cutout/editor support before exposing Player Image creation on Android.
