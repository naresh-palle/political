---
name: confirm-before-change
description: >-
  REQUIRED before any new product, UI, role, routing, or data change on this
  website. Check prior requirements, ask the user before coding, and keep every
  section and every user role correct. Use on every new request, not only
  Political Intelligence or SM A.
---

# Confirm before changing any section or any user

This skill applies to **the whole website** and **every user**, not one module and not SM A/SM M only.

Covered users include: public visitor, login, admin, political admin, manager, volunteer, officer, complainant, SM A, SM M, and any role added later.

Covered surfaces include: top menu, every dashboard, tickets, assign, contacts, grievances, volunteers, Web Studio (hidden), user management, auth/profile, PDFs, officer portal, Political Intelligence, and any screen added later.

## Before you write code

1. Read this skill, then the latest user message, then earlier messages in this conversation that set requirements.
2. List the **already decided** rules that the new request might touch (who sees a tab, what a screen contains, what stays hidden, labels, layout).
3. If anything is unclear, **stop and ask**. Do not guess. Do not implement first and correct later.

Ask when any of these is true:

- The request does not name **which users** it applies to.
- The request does not name **which screens/sections** it applies to.
- It would **add**, **remove**, **hide**, **show**, or **move** a tab, button, field, or module.
- It would **undo** a requirement already given in this conversation or a recent commit.
- A screenshot is attached and you are about to copy it onto roles or pages the user did not name.
- “Match this” / “verify this” could mean layout-only, data-only, or a new feature.

Ask short, concrete questions. Typical set:

- Which users? (admin / political admin / manager / volunteer / officer / SM A / SM M / all)
- Which screens?
- Add, hide, or remove?
- Leave other roles as they are?

Do **not** proceed until the user answers, except when the message already names the users, the screens, and the action clearly.

## Do not create extra work

- Implement **only** what the user confirmed.
- Do not add a tab, filter, ranking block, or “matching” feature to a role that was not asked to have it.
- Do not reverse a recent decision (example: user said a module is not for a role; do not put it back because a screenshot showed it).
- Do not expand “verify this screen” into rebuilding other roles.

## After a confirmed change

Before you call the work done, check that **other sections and other users** still match their last confirmed requirements:

- Nav items per role are unchanged unless the user asked to change them.
- Hidden options stay hidden (example: Web Studio stays off the admin menu until the user asks to restore it).
- Fields, labels, and actions on untouched screens still exist and still align.
- Laptop, desktop, tablet, iPad, and mobile still show the same information (`.cursor/skills/cross-device-ui-parity/SKILL.md`).

If a change to one role would leak into another role’s menu or form, stop and ask.

## Failure examples

- User asked to check whether SM A and SM M match an Intelligence screenshot → agent added Intelligence to SM A. Wrong: SM A was data entry only; ask first.
- User asked to restyle one page → agent restyled every role’s page. Wrong: ask which users.
- User asked to hide one menu item for admin → agent deleted it for everyone. Wrong: ask which users.
