
# PORTAL_DASHBOARD_SPEC.md
KickChasers Web Portal — Dashboard Specification

This document defines the structure of the KickChasers web portal dashboard.
The dashboard should feel like a professional sports analytics platform similar to
Hudl, Strava, and modern SaaS dashboards.

The dashboard is the **first screen users see after login**.

Its purpose is to surface:
- pending actions
- recent performance data
- squad activity
- quick navigation shortcuts

The dashboard should prioritize **actionable information** rather than generic metrics.

---

# Layout System

Use a **12‑column responsive grid**.

Typical layout:

Row 1
Pending Actions | Recent Games

Row 2
My Squads | Leaderboard Snapshot

Row 3
Recent Squad Activity

Cards should be **consistent with PortalCard component**.

---

# Section 1 — Pending Actions

Purpose:
Highlight tasks requiring the user's attention.

Examples:

• Squad join requests  
• Squad invites  
• Role requests  
• Guest merge requests  

Card layout:

Title: "Pending Actions"

List format:

Request type  
User / squad  
Time

Action buttons:

Accept  
Decline  
View

Limit to **5 most recent items**.

---

# Section 2 — Recent Games

Purpose:
Quick access to the latest games.

Fields:

Game date  
Teams  
Final score  

Action:

View summary

Limit to **5 recent games**.

---

# Section 3 — My Squads

Purpose:
Quick links to squads the user manages or belongs to.

Card layout:

Squad logo  
Squad name  
Role badge  

Action:

Open squad

Limit to **6 squads**.

---

# Section 4 — Leaderboard Snapshot

Purpose:
Surface key performance leaders.

Display:

Top 5 players by:

• Goals  
• Disposals  
• Tackles  

Columns:

Rank  
Player  
Squad  
Stat value

Include button:

View full leaderboard

---

# Section 5 — Squad Activity

Purpose:
Show recent squad changes.

Examples:

• Player joined squad  
• Player removed  
• Squad created  
• Squad branding updated  

Display as timeline list.

Limit to **10 events**.

---

# Dashboard Visual Rules

Cards must follow KickChasers design language:

Rounded corners  
Subtle borders  
Dark surfaces  

Accent color: #39FF88

Use stat pills and badge indicators where possible.

---

# Animation Guidelines

Use subtle animations:

Card hover lift  
Stat number fade-in  
Row hover highlight  

Avoid heavy transitions.

---

# Future Dashboard Widgets (Optional)

Later versions of the dashboard can include:

• Performance trend charts  
• Player development graphs  
• Squad comparison metrics  
• Season progress indicators  

These should not delay the initial portal launch.

