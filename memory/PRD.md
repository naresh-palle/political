# Leader's Lens — Political Intelligence Platform

## Original Problem Statement
Redesign the existing Antigravity-built political intelligence platform
(https://github.com/naresh-palle/political) into a premium executive-grade product
without rebuilding functionality. User later asked for a brighter, richer premium
look (28 Aug 2026).

## Architecture
- **Frontend**: Vite 6 + React 19 + TypeScript, Tailwind CSS v4, Framer Motion,
  Lucide. Runs on port 3000 via supervisor (`yarn start`).
- **Data**: Fully client-side mock services (no backend dependency).
- **Modules preserved**: Pitch/Audit, Grievance CRM, Volunteers, Web Studio, RBAC.

## Design System (Bright Premium — 28 Aug 2026)
- **Hero surface**: Deep navy `#0B1A2C` → `#0E2137` with radial saffron/gold
  washes, subtle SVG-turbulence grain overlay, faint horizontal hairline rhythm.
- **Accent colors**: Brass gold `#D4A24C`, saffron `#E07A1F`, editorial cream
  `#F5EFE0`, emerald pulse `#10B981`, crimson `#B0203C` (semantic).
- **Typography**: Instrument Serif (display up to 124px) with italic gold
  emphasis words; Geist sans body; JetBrains Mono for data.
- **CTA**: Gradient saffron→gold with warm shadow glow.
- **Navbar**: Dark navy sticky bar, gradient brand mark tile with emerald
  live-pulse dot, gold active-state pill.
- **Content pages**: Retain ivory canvas with editorial hierarchy; audit header
  now has a saffron→gold→emerald rainbow top rule and gradient export CTA.

## What's Been Implemented
- Migrated GitHub repo into `/app/frontend` (Vite+TS+Tailwind v4).
- Wired supervisor to run Vite on port 3000.
- Two design passes: v1 quiet-editorial, v2 bright-premium (current).
- LocationSelector recomposed twice, seeded initial state.
- Navbar re-themed dark with gradient brand mark.
- AuditHeader accent rule + gradient export CTA.
- `data-testid` on all key interactive elements.

## Key Files
- `/app/frontend/index.html` — fonts (Instrument Serif, Geist, Newsreader, Mono)
- `/app/frontend/src/index.css` — tokens, hero-dark surface, motion, focus rings
- `/app/frontend/src/components/pitch/LocationSelector.tsx`
- `/app/frontend/src/components/layout/Navbar.tsx`
- `/app/frontend/src/components/audit/AuditHeader.tsx`
- `/app/frontend/src/components/audit/AuditNav.tsx`
- `/app/frontend/src/components/audit/OverviewSection.tsx`

## Prioritised Backlog
- Convert candidate & platform cards to the new bright accent palette.
- ReachGap and VoterReach hero visualisations with saffron→gold bars.
- Grievance filter/table redesign with gold status pills.
- Chart entrance animations via Framer Motion.
