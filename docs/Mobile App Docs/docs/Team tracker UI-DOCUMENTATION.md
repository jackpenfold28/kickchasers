# AFL Stat Tracker - UI Documentation

Status: historical visual/design reference; not a current feature contract
Last verified: 2026-07-23
Source of truth: this file for its historical visual direction; `NEW_GAME_FLOW.md`, `DESIGN_PRINCIPLES.md`, and active team-tracker routes/components for current behaviour

## Overview
The AFL Stat Tracker is a modern, high-end mobile and tablet application designed for tracking Australian Football League player statistics in real-time. The app features a minimalist, colorful, and sleek design with a dark navy theme (`#0A1628`) and bright green accents (`#00FF87`), supporting both light and dark modes.

---

## Design System

### Color Palette
- **Primary Background (Dark):** `#0A1628` (Dark Navy)
- **Primary Accent:** `#00FF87` (Bright Green)
- **Light Background:** `white`
- **Secondary Backgrounds:**
  - Dark mode: `white/10` (semi-transparent white)
  - Light mode: `slate-100`

### Typography
- **Headings:** Inter font family
- **Player Numbers:** Custom condensed fonts (Anton, Bebas Neue, Barlow Semi Condensed)
- **Font Sizes:** Responsive to device size (iPhone 17 vs iPhone 17+)

### Layout Principles
- **No scrolling:** All content fits on one screen for each device
- **Responsive:** Optimized for iPhone 17 (393×852), iPhone 17+ (430×932), and iPad Pro 11" (1194×834)
- **Card-based design:** Rounded corners (`rounded-lg`, `rounded-xl`, `rounded-2xl`)
- **Consistent spacing:** Using Tailwind gap utilities (`gap-2`, `gap-3`, `gap-4`)

---

## Application Structure

### Entry Point
**File:** `/App.tsx`
- Renders the `DeviceDemo` component
- Single-page application with no routing

### Device Demo Wrapper
**File:** `/components/DeviceDemo.tsx`

**Purpose:** Showcases the app across multiple device sizes with device frames

**Features:**
- Dark/Light mode toggle (top-right button)
- Three device previews:
  - iPad Pro 11" Landscape (1194×834)
  - iPhone 17 (393×852)
  - iPhone 17 Plus (430×932)
- Realistic device frames with rounded corners and shadows
- Dynamic Island simulation for iPhones

**State Management:**
- `darkMode`: boolean - Controls theme across all devices

---

## iPhone Version Components

### 1. StatTracker (Main Container)
**File:** `/components/StatTracker.tsx`

**Purpose:** Main container component for iPhone stat tracking

**Props:**
- `darkMode`: boolean - Theme mode
- `isPlus`: boolean - Whether it's iPhone 17 Plus (larger screen)

**Layout Structure:**
```
┌──────────────────┐
│  Status Bar      │ (12px or 14px spacing)
├──────────────────┤
│  PlayerHeader    │ (Player name, number, position)
├──────────────────┤
│  StatsOverview   │ (Fantasy score + key stats)
├──────────────────┤
│  ActionGrid      │ (4×4 action buttons)
├──────────────────┤
│  GameControls    │ (Summary, Edit Players buttons)
├──────────────────┤
│  Safe Area       │ (6px or 8px spacing)
└──────────────────┘
```

**State:**
- `stats`: Object containing player statistics
- `selectedQuarter`: number (1-4)
- `lastAction`: string | null (recent action timestamp)

---

### 2. PlayerHeader
**File:** `/components/PlayerHeader.tsx`

**Purpose:** Displays player identity with dramatic styling

**Props:**
- `name`: string - Player surname
- `number`: number - Jersey number
- `position`: string - Playing position (e.g., "MID")
- `darkMode`: boolean
- `isPlus`: boolean

**Visual Features:**
- **Large Opaque Number:** Massive jersey number in background (100px-120px)
  - Uses condensed fonts for impact
  - Semi-transparent (`text-white/10` or `text-slate-900/10`)
  - Positioned behind content
- **Share Button:** Top-right circular button with Share2 icon
- **Player Name:** Large bold text (20px-24px)
- **Position Badge:** Small secondary text

**Design Pattern:**
- Layered design with z-index positioning
- Background number creates depth
- Minimalist top navigation

---

### 3. StatsOverview
**File:** `/components/StatsOverview.tsx`

**Purpose:** Primary stats card with swipeable views

**Props:**
- `stats`: Object with all player statistics
- `selectedQuarter`: number
- `onQuarterChange`: function
- `darkMode`: boolean
- `isPlus`: boolean

**Features:**

#### Fantasy Score Card (Bright Green)
- **Background:** `#00FF87` with shadow
- **Main Score:** Large fantasy points number (40px-50px)
- **Goals & Behinds:** Side-by-side G/B counters
- **Swipeable Content:** Two views accessible by swipe or dot navigation

#### View 1: Core Stats Grid
Displays 5 key stats in a row:
- **DS** (Disposals) - Green dot indicator
- **K** (Kicks) - Blue dot indicator
- **HB** (Handballs) - Amber dot indicator
- **M** (Marks) - Green dot indicator
- **T** (Tackles) - Red dot indicator

Each stat:
- Large white number (36px-40px)
- Colored glowing dot below
- Small label underneath

#### View 2: Touches Graph
- Line chart showing touches by quarter (Q1-Q4)
- Uses Recharts library
- Dark/light theme adaptive colors
- Interactive tooltips on touch

#### Quarter Selector
- 4 pill-shaped buttons (Q1-Q4)
- Active quarter highlighted
- Rounded container with gap spacing

**Interaction:**
- Swipe left/right to switch views
- Touch dots to jump to specific view
- Tap quarters to filter data

---

### 4. ActionGrid
**File:** `/components/ActionGrid.tsx`

**Purpose:** Main interaction area for recording player actions

**Props:**
- `lastAction`: string | null
- `onAction`: function (callback for stat recording)
- `darkMode`: boolean
- `isPlus`: boolean

**Layout:**
- **Header Bar:**
  - "RECORD ACTION" label
  - Last action timestamp (e.g., "HB @ 4:42")
  - Undo button (icon + text)

- **Stat Modifier Buttons (5 pills):**
  - GBG, CON, UC, EFF, IN-EFF
  - Dark background, light text
  - Horizontal row with rounded-full style

- **Action Grid (4×4):**
  - 16 colorful action buttons
  - Each button has unique color coding
  - Large label + small description
  - See StatButton component for details

**Action Types:**
```
K    HB   M    T     (Row 1)
G    B    FF   FA    (Row 2)
CL   I50  R50  HO    (Row 3)
TO   INT  1%   GA    (Row 4)
```

---

### 5. StatButton
**File:** `/components/StatButton.tsx`

**Purpose:** Individual action recording button with color coding

**Props:**
- `label`: string - Short code (e.g., "K", "HB")
- `full`: string - Full name (e.g., "Kick", "Handball")
- `color`: string - Hex color for border/text
- `onClick`: function
- `darkMode`: boolean

**Color Scheme:**
- K (Kick) - `#00D9FF` (Cyan)
- HB (Handball) - `#FF00FF` (Magenta)
- M (Mark) - `#FF6B00` (Orange)
- T (Tackle) - `#FF0080` (Pink)
- G (Goal) - `#00FF87` (Green)
- B (Behind) - `#FFD600` (Yellow)
- FF (Free For) - `#00FFFF` (Cyan)
- FA (Free Against) - `#FF3333` (Red)
- CL (Clearance) - `#8B00FF` (Purple)
- I50 (Inside 50) - `#00FFB3` (Teal)
- R50 (Rebound 50) - `#B3FF00` (Lime)
- HO (Hitout) - `#FF00B3` (Magenta)
- TO (Turnover) - `#9E9E9E` (Grey)
- INT (Intercept) - `#7D7D7D` (Dark Grey)
- 1% (1 Percenter) - `#B366FF` (Purple)
- GA (Goal Assist) - `#00B3FF` (Blue)

**Visual Design:**
- Square aspect ratio
- Colored border (0.5 opacity on color)
- Light background
- Large label on top
- Small description below
- Active scale animation (scale-95 on press)

---

### 6. GameControls
**File:** `/components/GameControls.tsx`

**Purpose:** Bottom action buttons

**Props:**
- `darkMode`: boolean
- `isPlus`: boolean

**Buttons:**
1. **Summary** - Opens game summary (left)
2. **Edit Players** - Modify player roster (right)

**Styling:**
- Dark background (slate-900 or white/10)
- White text
- Full width with gap
- Rounded corners
- Border in dark mode
- Hover/active states

---

## iPad Version Components

### 1. IPadTeamTracker (Main Container)
**File:** `/components/IPadTeamTracker.tsx`

**Purpose:** Team-level stat tracking for iPad landscape orientation

**Layout Structure:**
```
┌────────────────────────────────────────────────┐
│           GameHeader (Full Width)              │
├────────────────┬───────────────────┬───────────┤
│                │                   │           │
│  PlayerGrid    │  Quarter Selector │  Stats    │
│  (3-5 cols)    │  Action Recorder  │  Panel    │
│                │  Opponent Stats   │ (Collapse)│
│                │  Game Controls    │           │
└────────────────┴───────────────────┴───────────┘
```

**Grid System:**
- Responsive 3-column layout
- Collapsible right panel (340px)
- Smooth transitions (300ms duration)
- When collapsed: grid adjusts to 2 columns, player grid expands to 5 columns

**State:**
- `selectedPlayer`: number | null
- `selectedQuarter`: number (1-4)
- `lastAction`: string | null
- `isRightPanelCollapsed`: boolean

---

### 2. GameHeader
**File:** `/components/GameHeader.tsx`

**Purpose:** Shows current game state

**Props:**
- `homeTeam`: string
- `awayTeam`: string
- `homeScore`: number
- `awayScore`: number
- `timer`: string
- `darkMode`: boolean

**Layout:**
- **Left:** Home team name + score
- **Center:** Game timer in white rounded pill
- **Right:** Away team score + name
- Full width, centered content
- Background: light grey or semi-transparent white

---

### 3. PlayerGrid
**File:** `/components/PlayerGrid.tsx`

**Purpose:** Selectable grid of 25 players

**Props:**
- `selectedPlayer`: number | null
- `onSelectPlayer`: function
- `darkMode`: boolean
- `columns`: number (3 or 5) - Responsive to panel state
- `showNames`: boolean (optional) - Show player names

**Features:**
- **Grid Layout:** Dynamic columns (3 when panel open, 5 when collapsed)
- **Player Buttons:**
  - Number badge
  - Optional player name
  - Selected state: Bright green background (`#00FF87`)
  - Unselected: Light background with border
  - Square aspect ratio
  - Active scale animation
- **Player Names:**
  - Mock names (Smith, Jones, Williams, etc.)
  - Small text below number
  - Secondary color when not selected

**Visual States:**
- Selected: Green background, dark text, bold font
- Unselected: Light/transparent background, regular font
- Hover: Slight background color change

---

### 4. QuarterSelector
**File:** `/components/QuarterSelector.tsx`

**Purpose:** Select active quarter for stat tracking

**Props:**
- `selectedQuarter`: number
- `onSelectQuarter`: function
- `darkMode`: boolean

**Design:**
- 4 buttons in a row (Q1, Q2, Q3, Q4)
- Container: Light background with padding
- Active quarter: Bright green background
- Inactive: Transparent with grey text
- Centered layout
- Rounded corners

---

### 5. OpponentStats
**File:** `/components/OpponentStats.tsx`

**Purpose:** Quick view of opponent team statistics

**Props:**
- `darkMode`: boolean

**Features:**
- **Header:** "OPPONENT STATS" label
- **Stats Grid:** 4 key metrics
  - Total Disposals
  - Inside 50s
  - Marks
  - Tackles
- Each stat:
  - Large number
  - Small label
  - Light background card
  - Rounded corners

---

### 6. TeamStatsView
**File:** `/components/TeamStatsView.tsx`

**Purpose:** Collapsible right panel with team comparison

**Props:**
- `darkMode`: boolean

**Features:**
- **Tab Navigation:** Switch between views
  - Team Stats (comparison chart)
  - Recent Actions (timeline)

- **Team Stats View:**
  - Bar chart comparing home vs away
  - Multiple stat categories
  - Uses Recharts library
  - Color-coded bars (green vs grey)

- **Recent Actions View:**
  - Scrollable timeline
  - Player number + action + timestamp
  - Chronological order
  - Action type color coding

**Collapse Behavior:**
- Green circular button on left edge
- ChevronLeft/Right icon
- Smooth width transition
- PlayerGrid expands when collapsed

---

## Shared Components

### StatCard
**File:** `/components/StatCard.tsx`

**Purpose:** Reusable card for displaying stats

**Props:**
- `label`: string
- `value`: number
- `color`: string (color theme)
- `darkMode`: boolean

---

## Component Interaction Flow

### iPhone Flow
1. User opens app → `StatTracker` loads
2. `PlayerHeader` shows player identity
3. `StatsOverview` displays current stats
4. User taps action button in `ActionGrid`
5. `onAction` callback fires → updates stats
6. `lastAction` updates with timestamp
7. Stats reflect in `StatsOverview`
8. User can swipe card to see graph
9. Change quarter via selector
10. Access summary via `GameControls`

### iPad Flow
1. User opens app → `IPadTeamTracker` loads
2. `GameHeader` shows match state
3. User selects player from `PlayerGrid`
4. Player number highlighted in green
5. `QuarterSelector` shows active quarter
6. User selects stat modifier if needed
7. Taps action button → records to selected player
8. `lastAction` shows recent entry with undo option
9. Right panel shows team stats/recent actions
10. Panel can be collapsed for more player grid space

---

## Responsive Behavior

### iPhone Scaling
- **isPlus prop:** Controls sizing throughout
- Font sizes increase ~10-15% on Plus
- Padding/spacing increases slightly
- Status bar space adjusted (12px vs 14px)
- Safe area bottom space (6px vs 8px)

### iPad Adaptivity
- **Panel Collapse:**
  - Open: 3-column layout, 3-col player grid
  - Closed: 2-column layout, 5-col player grid
- **Dynamic Grid:** Player grid uses CSS Grid with `grid-cols-[n]`
- **Transition:** All layout changes animated (300ms ease)

---

## Dark Mode Implementation

### Theming Strategy
- Every component accepts `darkMode` prop
- Conditional classes using ternary operators
- Background colors:
  - Light: `bg-white`, `bg-slate-100`
  - Dark: `bg-[#0A1628]`, `bg-white/10`
- Text colors:
  - Light: `text-slate-900`, `text-slate-600`
  - Dark: `text-white`, `text-slate-400`
- Borders:
  - Light: `border-slate-200`
  - Dark: `border-white/20`

### Accent Color
- `#00FF87` (bright green) used consistently across both themes
- Provides high contrast in both modes
- Used for: selected states, primary buttons, highlights

---

## Animation & Interactions

### Touch Feedback
- **Active State:** `active:scale-95` on all buttons
- **Transition:** `transition-all` or `transition-transform`
- **Duration:** Default ~200ms

### Panel Transitions
- **Grid Layout:** `transition-all duration-300`
- **Width Changes:** Smooth collapse/expand
- **Opacity:** Fade in/out for conditional content

### Swipe Gestures (iPhone)
- Touch event listeners on `StatsOverview`
- Minimum swipe distance: 50px
- Transform-based animation (translateX)
- Duration: 300ms ease-out

---

## Data Structure

### Player Stats Object
```typescript
{
  disposals: number,    // Total touches
  kicks: number,        // Kicks
  handballs: number,    // Handballs
  marks: number,        // Marks
  tackles: number,      // Tackles
  afScore: number,      // Fantasy score
  goals: number,        // Goals
  behinds: number       // Behinds
}
```

### Action Types
16 distinct action types, each with:
- `id`: unique identifier
- `label`: short code (1-3 chars)
- `full`: full name
- `color`: hex color code

---

## Key Design Decisions

### Why No Scrolling?
- **UX Priority:** All critical info visible at once
- **Touch Optimization:** Reduces navigation time during games
- **Focus:** Users can record stats without losing context
- **Screen Efficiency:** Maximizes use of available space

### Why Bright Green Accent?
- **High Contrast:** Visible in all lighting conditions
- **Sport Association:** Green commonly used in AFL/sports
- **Energy:** Conveys action and urgency
- **Accessibility:** Stands out against dark navy

### Why Collapsible Panel (iPad)?
- **Flexibility:** Users choose between more players or more stats
- **Space Optimization:** Not all users need team stats constantly
- **Progressive Disclosure:** Advanced info available when needed
- **Adaptivity:** Accommodates different use cases (single-player focus vs team comparison)

---

## File Organization

```
/components/
  ├── ActionGrid.tsx           # iPhone action buttons
  ├── DeviceDemo.tsx           # Multi-device preview wrapper
  ├── GameControls.tsx         # iPhone bottom buttons
  ├── GameHeader.tsx           # iPad game state header
  ├── IPadTeamTracker.tsx      # iPad main container
  ├── OpponentStats.tsx        # iPad opponent quick stats
  ├── PlayerGrid.tsx           # iPad player selection grid
  ├── PlayerHeader.tsx         # iPhone player identity
  ├── QuarterSelector.tsx      # iPad quarter buttons
  ├── StatButton.tsx           # Individual action button
  ├── StatCard.tsx             # Reusable stat display card
  ├── StatTracker.tsx          # iPhone main container
  ├── StatsOverview.tsx        # iPhone fantasy card + stats
  └── TeamStatsView.tsx        # iPad collapsible panel content
```

---

## Future Considerations

### Potential Enhancements
- Real-time data sync with backend
- Player photo integration
- Historical game data
- Export/share functionality
- Multiple team management
- Advanced analytics views
- Customizable color themes
- Accessibility improvements (VoiceOver support)
- Landscape iPhone support
- Portrait iPad support

### Performance Notes
- Uses React hooks for state management
- Recharts for data visualization (lazy loaded)
- Minimal re-renders through proper prop usage
- No external state management library (keeps bundle small)
- CSS-in-JS avoided (uses Tailwind for performance)

---

## Browser/Device Compatibility

### Target Devices
- iPhone 17 (6.1" - 393×852) - iOS 18+
- iPhone 17 Plus (6.7" - 430×932) - iOS 18+
- iPad Pro 11" (1194×834 landscape) - iPadOS 18+

### Browser Support
- Safari (primary)
- Chrome (secondary)
- Modern browsers with ES2020+ support

### Required Features
- Touch events
- CSS Grid
- Flexbox
- SVG support
- CSS transforms & transitions

---

## Accessibility

### Current Implementation
- Semantic HTML structure
- ARIA labels on interactive elements
- Sufficient color contrast (WCAG AA)
- Touch targets >44×44px
- Keyboard navigation support (button elements)

### Areas for Improvement
- Screen reader optimization
- Focus indicators
- Reduced motion support
- High contrast mode
- Text scaling support

---

## License & Attribution
See `/Attributions.md` for third-party library credits.

---

**Last Updated:** December 2024
**Version:** 1.0
**Maintained By:** Development Team
