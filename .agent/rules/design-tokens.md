---
trigger: always_on
---

# Agent Rule: Comprehensive Design System & Multi-Dimensional Tokens Policy

## 🎯 Objective & Governance

This document establishes the mandatory rules for using design system tokens in **Botica Ya**. All UI components, screens, templates, and styles must strictly consume CSS-First tokens defined in [`src/index.css`](../../src/index.css).

---

## 📐 Core Token Dimensions

### 1. Color Palette (OKLCH & Hex Theme Variables)

Never use arbitrary Tailwind palette colors (e.g. `bg-green-500`, `text-slate-800`, `border-gray-200`). Always use semantic tokens:

| Semantic Token                    | Purpose / Context                                                                           |
| :-------------------------------- | :------------------------------------------------------------------------------------------ |
| `bg-primary` / `text-primary`     | Botica Ya brand pharmaceutical green (`#1B8A5A`) (actions, CTAs, highlights, active states) |
| `bg-primary-hover`                | Darkened interaction state (`#156E48`)                                                      |
| `text-primary-contrast`           | High-contrast text on primary actions (`#FFFFFF`)                                           |
| `bg-primary-surface`              | Derived accent surface for featured cards, badges, banners (`#E3F5EC`)                      |
| `text-primary-surface-text`       | High-legibility dark text on primary surface (`#13613F`)                                    |
| `bg-secondary` / `text-secondary` | Trust & Health blue (secondary actions, informational elements)                             |
| `bg-bg-app`                       | Canvas / application main background (`#F4F6F5`)                                            |
| `bg-surface` / `bg-surface-hover` | Cards, modals, sheets, popovers, dropdown containers (`#FFFFFF`)                            |
| `text-text-main`                  | Primary high-contrast typography (`#0F172A`) (WCAG AAA compliant)                           |
| `text-text-muted`                 | Secondary / muted typography (`#64748B`) (captions, placeholders, metadata)                 |
| `border-border`                   | Structural dividers, card borders, input borders (`#E2E8F0`)                                |
| `outline-focus-ring`              | Keyboard focus ring for a11y compliance                                                     |
| `text-success` / `bg-success`     | Success confirmations and positive status                                                   |
| `text-warning` / `bg-warning`     | Alerts, stock warnings, pending notices                                                     |
| `text-error` / `bg-error`         | Validation errors, critical notices, destructive actions                                    |
| `text-info` / `bg-info`           | Informational callouts and guidance hints                                                   |

### 2. Spacing & Container Width Scale (8px Grid Alignment)

- Use standard Tailwind numeric spacing for strict 8px grid alignment:
  - `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px), `p-10` (40px), `p-12` (48px), `p-16` (64px).
- **Tailwind v4 Rule:** NEVER define `--spacing-2xl` or `--spacing-3xl` in `@theme` as this overrides the universal `max-w-*` scale, causing containers to collapse to tiny pixel widths.
- Container widths: `max-w-md` (448px), `max-w-lg` (512px), `max-w-xl` (576px), `max-w-2xl` (672px), `max-w-3xl` (768px), `max-w-4xl` (896px), `max-w-5xl` (1024px), `max-w-6xl` (1152px), `max-w-7xl` (1280px).

### 3. Border Radii Scale

| Token                 | Value      | Pixel Equivalent | Target Element                          |
| :-------------------- | :--------- | :--------------- | :-------------------------------------- |
| `rounded-radius-xs`   | `0.25rem`  | `4px`            | Badges, tags, checkboxes                |
| `rounded-radius-sm`   | `0.375rem` | `6px`            | Input fields, small buttons             |
| `rounded-radius-md`   | `0.5rem`   | `8px`            | Standard cards, modals, dropdown panels |
| `rounded-radius-lg`   | `0.75rem`  | `12px`           | Featured cards, promotion banners       |
| `rounded-radius-xl`   | `1rem`     | `16px`           | Large dialogs, bottom sheets            |
| `rounded-radius-full` | `9999px`   | Circular         | Pills, avatars, circular icon buttons   |

### 4. Motion & Animation Durations

| Token             | Value   | Target Interaction                                      |
| :---------------- | :------ | :------------------------------------------------------ |
| `duration-fast`   | `150ms` | Hover states, color shifts, button presses              |
| `duration-normal` | `250ms` | Modal transitions, accordion toggles, dropdown openings |
| `duration-slow`   | `350ms` | Full-page transitions, drawer slides                    |

### 5. Depth & Shadows (Elevation)

| Token             | Description                                                |
| :---------------- | :--------------------------------------------------------- |
| `shadow-subtle`   | Very light border-depth elevation (table rows, flat cards) |
| `shadow-card`     | Standard card elevation and hover states                   |
| `shadow-floating` | Floating action buttons, tooltips, popovers                |
| `shadow-overlay`  | Modals, dialogs, drawers                                   |

### 6. Z-Index Layer Hierarchy

Never write arbitrary z-index utilities like `z-[999]`. Use predefined tokens:

- `z-sticky` (20): Sticky headers, floating filter bars
- `z-dropdown` (30): Dropdowns, select menus
- `z-drawer` (40): Navigation drawers, side sheets
- `z-modal` (50): Dialogs, modal overlays
- `z-toast` (60): Notifications, toasts, snackbars
- `z-tooltip` (70): Contextual tooltips

---

## 🏛️ Architectural Boundaries & Single Responsibility

1. **Global Organisms (`src/components/ui/organisms/`):**
   - Global navigation components (e.g. `Header.component.tsx`, `Footer.component.tsx`) shared across the entire application.
2. **Layout Templates (`src/layouts/`):**
   - Page shell structures (e.g. `MainLayout.layout.tsx`) that wrap global organisms and render dynamic page children (`<main>{children}</main>`).
3. **Feature Modules (`src/features/feature-name/`):**
   - Isolated domain logic, feature components (e.g. `HeroSection.component.tsx`), and screens (e.g. `Landing.screen.tsx`).
   - Do NOT put global navigation elements inside feature-specific component folders.

---

## 🚫 Enforcement Rules (Zero Exceptions)

1. **NO Hardcoded Palette Colors:**
   - ❌ `bg-green-500`, `text-slate-900`, `border-zinc-300`, `bg-[#10b981]`
   - ✅ `bg-primary`, `text-text-main`, `border-border`
2. **Native Dark Mode Support:**
   - Components MUST naturally support dark mode through semantic tokens (`bg-surface`, `bg-bg-app`, `text-text-main`, `text-text-muted`, `border-border`).
   - Do NOT add ad-hoc `dark:bg-black` or `dark:text-white` when semantic tokens already handle luminance shifts.
3. **Accessibility Focus Rings (a11y):**
   - Every interactive element (buttons, cards, links, inputs) MUST maintain `:focus-visible` ring behavior using `outline: 2px solid var(--color-focus-ring)`.
4. **Spacing Rhythm Compliance:**
   - Margins, paddings, and gaps MUST strictly adhere to the 8px grid (`p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`).

---

## 💡 Code Comparison Examples

### ❌ Incorrect (Hardcoded & Fragile)

```tsx
// Anti-pattern: Hardcoded arbitrary Tailwind classes, breaking theme and a11y
<button className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg duration-300 shadow-lg">
  Comprar Ahora
</button>
```

### ✅ Correct (Tokenized & Semantic)

```tsx
// Compliant: Tokenized semantic utilities, dark-mode native, 8px grid aligned
<button className="bg-primary text-primary-contrast hover:bg-primary-hover px-6 py-3 rounded-radius-md transition-all duration-fast shadow-card focus-visible:outline-2 focus-visible:outline-focus-ring">
  Comprar Ahora
</button>
```
