# Leader's Lens — Political Intelligence Platform

## Original Problem Statement
Redesign the existing Antigravity-built political intelligence platform
(https://github.com/naresh-palle/political) into a premium executive-grade product
without rebuilding functionality. Add Home page, auth screen, brighter premium
look, boardroom Presentation Mode, live regional filter, compare constituencies,
public trust badges, speaker notes.

## Architecture
- **Frontend**: Vite 6 + React 19 + TypeScript, Tailwind CSS v4, Framer Motion,
  Lucide icons. Runs on port 3000 via supervisor (`yarn start`).
- **Data**: Client-side mock services (`src/services/api.ts` +
  `mockData.ts`) — no backend required. RBAC uses the five preset UserProfiles.
- **Route states in App.tsx**: `home` → `auth` → `app` (audit / grievances / volunteers / webbuilder / governance).

## Design System
- **Fonts**: Fraunces (display, SOFT/WONK variable axes tuned per size),
  IBM Plex Sans (body — government/trust feel), IBM Plex Mono (tabular data).
- **Hero surface**: Deep navy `#0B1A2C` with radial saffron/gold washes,
  turbulence-noise grain overlay, editorial hairline rhythm.
- **Accents**: brass gold `#D4A24C`, saffron `#E07A1F`, cream `#F5EFE0`,
  emerald pulse `#10B981`, crimson `#B0203C` (semantic).
- **CTAs**: saffron→gold gradient with warm shadow glow.

## What's Been Implemented (28 Aug 2026)

### Foundations
- Migrated GitHub repo into `/app/frontend` on Vite+TS+Tailwind v4.
- Supervisor wired to run Vite on port 3000.
- Typography upgraded to Fraunces + IBM Plex.
- Custom SVG logo (`LeadersLogo`) — serif L, gold arc, emerald pulse.

### Screens
- **Home** (`HomePage.tsx`): editorial hero, Live Regional Pulse (state filter),
  Compare Constituencies (A/B side-by-side with mini-stats), Modules band,
  Trust band with all four TrustBadge tones, closing CTA.
- **Auth** (`AuthScreen.tsx`): Google-styled CTA, email/password, RBAC role
  select, reduced hero size (48px lg).
- **Audit flow**: preserved existing 11 sections; LocationSelector re-composed,
  AuditHeader with saffron→gold→emerald rule + gradient Export CTA,
  AuditNav with underline treatment, OverviewSection with editorial KPI strip.
- **Presentation Mode**: full-screen dark boardroom, 6 slides, saffron→gold
  progress rail, animated transitions, speaker-notes side panel (togglable
  with N key), keyboard nav Arrow/F/N/Esc, gradient next button.

### Common components
- `LeadersLogo.tsx` — SVG editorial mark
- `TrustBadge.tsx` — VerifiedSeal + TrustBadge (Verified / Estimated / Derived / Manual / Live tones)

### `data-testid`s
Home: `home-enter-btn`, `home-primary-cta`, `home-secondary-cta`, `home-state-select`,
`compare-panel`, `compare-select-a`, `compare-select-b`, `trust-badge-*`.
Auth: `auth-card`, `tab-signin`, `tab-signup`, `google-signin-btn`, `email-input`,
`password-input`, `role-select`, `auth-submit-btn`.
Audit: `location-selector-panel`, `select-state/parliament/assembly`,
`constituency-preview`, `generate-audit-btn`, `chip-*`, `audit-nav`, `nav-section-*`,
`section-overview`, `export-report-btn`.
Presentation: `presentation-mode`, `presentation-exit`, `fullscreen-toggle`,
`notes-toggle`, `speaker-notes-panel`, `slide-prev`, `slide-next`, `slide-dot-*`.

## Prioritised Backlog
- Candidate cards: warm gold rim on client
- Reach Gap: hero-scale saffron bar visualization
- Grievance filter/table with gold status pills
- Chart entrance animations
- Grievance drawer panel on mobile

## Key Files
- `/app/frontend/index.html` — fonts
- `/app/frontend/src/index.css` — design tokens, hero-dark surface, motion
- `/app/frontend/src/App.tsx` — route + RBAC flow
- `/app/frontend/src/components/marketing/HomePage.tsx`
- `/app/frontend/src/components/auth/AuthScreen.tsx`
- `/app/frontend/src/components/audit/PresentationMode.tsx`
- `/app/frontend/src/components/common/LeadersLogo.tsx`
- `/app/frontend/src/components/common/TrustBadge.tsx`

## Personas (preserved)
Campaign Director · Candidate Executive · Field Strategist · Media Analyst · Volunteer Lead.
