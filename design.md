# TekPanel Design System (Vibe Design)

This is the central design system manifest for the TekPanel Android Inbox. It strictly adheres to the "Anti-Slop" rules.

## 1. Core Principles
- **Mobile-First Inbox:** Optimized for 390px Android WebViews. No horizontal overflow.
- **Anti-Slop:** NO purple gradients, NO glassy orb backgrounds, NO bokeh blobs, NO random glow effects.
- **Dense & Readable:** Prefer dense, readable message rows over oversized generic SaaS floating cards.
- **Quiet Empty States:** Empty states should be short and unobtrusive.
- **Platform Identity:** Use source application colors (WhatsApp Green, IG Gradient, etc.) purely as accents/badges, not as huge decorative backgrounds.

## 2. Color Palette (Dark Mode Optimized)
We rely on a high-contrast dark theme suitable for outdoor mobile use.

- **Background:** `#05070A` (Deep dark, matches existing base but cleaned up)
- **Surface (Rows/Panels):** `#10131a` 
- **Borders/Separators:** `rgba(255,255,255,0.08)` - Native feeling separators.
- **Foreground (Text):** 
  - Primary: `#ffffff`
  - Secondary: `rgba(255,255,255,0.6)`
  - Muted: `rgba(255,255,255,0.4)`

## 3. Typography
- **Font Family:** Inter or system sans-serif.
- **Scale:**
  - Header: `18px`, Font Weight: `700` (No oversized hero typography).
  - Body Primary: `15px` or `14px`, Font Weight: `500`.
  - Body Secondary/Metadata: `13px` or `12px`, Font Weight: `400` or `500`.
- **Text Truncation:** Must be intentional (`truncate` or `line-clamp-2` for messages).

## 4. Spacing & Layout
- **Touch Targets:** Minimum `44px` height for all interactive elements (buttons, toggles, row clicks).
- **Padding:** 
  - Screen Edge: `16px` horizontally.
  - Row Padding: `12px 16px` or `16px 16px`.
- **Border Radius:**
  - `0px` or very subtle `4px` for rows (to mimic native Android list items).
  - `16px` for modal bottom sheets / panels.
  - `8px` or `12px` for small chips/badges.

## 5. Shadows & Depth
- **Strict Rule:** Avoid fake depth from heavy shadows. Use `border-bottom` or subtle background color changes (e.g., active state `rgba(255,255,255,0.04)`) to indicate depth/separation.

## 6. Components
- **Top App Bar:** Fixed top. Minimal height. Shows App Name, Inbox Count, Clear Action, and Settings Action.
- **Message Row:**
  - Left: Sender Name (15px bold).
  - Right: Timestamp (12px muted).
  - Below: Source Badge (small pill) + Message snippet (line-clamp-2, 14px secondary).
- **Channel Toggle Panel:** Bottom sheet or full screen overlay. Dense list of switch toggles.
