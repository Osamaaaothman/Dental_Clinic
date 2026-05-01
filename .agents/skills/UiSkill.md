---
name: clinic-ui-design-system
description: >
  Apply this skill whenever building, redesigning, or styling ANY UI component,
  page, screen, or layout for this project. This covers sidebars, navbars, dashboards,
  cards, tables, forms, modals, buttons, inputs, badges, and any other interface element.
  Use it even if the user just says "make this look good", "style this component",
  "redesign this page", or "build a new screen" — always apply this design system
  so every part of the app looks consistent with the dark clinic aesthetic.
---

# Clinic UI Design System

This skill defines the **complete visual language** for the dental clinic management app.
Every component — new or redesigned — must follow these rules exactly.
Do not invent new patterns. Extend existing ones.

---

## 1. Core Aesthetic

**Theme**: Dark, professional, medical-grade  
**Mood**: Trustworthy, modern, calm — not flashy  
**Direction**: Deep dark backgrounds with luminous accents, subtle grid texture, soft blue glow  
**Typography**: Arabic-first (`Cairo`), RTL layout (`direction: rtl`)

---

## 2. Fonts

Always import and use **Cairo** from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

font-family: 'Cairo', sans-serif;
```

| Use | Weight |
|-----|--------|
| Body / labels | 400 |
| Nav items, descriptions | 500 |
| Section titles, card values | 600 |
| Brand name, headings | 700 |
| Hero numbers, display | 800 |

---

## 3. Color Palette

### Backgrounds
| Token | Value | Use |
|-------|-------|-----|
| `--bg-base` | `#0c0e14` | Sidebar, panels, deep surfaces |
| `--bg-surface` | `#13161f` | Cards, modals, elevated panels |
| `--bg-raised` | `#1a1d28` | Hover states, inputs, nested cards |
| `--bg-overlay` | `rgba(255,255,255,0.04)` | Subtle hover fills |

### Borders
| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Dividers, section separators |
| `--border-default` | `rgba(255,255,255,0.09)` | Card borders, input borders |
| `--border-active` | `rgba(14,165,233,0.2)` | Active/focused elements |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `--text-primary` | `#f1f5f9` | Headings, important labels |
| `--text-secondary` | `rgba(255,255,255,0.55)` | Descriptions, meta |
| `--text-muted` | `rgba(255,255,255,0.25)` | Section labels, placeholders |
| `--text-active` | `#38bdf8` | Active nav items, links |

### Accent (Blue → Indigo gradient — the brand gradient)
```css
/* Use for: active states, logos, glows, CTAs, accent bars */
background: linear-gradient(135deg, #0ea5e9, #6366f1);
color: #38bdf8;          /* text on dark when active */
box-shadow: 0 0 18px rgba(14,165,233,0.3);   /* glow */
```

### Semantic Colors
| State | Background | Border | Text |
|-------|-----------|--------|------|
| Danger / Logout hover | `rgba(239,68,68,0.09)` | `rgba(239,68,68,0.14)` | `#f87171` |
| Warning | `rgba(234,179,8,0.09)` | `rgba(234,179,8,0.14)` | `#fbbf24` |
| Success | `rgba(34,197,94,0.09)` | `rgba(34,197,94,0.14)` | `#4ade80` |
| Info | `rgba(14,165,233,0.09)` | `rgba(14,165,233,0.14)` | `#38bdf8` |

---

## 4. Background Effects (apply to major panels/pages)

Every major surface (sidebar, main panel, page background) should have:

### Grid texture
```css
background-image:
  linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
background-size: 36px 36px;
```

### Blue glow blob (top-right corner of panels)
```css
/* via ::after pseudo-element */
position: absolute;
top: -60px;
right: -40px;
width: 220px;
height: 220px;
background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
pointer-events: none;
```

---

## 5. Spacing & Shape

| Token | Value |
|-------|-------|
| Border radius — small (badges, toggles) | `7–8px` |
| Border radius — default (items, inputs) | `11–12px` |
| Border radius — large (cards, modals) | `14–16px` |
| Border radius — logo/avatar | `13–14px` |
| Component padding | `10px 12px` |
| Card padding | `16px 20px` |
| Section gap | `16–20px` |
| Item gap | `3–4px` |

---

## 6. Component Patterns

### 6.1 Navigation Items (sidebar, tabs, menus)

```css
.item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 12px;
  color: rgba(255,255,255,0.42);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

/* Hover */
.item:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.8);
  border-color: rgba(255,255,255,0.07);
}

/* Active */
.item.active {
  background: linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.09));
  color: #38bdf8;
  border-color: rgba(14,165,233,0.18);
  font-weight: 600;
}

/* Active accent bar (RTL: right side) */
.item.active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 22%;
  height: 56%;
  width: 3px;
  border-radius: 4px 0 0 4px;
  background: linear-gradient(180deg, #0ea5e9, #6366f1);
  box-shadow: 0 0 8px rgba(14,165,233,0.6);
}

/* Disabled */
.item:disabled, .item[disabled] {
  opacity: 0.28;
  cursor: not-allowed;
  pointer-events: none;
}

/* Danger variant (logout, delete) */
.item.danger:hover {
  background: rgba(239,68,68,0.09);
  color: #f87171;
  border-color: rgba(239,68,68,0.14);
}
```

### 6.2 Cards

```css
.card {
  background: #13161f;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 16px 20px;
}

/* Metric / stat card */
.card-metric .value {
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
}
.card-metric .label {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}

/* Hover lift */
.card:hover {
  border-color: rgba(255,255,255,0.12);
  background: #1a1d28;
}
```

### 6.3 Buttons

```css
/* Primary */
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 0 16px rgba(14,165,233,0.25);
}
.btn-primary:hover { opacity: 0.88; }
.btn-primary:active { transform: scale(0.97); }

/* Ghost */
.btn-ghost {
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.9);
}

/* Danger */
.btn-danger {
  background: rgba(239,68,68,0.12);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover { background: rgba(239,68,68,0.2); }
```

### 6.4 Inputs & Form Fields

```css
.input {
  background: #1a1d28;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 10px;
  padding: 9px 14px;
  color: #f1f5f9;
  font-size: 13px;
  font-family: 'Cairo', sans-serif;
  direction: rtl;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
  outline: none;
}
.input::placeholder { color: rgba(255,255,255,0.22); }
.input:focus { border-color: rgba(14,165,233,0.4); }

/* Label above input */
.field-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
  display: block;
}
```

### 6.5 Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
}

.badge-info    { background: rgba(14,165,233,0.12);  color: #38bdf8;  border: 1px solid rgba(14,165,233,0.2); }
.badge-success { background: rgba(34,197,94,0.12);   color: #4ade80;  border: 1px solid rgba(34,197,94,0.2); }
.badge-warning { background: rgba(234,179,8,0.12);   color: #fbbf24;  border: 1px solid rgba(234,179,8,0.2); }
.badge-danger  { background: rgba(239,68,68,0.12);   color: #f87171;  border: 1px solid rgba(239,68,68,0.2); }
.badge-neutral { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.09); }
```

### 6.6 Tables

```css
.table { width: 100%; border-collapse: collapse; font-family: 'Cairo', sans-serif; direction: rtl; }

.table th {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  text-align: right;
}

.table td {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.table tr:hover td { background: rgba(255,255,255,0.03); }
```

### 6.7 Modals & Dialogs

```css
/* Overlay */
.modal-overlay {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
}

/* Panel */
.modal-panel {
  background: #13161f;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  line-height: 1.7;
  margin-bottom: 20px;
}
```

### 6.8 Section / Page Headers

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  direction: rtl;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  font-family: 'Cairo', sans-serif;
}

.page-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  margin-top: 2px;
}
```

### 6.9 Dividers & Section Labels

```css
.divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 12px 0;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.13em;
  color: rgba(255,255,255,0.22);
  text-transform: uppercase;
  margin-bottom: 6px;
  font-family: 'Cairo', sans-serif;
}
```

### 6.10 Logo / Avatar Elements

```css
.logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 18px rgba(14,165,233,0.3);
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(14,165,233,0.15);
  border: 1px solid rgba(14,165,233,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 700;
}
```

---

## 7. Icons

- Use inline SVG only — no icon libraries
- Size: `18–20px` for nav/action icons, `16px` for inline, `24px` for decorative
- Stroke: `stroke="currentColor"` `stroke-width="1.5"` `fill="none"`
- Always `stroke-linecap="round"` `stroke-linejoin="round"`

---

## 8. Motion & Transitions

| Element | Transition |
|---------|-----------|
| Nav items, buttons | `all 0.2s cubic-bezier(0.4,0,0.2,1)` |
| Sidebar collapse | `width 0.35s cubic-bezier(0.4,0,0.2,1)` |
| Label fade-out | `max-width 0.3s, opacity 0.2s` |
| Glow / shadow | `box-shadow 0.3s` |
| Scale on press | `transform: scale(0.97)` |

No bouncy springs. No dramatic delays. Transitions should feel instant but smooth.

---

## 9. Layout Rules

- **Direction**: Always `direction: rtl` on all containers
- **Layout**: Use flexbox for components, CSS Grid for page-level layouts
- **Page background**: Use `--bg-base` (`#0c0e14`) with grid texture + glow blob
- **Scrollbars**: Style or hide; never show default OS scrollbars on panels
- **Overflow**: Panels use `overflow: hidden` on root, `overflow-y: auto` on scroll regions

### Collapsed sidebar icon centering (important)
When a sidebar or nav collapses to icon-only mode:
```css
/* Collapsed item — icons must be perfectly centered */
.item.collapsed {
  justify-content: center;
  gap: 0;           /* remove gap so hidden label can't shift icon */
  padding: 10px 0;  /* no side padding */
}

/* Label during collapse */
.label {
  overflow: hidden;
  max-width: 200px;
  opacity: 1;
  flex-shrink: 0;
  transition: max-width 0.3s, opacity 0.2s;
}
.label.hidden {
  max-width: 0;
  opacity: 0;
  flex-shrink: 1; /* must release space */
}
```

---

## 10. React + Tailwind Notes

This project uses **React + Tailwind + DaisyUI**. When writing component code:

- Inject custom styles via `<style>{...}</style>` inside the component, or use a shared CSS file
- Use `className` not `class`
- Use `onClick` not `onclick`
- Prefer inline `style={{ }}` only for dynamic values (widths driven by JS state)
- Static design tokens go in the `<style>` block, not inline styles
- Always use `box-sizing: border-box` on elements with explicit widths

---

## 11. Quick Reference Checklist

Before finishing any component, verify:

- [ ] Font is `Cairo`, direction is `rtl`
- [ ] Background uses `#0c0e14` or `#13161f` (not white or gray)
- [ ] Active state uses blue→indigo gradient accent bar
- [ ] Borders are subtle: `rgba(255,255,255,0.06–0.09)`
- [ ] Text colors use the defined tokens (not hardcoded grays)
- [ ] Hover states have smooth `0.2s` transition
- [ ] Icons are inline SVG, `stroke="currentColor"`, `fill="none"`
- [ ] Collapsed icon-only mode: `gap:0`, `padding: 10px 0`, `justify-content: center`
- [ ] Danger actions (delete, logout) use red semantic color on hover only
- [ ] No white/light backgrounds anywhere
