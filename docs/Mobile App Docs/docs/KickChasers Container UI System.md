# KickChasers Container UI System

Status: historical visual reference; not a statement of current screen behaviour
Last verified: 2026-07-23
Source of truth: this file for its historical design direction; `DESIGN_PRINCIPLES.md`, `constants/theme.ts`, and reachable screens/components for the current UI

**Purpose:** This doc defines the reusable **container-first UI language** used in `onboarding.tsx`. Use it as the visual reference when redesigning all screens so everything feels consistent, premium, and “KickChasers”.

**Non-negotiable:** This is a **UI-only system**. When applying it to pages, do **not** change data flow, business logic, navigation, Supabase calls, or state handling—only layout + styling + small presentational components.

---

## Design goals

- Premium, modern, dark-first UI
- Strong contrast, readable typography
- Consistent spacing rhythm and alignment
- “Containers” used to group content, but not heavy/boxy
- Clear hierarchy: **Title → Section Label → Field Label → Input**
- Soft surfaces, subtle borders, minimal noise

---

## Color & theme usage

Use the existing theme system:

- `useColorScheme()`
- `getKickchasersPalette(colorScheme)`

### Palette conventions (by intent)
- `palette.background` — whole screen background
- `palette.surfaceSoft` — main container fill for inputs/selects/tiles
- `palette.surface` — modal sheet surface and option list surface
- `palette.border` — subtle borders/dividers
- `palette.textPrimary` — main text
- `palette.textMuted` — subtitles/labels
- `palette.textSubtle` — placeholders/helper copy
- `palette.accent` + `palette.accentSoft` — highlights, selected states, CTA accents
- `palette.errorBg`, `palette.errorBorder`, `palette.errorText` — errors

**Rule:** Don’t hardcode colors (especially neon greens) unless it’s a temporary placeholder. Prefer `palette.accent` / `palette.accentSoft`.

---

## Spacing system

### Screen padding
- Horizontal padding: **22**
- Bottom padding: **40**
- Vertical rhythm uses **gap**, not random margins.

### Global gaps
- Page section gap: **24**
- Section internal gap: **14**
- Field internal gap: **6**
- Small helper spacing: **4–8**

---

## Typography hierarchy

### Screen title
- Size: **28**
- Weight: **800**
- Letter spacing: **-0.5**
- Center aligned

### Subtitle
- Size: **15**
- Line height: **22**
- Color: `palette.textMuted`
- Center aligned

### Section label (uppercase)
- Size: **13**
- Weight: **700**
- Letter spacing: **0.4**
- Color: `palette.textMuted`
- Transform: uppercase

### Field label
- Size: **13**
- Weight: **600**
- Letter spacing: **0.3**
- Color: `palette.textMuted`

### Helper / inline message
- Size: **12–13**
- Color: `palette.textSubtle`
- Error helper uses: `palette.errorText`

---

## Containers (core system)

KickChasers uses “soft containers” rather than traditional outlined cards everywhere.

### 1) Shell containers (Inputs / Selects)
Used for:
- text inputs
- dropdown selects
- input-like pressables

Recommended styling:
- Background: `palette.surfaceSoft`
- Border: subtle (optional depending on screen), `palette.border`
- Radius: **14–16** (use **16** default)
- Padding: `12 vertical`, `12–14 horizontal`
- Layout: row, centered, gap **8–10**

**Important:** Avoid square corners. Do not use `borderRadius: 0`.

### 2) Tiles
Used for:
- avatar tile
- action photo tile
- media placeholders

Recommended:
- Radius: **16–24** (avatar can be **24**, action tile **16**)
- Background: `palette.surfaceSoft`
- Border: dashed for “add” states (optional)
- Overflow hidden
- Placeholder uses a plus-circle + helper text

### 3) Pills / Badges
Used for:
- selected badges
- state code badge

Recommended:
- Radius: **999**
- Padding: `10x4`
- Border: `palette.border` (or accent on selected)
- Background: `palette.surfaceSoft` or `palette.accentSoft`

### 4) Full-bleed list rows (Settings)
Used in `settings.tsx` to keep the page light:
- No card chrome around groups
- Rows span the available width with consistent vertical padding (**14–16**)
- Hairline dividers between rows at **30%** opacity of `palette.border`
- Icons use a soft background (`palette.surfaceSoft`), no outline
- Section labels still use the onboarding uppercase style

---

## Selection components

### Option rows in modal sheets
The onboarding uses pressable option rows (state/league/club/position) inside a sheet.

Option row styling:
- Row container: `paddingVertical: 12`, `paddingHorizontal: 12`
- Layout: row, gap **12**
- Background:
  - default: `palette.surface`
  - selected: `palette.accentSoft`
- Border / Divider:
  - use hairline divider between rows (bottom border)
- Selected state:
  - border color `palette.accent`
  - show “Selected” badge

---

## Roles chips (selectable cards)

Role chips in onboarding are bigger “cards” with a label + helper.

Recommended:
- Background: `palette.surfaceSoft`
- Radius: **16**
- Padding: `12 vertical`, `14 horizontal`
- Selected:
  - **Use accent**, not neon
  - Background: `palette.accentSoft`
  - Border: `palette.accent` (optional)
  - Text: still readable (if accentSoft, keep text primary)

**Rule:** Don’t hardcode `#39FF88` for selected unless it is your `palette.accent`. Use palette.

---

## Buttons

### Primary button (CTA)
- Full width
- Radius: **16**
- Padding vertical: **16**
- Touch target: at least **44px** tall after padding
- Background: `palette.accent` (currently `#39FF88` in onboarding/settings)
- Text color: high contrast dark (`#0B1224` in current screens)
- Weight: **800**
- Shadow: subtle (optional; keep premium, not heavy)

### Disabled
- Opacity: **0.55**

### Destructive actions
- Use `palette.errorBg` / `palette.errorBorder`
- Do not use bright neon

### Secondary / ghost
- Minimal chrome; use `palette.surfaceSoft` or transparent with subtle border if needed
- Match the sizing of primary CTA for consistency

---

## Modals / Sheets

Onboarding uses `SwipeDownModal` with a sheet surface.

### Sheet styling
- Background: `palette.surface`
- Border: `palette.border`
- Radius: **24** (top corners)
- Padding:
  - horizontal: **18**
  - top: **12**
  - bottom: **24**

### Backdrop
- dark translucent overlay (handled by modal component)

---

## Date of Birth input behaviour (UI)

Preferred pattern:
- DOB field looks like an input/select
- On focus/press, open native date picker (Android `DateTimePickerAndroid.open`) or sheet picker (iOS)
- Keep typed input format `DD/MM/YYYY` supported, but date picker is the primary UX.

---

## Sticky header pattern (Edit mode)

When editing, onboarding uses a sticky header after scroll.

Sticky header rules:
- Background: `palette.background`
- Padding: same as screen `22`
- Back button is a circular soft button:
  - size: 36
  - background: `palette.surfaceSoft`
  - border: `palette.border`
  - radius: 18
  - icon: chevron-left
- Title uses the 28 / 800 onboarding style
- Appears after scrolling ~40px (edit mode in onboarding, settings page)
- Content scrolls beneath; header stays fixed

---

## What to replicate across all pages

When redesigning a page with containers:

1) **Use consistent screen padding** (22) and section gaps (24)
2) Every “group” becomes a **Section**:
   - Section label (uppercase)
   - Inside: fields/rows with consistent shells
3) Inputs/selects always use the **same shell style**
4) Pressables that look like inputs must visually match inputs
5) Modals use the **same sheet system**
6) Buttons match the **primary CTA system**
7) Remove square corners and old “boxy” visuals

---

## What NOT to do

- Do not introduce new color palettes per screen
- Do not mix multiple card systems (one screen shouldn’t have 3 different row styles)
- Do not hardcode neon or random greens
- Do not add heavy borders/shadows everywhere
- Do not change any business logic while redesigning UI

---

## Quick checklist (per page)

- [ ] Background is `palette.background`
- [ ] Horizontal padding is 22 everywhere
- [ ] Title/subtitle match onboarding
- [ ] Sections use uppercase section label style
- [ ] Inputs/selects share the same container style
- [ ] Pressables are aligned and consistent
- [ ] Modals are SwipeDownModal sheet style
- [ ] Primary button matches onboarding
- [ ] No square corners / random radii
- [ ] No hardcoded neon colors (use `palette.accent`)

---

## Reference file

This system is based on `onboarding.tsx` and should be treated as the **gold standard** for UI going forward.
