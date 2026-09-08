---
name: cross-device-ui-parity
description: >-
  REQUIRED on every UI, layout, styling, routing, or rendered-data change.
  Laptop, desktop, tablet, iPad, and mobile must show the same information
  with the same alignment. Use whenever screens, components, tables, cards,
  modals, or dashboards change.
---

# Same alignment and same information on every screen

This applies to **every change**, not only “responsive” tasks. Laptop, desktop, tablet, iPad, and mobile must show the **same information** with the **same alignment**.

## Invariants

- **Same information.** Do not hide, drop, truncate-away, or relocate into an unopened menu any field, label, action, KPI, officer/contact identity, ticket number, status, or comment that other screens show. If desktop shows it, phone and tablet show it too.
- **Same alignment.** Section order, label/value pairing, and visual grouping stay consistent. Stacking columns on a narrow viewport is allowed only when every block remains, in the same order, with the same labels and values.
- **No device-only variants.** Do not ship a “mobile lite” layout, a desktop-only column, or breakpoint CSS that `hidden` / `sm:`-removes content. Utility classes that hide information below a breakpoint are forbidden unless the same control remains visible (for example an icon-only button that still performs the same action and still has an accessible name).
- **Same data.** Counts, names, phones, departments, ticket fields, and empty/error states must match across viewports. Do not compute or render a reduced dataset for small screens.

## Whenever you change anything

1. Treat laptop (~1280+), desktop (~1440+), tablet/iPad (~768–1024), and mobile (~375–430) as required surfaces, not optional extras.
2. After the edit, verify the changed flow on those widths (browser tools or the closest substitute). Check the main path, empty/error states, and any other route that reads the same state.
3. If alignment or information diverges, fix it before commit. Do not ship a desktop-only or mobile-only version of a screen.

## Failures that are not done

- A table that loses columns on mobile
- A card that omits officer, scheme, age/gender, or comments on phone
- A header/nav that drops actions that exist on desktop
- Overflow, overlap, or clipped text that hides values on one device
- Different copy, counts, or field labels by breakpoint
