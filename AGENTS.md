# AGENTS.md

Context for AI agents working on the findmomentum codebase: the decisions, invariants, and conventions that the code cannot express, plus a map of where things live.

## Doc Policy

The code is the source of truth for every fact it can express. This file records only intent. Rules for editing it:

- Reference code by file path and exported symbol, never by line number. Line references break on almost every commit and fail silently: a stale line shows the reader the wrong code as if it were the answer.
- Never restate a fact derivable from a single file: dependency versions (`package.json`), prop lists (the component's `Props` type), schema fields (`prisma/schema.prisma`), directory inventories, npm script bodies.
- No code samples. Name the canonical exemplar file for a pattern instead; a real file cannot drift.
- When a claim here no longer matches the code, delete the claim or convert it to a pointer. Never re-sync a copied detail.
- An orientation map of top-level directories is allowed; keep it to stable structure and intent, with no file counts or per-file enumerations.

## Project Overview

**findmomentum** is a productivity application that helps users track and celebrate daily progress through small wins. The primary user base is on mobile devices, so responsive design is critical.

**Live URL**: [https://www.findmomentum.xyz](https://www.findmomentum.xyz)

Core features: activity tracking, tasks with duration tracking, time entries for work sessions, category-based organization, contribution-graph progress visualization.

## Technology Stack

See `package.json` for dependencies and versions.

## Architecture

Next.js App Router. Key decisions:

- Server Components by default; Client Components (`"use client"`) only when interactivity is required.
- Server Actions replace REST endpoints for all mutations.
- Session checks via `redirect()` in layouts and Server Components (no middleware).
- JWT sessions (not database sessions).
- Suspense boundaries for progressive loading on the dashboard and activity pages.

### Directory Map

```
src/
├── app/                  # Next.js App Router
│   ├── actions/          # Server Actions
│   ├── api/auth/         # NextAuth route handler
│   ├── schemas/          # Zod validation schemas
│   ├── auth/sign-in/     # OTP sign-in flow
│   └── dashboard/        # Authenticated app (activities/[id], components/)
├── components/           # Shared components; ui/ holds the shadcn/ui primitives
├── hooks/                # Custom React hooks
├── lib/
│   ├── auth/             # NextAuth config + Resend email sending
│   ├── prisma/           # Prisma client singleton
│   ├── rate-limiter/     # Custom in-memory rate limiting (withRateLimit wrapper)
│   ├── services/         # Data access layer (all Prisma access lives here)
│   ├── test-utils.ts     # create* factories for tests
│   └── utils/            # Shared helpers (form errors, prisma-error-handler, time)
└── types.ts              # Shared types: ActionResult, Prisma GetPayload query shapes
```

## Naming Conventions

- Components: `kebab-case.tsx` files exporting `PascalCase` components (e.g. `bottom-nav.tsx` exports `BottomNav`).
- Server Actions: `kebab-case-action.ts`. Services: `kebab-case.ts` exporting a `camelCase` function. Schemas: `kebab-case-schema.ts`. Hooks: `use-kebab-case.ts`.
- Tests: `<name>.test.ts`, colocated next to the code they cover.
- Types: component props are `ComponentNameProps`; service params are `ServiceNameParams`; schema types are inferred with `z.infer`.
- Sizing guidance: components roughly 50-200 lines, actions 50-150, services 20-100 (one focused responsibility each).

## Layering: Action → Service → Prisma

Every mutation flows through three layers. Canonical exemplar chain: `src/app/schemas/create-activity-schema.ts` → `src/app/actions/create-activity-action.ts` → `src/lib/services/create-activity.ts`.

1. **Action** (`src/app/actions/`): checks `await auth()` first, validates input against the Zod schema, calls exactly one service, returns `ActionResult<T>`.
2. **Service** (`src/lib/services/`): owns all Prisma access and business logic. Application code reaches the database only through services; the only non-service Prisma imports are the NextAuth adapter (`src/lib/auth/index.ts`) and test code (`src/lib/test-utils.ts` and a few colocated `*.test.ts` files that assert on DB state).
3. **Prisma** (`prisma/schema.prisma`): schema, constraints, migrations.

Why: validation, authorization, and business logic stay separated; services are reusable across actions and testable in isolation; types flow from Zod through the action to the service.

## Data Layer

The canonical schema lives in `prisma/schema.prisma`; migration history is under `prisma/migrations/`. Read those for exact field names, types, indexes, and `@map` directives.

**Functional-index invariant (non-obvious, load-bearing)**: case-insensitive uniqueness on `(team_id, name)` for `Category` is enforced by a Postgres functional unique index, NOT a Prisma `@@unique`. See `prisma/migrations/20260430204410_categories_case_insensitive_unique/`. Prisma cannot model functional indexes ([prisma/prisma#12914](https://github.com/prisma/prisma/issues/12914)), so every `prisma migrate dev` run that touches `categories` MUST be inspected: Prisma will propose `DROP INDEX categories_team_id_lower_name_key`, and that line must be removed before the migration is committed.

Conventions:

- All models carry `createdAt` and `updatedAt`, timezone-aware via `@db.Timestamptz`.
- Primary keys are `cuid()`.
- Deletions are soft deletes via a `deletedAt` timestamp. Every read query must filter `deletedAt: null`.
- Parent-child relations use `onDelete: Cascade` (deleting an Activity cascades to Tasks, then TimeEntries).
- Multi-step operations run inside `prisma.$transaction`. Exemplars: `src/lib/services/play-task.ts`, `src/lib/services/update-task-position.ts`.
- Query result shapes are typed with Prisma `GetPayload` in `src/types.ts` (e.g. `ActivityWithTasksAndTimeEntries`), never hand-written.

## Authentication

Email OTP via a NextAuth v5 Credentials provider. Config: `src/lib/auth/index.ts`. Email sending via Resend: `src/lib/auth/resend.ts`.

Flow:

1. `requestOtpAction` generates an OTP, stores it in the `verificationToken` table (replacing any prior token for that email, inside a transaction), and emails it. See `src/lib/services/request-otp.ts`.
2. `verifyOtpAction` signs in through NextAuth; the provider's `authorize` calls `findUserByEmailAndOtp`, which consumes the token.
3. Sessions are JWT-based; the `session` callback copies the user id onto `session.user.id`.
4. The `signIn` event (NextAuth `events.signIn`, not a callback) calls `findOrCreateDefaultTeam`, so every user always has a team.

Both OTP actions are wrapped with `withRateLimit` (`src/lib/rate-limiter/with-rate-limit.ts`). The limiter is a custom in-memory store keyed by client IP (`src/lib/rate-limiter/index.ts`), not an external package.

Authorization pattern: Server Actions check `await auth()` first and return a failed `ActionResult` when there is no session; protected pages and layouts `redirect("/auth/sign-in")`.

## UI & Component Patterns

- shadcn/ui primitives live in `src/components/ui/`; feature components live in `src/components/` and under their route's `components/` directory.
- Server Components for data fetching, static content, and anything touching secrets. Client Components only for event handlers, hooks, browser APIs, and animation/drag interactions. Fetch in the Server Component, pass data down as props.
- Forms open inside dialogs: the dialog component owns the `open` state and passes `onSuccess` to the form so it can close on completion. Exemplar pair: `src/components/upsert-activity-dialog.tsx` + `src/components/upsert-activity-form.tsx`.

### Category Picker

`src/components/category-picker.tsx`; props are `CategoryPickerProps` in that file.

- `mode` (default `"manage"`): `"manage"` gives full inline CRUD (create via a `Create '…'` row, rename/delete via icons) and is used in `UpsertActivityForm`, which merges server-passed categories with locally optimistic additions via `onCategoryCreated`. `"filter"` is a read-only multi-select used in `ActivityFilters` (`src/app/dashboard/components/activity-filters.tsx`) to drive `?categories=` URL params.
- Prefetch convention: `getCategories` (`src/lib/services/get-categories.ts`) is wrapped in React's `cache()`, so multiple RSCs in the same request share one DB round-trip. Call it freely from any RSC that needs categories.

## Responsive Design

- Mobile-first: base styles target mobile; add `sm:`/`md:` overrides upward. `sm:` is the most-used breakpoint.
- Navigation: mobile gets a fixed `BottomNav` (`src/components/bottom-nav.tsx`), desktop a sticky `TopNav`. The dashboard layout (`src/app/dashboard/layout.tsx`) gives content `mb-[82px]` so it clears the bottom nav.
- Touch targets: minimum 44x44px. Small icons get an enlarged tap area via the padding-plus-negative-margin idiom (e.g. `p-2 -m-2`).
- Progressive loading: wrap slow RSCs in `Suspense` with a skeleton fallback. Exemplar: `src/components/activity-page-skeleton.tsx` used by the activity detail page.

## Forms & Validation

React Hook Form + `zodResolver`, schema from `src/app/schemas/`. Canonical exemplar to read before writing any form: `src/components/upsert-activity-form.tsx`.

- Actions return `ActionResult<T>` (`src/types.ts`), a discriminated union on `success`. Client code branches on it; there is no throwing across the action boundary.
- Field errors: `parseZodErrors` (`src/lib/utils/form.ts`) flattens Zod issues into a record keyed by dotted paths (`"items.0.name"`, not nested objects), each a manual-type field error. `setFormErrors` forwards them to `form.setError`. A failed service call in an action returns the errors built by `createZodError`/`parseZodErrors` from its catch branch.
- Known Prisma constraint violations are mapped to per-field errors by `src/lib/utils/prisma-error-handler.ts` (e.g. the case-insensitive category-name index maps to a `name` field error).

## Cache Invalidation

**This codebase does not use `revalidatePath`, `revalidateTag`, or `unstable_cache`; there are zero call sites.** Mutations propagate because client components, on a successful `ActionResult`, either `router.push` to a newly created resource or `router.refresh()` when staying on the same route; both re-execute the route's RSCs against the fresh database. No route opts into caching. Exemplar: the submit handler in `src/components/upsert-activity-form.tsx`.

## State Management

No global state library (no Redux/Zustand/app-wide Context), deliberately. State lives in:

1. Server state: fetched in Server Components, passed down as props.
2. Form state: React Hook Form.
3. UI state: local `useState`.
4. Filters/pagination/search: URL search params.
5. Toasts: `src/hooks/use-toast.ts` (custom reducer-based system).

Optimistic updates: update local state immediately, then call the action; on failure, revert and show a destructive toast. Exemplar: `src/components/bookmark-button.tsx`.

## Testing

- Runner: Vitest. Config in `vitest.config.ts`: Node environment, `@` alias to `./src`, single-fork pool (no file parallelism) because every test shares the same Postgres database.
- Tests are colocated (`src/lib/services/<name>.test.ts`) and use the `create*` factories in `src/lib/test-utils.ts`.
- **DB safety invariant**: `vitest.setup.ts` refuses to TRUNCATE unless the database name in `DATABASE_TEST_URL` contains `"test"` (case-insensitive). This guard prevents wiping a dev or prod database. Never bypass it.
- `npm test` migrates the test database before running Vitest (the `pretest`/`test:setup` scripts in `package.json` handle this). Those scripts need bash for variable expansion, so Windows requires WSL2 or Git Bash.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, and tests against a Postgres service container on every push and PR to `main`. It invokes `npx vitest run` directly, bypassing the `pretest` hook, because it has already migrated the DB in an earlier step. Note: the workflow pins the Node version literally rather than reading `.nvmrc`, so keep the two in sync when bumping.

## Repo-Specific Rules

- Strict TypeScript, no `any`; use `unknown` and narrow. Infer types from Zod schemas; use `GetPayload` for query shapes.
- Server Components first; add `"use client"` only when the component needs interactivity.
- Validate at all three layers: React Hook Form on the client, Zod in the action, Prisma constraints in the database.
- Every Server Action starts with an auth check; every protected page redirects unauthenticated users.
- Comments are terse and explain a durable why, never narration of what the code does.
- Never use an em dash anywhere (code, comments, commits, PR text); recast with periods, commas, or parentheses.
- Seed data uses Faker: `prisma/seed.ts`.

## Development Workflow

Setup: `nvm install && nvm use`, `npm install`, `cp .env.example .env` and fill in values, then `npm run dev` (the dev script runs `prisma generate` and `prisma migrate deploy` itself).

Day-to-day work (dev server, lint, typecheck, tests, production build) runs through the npm scripts in `package.json`. Database: `npx prisma migrate dev --name <name>`, `npx prisma studio`, `npx prisma db seed`, and `npx prisma migrate reset` (destructive: drops all data).

Git:

- Branches: `feature/<description>`, `fix/<description>`, `chore/<description>`.
- Commits: conventional style, `type(scope): imperative summary` (types: feat, fix, docs, refactor, test, chore).
