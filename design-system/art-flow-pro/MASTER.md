# Art Flow Pro design system

Status: implemented in `static/style.css` and verified in the running private
technical preview on 2026-08-08. Naming and public-release clearance remain
pending.

## Design intent

Art Flow Pro is a focused creative workstation, not a marketing site. Its visual
language combines obsidian work surfaces, restrained liquid-glass chrome, an icy
blue action color, and editorial typography. Decoration must never reduce canvas
space, legibility, or input precision.

Design dials:

- Visual variance: 5/10 — recognizable but disciplined.
- Motion: 3/10 — short state transitions; no ornamental sequences.
- Density: 7/10 — professional desktop tooling with 44px interaction targets.
- Corners: 9px to 26px, with pill controls where grouping benefits.

## Core tokens

| Role | Dark | Light | Source token |
| --- | --- | --- | --- |
| App background | `#07090b` | `#e9eef1` | `--bg` |
| Raised surface | `#11161b` | `#ffffff` | `--bg-2` |
| Primary accent | `#69bdff` | `#005fbd` | `--accent` |
| Filled action | `#006bd6` | `#006bd6` | `--accent-fill` |
| Primary text | `#eaf1f4` | `#0f1619` | `--text` |
| Destructive | `#ff7a8a` | `#d23f54` | `--danger` |

Glass surfaces use `--glass-fill`, `--glass-sheen`, a one-pixel border, and a
20px backdrop blur. When reduced transparency is requested, the application
switches to opaque surfaces and removes blur.

Typography:

- Display and product naming: Fraunces, with Georgia as the local fallback.
- Interface and documents: Hanken Grotesk, then the system UI stack.
- Measurements and identifiers: the system monospace stack.

The two web fonts are requested from Google Fonts; their OFL notices are recorded
in `THIRD_PARTY_NOTICES.md`.

## Layout rules

- At widths above 1366px, the editor uses rail + left dock + stage + right dock.
- At 1366px and below, the stage gets priority and both docks become labeled,
  focus-managed drawers.
- At 720px and below, the rail becomes bottom navigation, AI starts collapsed,
  and drawers become bottom sheets.
- At 520px and below, the header keeps Back, a truncated document title, a
  status dot, Export, and a visible Save action. Settings moves to the bottom
  rail so functionality is not lost.
- Resume preview is an A4-proportioned white document within the darker editing
  shell and is isolated for print output.

## Component behavior

- Primary buttons use the blue filled action token and retain visible focus.
- Secondary buttons use translucent fields with a one-pixel boundary.
- Project cards have separate semantic Open and Delete controls.
- Editor panels communicate loading, empty, error, dirty, saving, and saved
  states in place.
- Dialogs use native `dialog` semantics, a clear title, explicit actions, and
  focus restoration.
- AI and publication actions disclose external processing or public sharing
  before consequential work.
- All icons come from the repository's inline SVG sprite; emoji are not used as
  interface icons.

## Accessibility and interaction constraints

- Interactive targets are at least 44px in both dimensions where layout allows.
- Keyboard focus uses a two-pixel accent outline and must never be removed.
- Text inputs preserve native undo; application undo applies only to the canvas.
- `hidden` is authoritative and may not be overridden by component display rules.
- Semantic labels, live regions, and `aria-expanded` communicate dynamic state.
- Reduced motion, reduced transparency, forced colors, safe-area insets, and
  keyboard navigation are supported.
- Aim for WCAG AA contrast; do not place low-opacity text on moving or detailed
  imagery.

## Motion

Use the existing 140ms, 220ms, and 420ms timing tokens. Motion may clarify hover,
focus, drawer, dialog, and save-state changes. It must not gate content or cause
layout shifts. `prefers-reduced-motion` reduces animations to effectively zero.

## Do not introduce

- Additional accent hues without a functional status role.
- Colored glows, bouncing controls, parallax, or scroll-reveal dependencies.
- Framework-specific component libraries unless the application stack changes
  through a reviewed architecture decision.
- Hidden mobile functionality, hover-only actions, or unlabeled icon buttons.
- Public badges, claims, or brand marks until the release and naming gates in
  `docs/RIGHTS_AND_RELEASE_STATUS.md` are resolved.

## Delivery checklist

- Validate at 390x844, 844x390, 1280x720, and 1440x900 or larger.
- Exercise both Tools and Properties drawers, chat launcher, Save, and Settings.
- Confirm project save/reload and resume preview/print behavior.
- Check focus order, visible focus, reduced motion, and light/dark contrast.
- Capture only real running-product screenshots with synthetic data.
