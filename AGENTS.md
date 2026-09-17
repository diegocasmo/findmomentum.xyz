# AGENTS.md

Context for AI agents working on the findmomentum codebase: the rules, reasons, and pointers that the code cannot express.

## Doc Policy

The code is the single source of truth. This file holds only rules, reasons, and pointers.

- Point at code by file path and exported symbol. Never copy it or describe it. Copied or described code drifts the moment the code changes, and the reader can open the file.
- Never reference a line number. Line references break on almost every commit and fail silently: a stale line shows the reader the wrong code as if it were the answer.
- Keep a sentence only if it is a rule the code cannot state, the reason behind a rule, or a pointer to an exemplar file or symbol.
- When a claim here no longer matches the code, delete it or convert it to a pointer. Never re-sync a copied detail.

## Project Overview

**findmomentum** helps users track and celebrate daily progress through small wins. Live at [https://www.findmomentum.xyz](https://www.findmomentum.xyz). The primary user base is on mobile devices, so responsive design is critical.

Next.js App Router. Server Actions, not REST endpoints, handle all mutations. Dependencies and versions: `package.json`.

## Layering: Action → Service → Prisma

Every mutation flows through three layers. Canonical exemplar chain: `src/app/schemas/create-activity-schema.ts` → `src/app/actions/create-activity-action.ts` → `src/lib/services/create-activity.ts`.

Only services, the NextAuth config (`src/lib/auth/index.ts`), and test code import the Prisma client.

Why: validation, authorization, and business logic stay separated; services are reusable across actions and testable in isolation; types flow from Zod through the action to the service.

## Data Layer

Schema: `prisma/schema.prisma`. Migration history: `prisma/migrations/`.

**Functional-index invariant (non-obvious, load-bearing)**: case-insensitive uniqueness on `(team_id, name)` for `Category` is enforced by a Postgres functional unique index, NOT a Prisma `@@unique`. See `prisma/migrations/20260430204410_categories_case_insensitive_unique/`. Prisma cannot model functional indexes ([prisma/prisma#12914](https://github.com/prisma/prisma/issues/12914)), so every `prisma migrate dev` run that touches `categories` MUST be inspected: Prisma will propose `DROP INDEX categories_team_id_lower_name_key`, and that line must be removed before the migration is committed.

Rules:

- Activity and Task are soft-deleted via `deletedAt`; every read query for them must filter `deletedAt: null`. Other models are hard-deleted. Exemplar: `deleteCategory` in `src/lib/services/delete-category.ts`.
- Multi-step operations run inside `prisma.$transaction`. Exemplars: `src/lib/services/play-task.ts`, `src/lib/services/update-task-position.ts`.
- Query result shapes are typed with Prisma `GetPayload` in `src/types.ts`, never hand-written.

## Authentication

Email OTP through a NextAuth Credentials provider with JWT sessions. Config: `src/lib/auth/index.ts`. Email sending: `src/lib/auth/resend.ts`.

- Every Server Action starts with `requireUserId` (`src/lib/utils/require-user-id.ts`), except the two OTP actions, which are wrapped in `withRateLimit` (`src/lib/rate-limiter/with-rate-limit.ts`) instead.
- Protected pages and layouts redirect unauthenticated users to sign-in. There is no middleware.
- Every user always has a team: `findOrCreateDefaultTeam` runs on sign-in.

## UI & Component Patterns

- Server Components for data fetching, static content, and anything touching secrets. Client Components (`"use client"`) only for event handlers, hooks, browser APIs, and animation/drag interactions. Fetch in the Server Component, pass data down as props.
- Forms open inside dialogs: the dialog owns the `open` state and passes `onSuccess` to the form so it can close on completion. Exemplar pair: `src/components/upsert-activity-dialog.tsx` + `src/components/upsert-activity-form.tsx`.

## Responsive Design

- Mobile-first: base styles target mobile; add breakpoint overrides upward.
- Touch targets: minimum 44x44px. Small icons get an enlarged tap area through padding plus negative margin. Exemplar: the drag handle in `src/app/dashboard/activities/[id]/components/task-card.tsx`.
- Wrap slow RSCs in `Suspense` with a skeleton fallback. Exemplar: `src/components/activity-page-skeleton.tsx` on the activity detail page.

## Forms & Validation

React Hook Form + `zodResolver`, schemas in `src/app/schemas/`. Read `src/components/upsert-activity-form.tsx` before writing any form.

- Validate at all three layers: React Hook Form on the client, Zod in the action, Prisma constraints in the database.
- Actions return `ActionResult<T>` (`src/types.ts`). Client code branches on `success`; nothing throws across the action boundary.
- Field-error helpers: `src/lib/utils/form.ts`. Prisma constraint violations become field errors in `src/lib/utils/prisma-error-handler.ts`.

## Cache Invalidation

Never call `revalidatePath`, `revalidateTag`, or `unstable_cache`. Mutations propagate through the router on a successful `ActionResult`. Exemplar: the submit handler in `src/components/upsert-activity-form.tsx`.

## State Management

- No global state library, deliberately.
- Filters, pagination, and search live in URL search params.
- Optimistic updates: `src/components/bookmark-button.tsx`. Toasts: `src/hooks/use-toast.ts`.

## Testing

- Vitest; config in `vitest.config.ts`. Never enable file parallelism: every test shares one Postgres database.
- Tests are colocated with the code they cover and use the `create*` factories in `src/lib/test-utils.ts`.
- **DB safety invariant**: `vitest.setup.ts` refuses to TRUNCATE unless the database name in `DATABASE_TEST_URL` contains `"test"`. Never bypass it.
- CI: `.github/workflows/ci.yml`. It pins the Node version literally instead of reading `.nvmrc`; keep the two in sync when bumping.

## Repo-Specific Rules

- Strict TypeScript, no `any`; use `unknown` and narrow.
- Comments are terse and explain a durable why, never narration of what the code does.
- Never use an em dash anywhere (code, comments, commits, PR text); recast with periods, commas, or parentheses. The Next.js block below is written by `next dev` and is exempt.

## Development Workflow

Setup and test database: `README.md`.

Git:

- Keep each pull request at or below the added-line limit that [the Dangerfile](./dangerfile.mts) defines and enforces. The check counts tests like other files. Split the work instead.
- Commit messages and pull request titles use the conventional style, `type(scope): imperative summary` (types: feat, fix, docs, refactor, test, chore).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
