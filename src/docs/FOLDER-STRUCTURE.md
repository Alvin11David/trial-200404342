# Jambo PMS — Frontend Folder Structure

> A Property Management System (PMS) for hotels, built with **React**, **TypeScript**, **Vite**, **Redux Toolkit**, **React Router**, **Tailwind CSS** and **shadcn/ui** components.

This document describes every folder inside `frontend/src` — its purpose, the kind of files it contains, and where new code should live.

---

## 1. Root & Config Level

| Path | Purpose |
|------|---------|
| `frontend/` | The entire frontend application (React + Vite SPA). |
| `frontend/node_modules/` | Installed third-party dependencies. **Never edit or commit this folder.** Recreated with `npm install`. |
| `frontend/package.json` | Defines project metadata, scripts (`dev`, `build`, `lint`, `typecheck`) and dependency list. |
| `frontend/vite.config.ts` | Vite build & dev-server configuration (plugins, path aliases, proxy). |
| `frontend/tsconfig.json` | TypeScript compiler configuration and IDE path resolution. |
| `frontend/index.html` | HTML entry point the bundler loads at runtime. |

---

## 2. `src/` — Application Source

The single entry directory for all hand-written code. Everything in the app lives under here.

### 2.1 Bootstrapping files

| File | Purpose |
|------|---------|
| `src/main.tsx` | Application bootstrap — mounts React onto the DOM, wires providers (store, router, theme). |
| `src/App.tsx` | Root React component. Defines the app shell and top-level routing/redirect logic. |

### 2.2 `src/app/`

**Purpose:** Application-level setup and global provider wiring.

Contains the code that configures how the whole app boots — thunk/store setup, global providers, and app-scoped bootstrap logic.

Example files:
- `store.ts` — Redux store creation and middleware setup.
- `Providers.tsx` — Composition of context/routing/theming providers around the tree.
- `index.css` — global styles imported at boot (if centralized here).

### 2.3 `src/assets/`

**Purpose:** Static binary/media resources bundled by Vite.

Any image, icon, font, or file the build imports as static assets. Vite optimizes and fingerprints these automatically.

Example files:
- `logo.png` / `Jambo-logo.webp` — brand/app logo used in the shell and auth screens.
- `fonts/` — custom typefaces.
- `icons/` — SVG icons.

### 2.4 `src/auth/`

**Purpose:** Authentication and session handling — the "logged out" side of the app.

Pages and logic for signing users in. Contains login UI and, by extension, any auth-related utilities.

Example files:
- `Login.tsx` — the sign-in screen (username/email + password form).
- `AuthProvider.tsx` — session context and token handling.
- `ProtectedRoute.tsx` — guards private routes from unauthenticated visitors.

### 2.5 `src/components/`

**Purpose:** Globally reusable UI components that are **not** scoped to one business feature.

| Sub-folder | Purpose |
|------------|---------|
| `components/ui/` | Headless, generic, presentational components — the **shadcn/ui** library (buttons, dialogs, tables, forms). Reusable everywhere, brand-agnostic. |
| `components/jambo/` | Brand-specific, higher-level building blocks built *on top of* the `ui` components. Applies Jambo visual identity. |

Example files in `ui/`: `button.tsx`, `dialog.tsx`, `card.tsx`, `table.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `toast.tsx`.

Example files in `jambo/`: `AppShell.tsx` (main app layout + sidebar/topbar), `Logo.tsx`, `NotificationBell.tsx`, `Preloader.tsx`.

### 2.6 `src/features/`

**Purpose:** Business domain modules. This is where **80% of the app lives.**

The project follows a **feature-based architecture**: every hotel operation is its own self-contained folder containing all pages, dialogs, and components for that domain. Feature folders should not import from each other — they communicate through the store and shared code.

A summary of each domain module:

| Feature | What it handles |
|---------|-----------------|
| `features/accounting/` | Journal entries, ledgers, and financial records. |
| `features/admin/` | System administration & configuration (roles, users/identity, properties, security, POS settings, room settings, audit log, miscellaneous charges). |
| `features/billing/` | Guest/stay billing, charges, and settlement. |
| `features/dashboard/` | Home/dashboard overview with KPIs and analytics widgets. |
| `features/events/` | Conference/banqueting events: calendar, list, and creation. |
| `features/frontdesk/` | Day-to-day desk operations: check‑in, check‑out, walk‑ins, settlement. |
| `features/groups/` | Group bookings and room-block management. |
| `features/guest-services/` | Requests/services delivered to in‑house guests. |
| `features/guests/` | Guest profiles database; search, create, edit. |
| `features/housekeeping/` | Room status board, scheduling, inspections, issues. |
| `features/hr/` | Human resources: staff profiles. |
| `features/inventory/` | Stock, suppliers, purchase orders, receiving, transfers, stocktakes, food‑cost. |
| `features/invoices/` | Supplier invoices and accounts payable. |
| `features/lost-found/` | Lost-&-found item tracking. |
| `features/notifications/` | In-app notification center. |
| `features/pos/` | Point‑of‑Sale: menu, orders, settlement, audit. |
| `features/rates/` | Room rate cards and pricing plans. |
| `features/reporting/` | Reporting engine / report definitions. |
| `features/reports/` | Reports execution and rendered output screens. |
| `features/reservations/` | Booking flow: list, new reservation, detail, related dialogs. |
| `features/rooms/` | Room setup, dialog, and inventory. |

Prefix convention: **Page-level** components are named `XxxPage.tsx` (e.g., `GuestsPage.tsx`, `RoomsPage.tsx`). Supporting components (`dialogs`, `wizards`, `tabs`) use clear lowercase, descriptive names (e.g., `housekeeping/housekeeping-dialogs.tsx`).

### 2.7 `src/hooks/`

**Purpose:** Shared, reusable React custom hooks.

Global cross-cutting hooks reused across many features or wiring to app-level concerns (device detection, theme, online state, notification polling, PWA install prompt).

Example files:
- `use-mobile.tsx` — responsive/mobile breakpoint detection.
- `use-theme.tsx` — light/dark theme hook.
- `use-online-status.tsx` — online/offline connectivity tracking.
- `use-notification-poller.ts` — periodic refresh for notifications.
- `use-install-prompt.tsx` — PWA install prompt.

### 2.8 `src/lib/`

**Purpose:** Core, framework-level utilities and helpers with no UI.

Business-agnostic glue: type/formatters, state store, role checks, receipt printing.

Example files:
- `utils.ts` — generic helpers (e.g., class-name merge `cn()`).
- `pms-store.tsx` — global property-management store/context.
- `role.tsx` — user role/permission helpers.
- `print-receipt.ts` — receipt print formatting logic.

---

## 3. `src/shared/`

**Purpose:** A "dependency" of reusable cross-feature code, **mirroring** `components/`, `hooks/`, and `lib/` but intended strictly for code shared *across* multiple features.

| Folder | Purpose |
|--------|---------|
| `shared/components/` | Reusable feature-agnostic components used by more than one domain. |
| `shared/components/ui/` | (Mirror of shadcn/ui) generic primitive components. |
| `shared/components/jambo/` | (Mirror of `components/jambo`) brand-level reusable components. |
| `shared/hooks/` | Custom hooks shared across features. |
| `shared/store/` | Shared Redux-state slices and store definitions. |
| `shared/utils/` | Shared helper functions used across features. |

Example files:
- `shared/components/GuestAutocomplete.tsx` — autocomplete used on multiple screens.
- `shared/components/CountrySelect.tsx` — country dropdown reused in several forms.
- `shared/components/TimePicker.tsx` — reusable time input.

### `shared/components/guests/`, hotel groups, etc.

Feature-scoped components that are reusable should be *promoted* into `shared/` (and mirrored into the relevant subfolder). Keep `shared/` free of features-specific business logic that only one domain needs.

---

## 4. `src/_unscoped/`

**Purpose:** Temporary/holding area for experimental, draft, or not-yet-organised code.

Code placed here has not yet been assigned to a proper `features/` module. Everything here is expected to be **promoted into the correct feature folder** as it matures.

| Folder | Status |
|--------|--------|
| `_unscoped/events/` | Event-related code not yet moved into `features/events/`. |
| `_unscoped/hr/` | HR-related code not yet moved into `features/hr/`. |

> **Convention:** This folder should stay empty. If you find code here, move it to its canonical feature folder and delete the file.

---

## Visual Structure (Tree)

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── node_modules/            (generated — do not touch)
└── src/
    ├── main.tsx             # bootstrap entry
    ├── App.tsx              # root component & routes
    ├── _unscoped/           # temp/holding code (keep empty)
    ├── app/                 # global providers & bootstrap
    ├── assets/              # images, icons, fonts
    ├── auth/                # login + session guards
    ├── components/
    │   ├── ui/              # shadcn/ui primitives (button, dialog…)
    │   └── jambo/           # brand components (AppShell, Logo…)
    ├── docs/                # documentation (this file)
    ├── features/            # domain modules (80% of the app)
    │   ├── accounting/
    │   ├── admin/
    │   ├── billing/
    │   ├── dashboard/
    │   ├── events/
    │   ├── frontdesk/
    │   ├── groups/
    │   ├── guest-services/
    │   ├── guests/
    │   ├── housekeeping/
    │   ├── hr/
    │   ├── inventory/
    │   ├── invoices/
    │   ├── lost-found/
    │   ├── notifications/
    │   ├── pos/
    │   ├── rates/
    │   ├── reporting/
    │   ├── reports/
    │   ├── reservations/
    │   └── rooms/
    ├── hooks/               # shared custom hooks
    ├── lib/                 # framework-level utilities & store
    └── shared/              # cross-feature shared code
        ├── components/{ui,jambo}
        ├── hooks/
        ├── store/
        └── utils/
```

---

## 6. Where Does New Code Go?

| If you are adding… | Put it in… |
|--------------------|------------|
| A brand‑new domain/module | Create a folder under `src/features/<feature>/`. |
| A screen, page, or form | `src/features/<feature>/XxxPage.tsx`. |
| A dialog/wizard within a feature | `src/features/<feature>/…dialog.tsx`/`…wizard.tsx`. |
| A generic UI primitive (button, table, input) | `src/components/ui/` (as a shadcn/ui component). |
| A brand-level component reused by features processes | `src/components/jambo/`. |
| A cross-feature component/hook/util | `src/shared/components|hooks|store|utils`. |
| New auth/session logic | `src/auth/`. |
| A static image/asset | `src/assets/`. |

---

## 7. Version of the rules

- Prefer many small, focused files over few large ones.
- Keep feature code **self-contained** — don't import another feature directly.
- Promote shared code into `src/shared/` as soon as it is used by two or more features.
- Keep `src/_unscoped/` empty by regularly moving code to its canonical location.
- Never commit `node_modules/`, build output, or environment secrets.