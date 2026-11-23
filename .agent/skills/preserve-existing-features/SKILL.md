---
name: preserve-existing-features
description: >-
  MANDATORY: Preserve all existing features, data displays, filters, rankings, metrics,
  and workflows across all roles and screens. Under NO circumstances may an existing feature,
  table, metric, column, button, or view be deleted, removed, disabled, or broken unless
  the user EXPLICITLY issues an unambiguous command to remove it.
---

# Preserve Existing Features Policy

## Core Invariant: Zero Unauthorized Feature Removal

You do **NOT** have the authority or permission to remove, delete, strip out, or hide any existing feature, view, metric, table, card, filter, or input unless the user explicitly and specifically instructs you to delete or remove it.

### Rules of Engagement:

1. **Non-Destructive Modifications Only**:
   - Whenever addressing a bug, fixing an issue, or adding a new capability, you MUST preserve all existing functioning code, components, views, metrics, and data flows.
   - Never replace an existing rich view or table with a reduced summary or card view unless explicitly requested.
   - When adding support for new categories, states, or roles, all previously supported categories, states, and roles MUST remain fully functional.

2. **No Silent Regressions**:
   - Never delete fields, columns, badges, rankings, or calculation helpers during a refactoring turn.
   - When fixing an issue for one persona (e.g. SMM, SMA, Admin, Officer), ensure that no features belonging to that persona or other personas are omitted.

3. **Explicit Removal Authorization Only**:
   - The only time a feature, section, or button may be removed is when the user gives an explicit, unequivocal statement such as: *"Remove X section"*, *"Delete Y button"*, or *"We removed these sections, do not add them"*.
   - Never infer or extrapolate that the user wants to remove an existing feature just because they asked to focus on or inspect something else.

4. **Verification Requirement**:
   - Before completing any task, verify that all existing views, leader details, metrics, and comparisons still render properly and are not broken by the changes.
