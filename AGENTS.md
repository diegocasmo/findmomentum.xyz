# AGENTS.md

This document provides AI agents (like Claude Code) with comprehensive context about the findmomentum codebase architecture, patterns, and best practices.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Code Organization](#code-organization)
- [Key Patterns](#key-patterns)
- [Data Layer](#data-layer)
- [Authentication](#authentication)
- [UI & Component Patterns](#ui--component-patterns)
- [Responsive Design](#responsive-design)
- [Forms & Validation](#forms--validation)
- [State Management](#state-management)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Development Workflow](#development-workflow)

---

## Project Overview

**findmomentum** is a productivity application that helps users track and celebrate daily progress through small wins. The main user base accesses the application on mobile devices, making responsive design critical.

**Live URL**: [https://www.findmomentum.xyz](https://www.findmomentum.xyz)

**Core Features**:
- Activity tracking and management
- Task creation with duration tracking
- Time entries for active work sessions
- Category-based organization
- Progress visualization with contribution graphs
- Mobile-first responsive interface

---

## Technology Stack

See `package.json` for the authoritative list of dependencies and versions. Do not list dependency versions in docs; `package.json` is the single source of truth.

---

## Architecture Overview

### Framework Setup

**Next.js App Router Pattern**:
- Uses Server Components by default for improved performance
- Client Components (`"use client"`) only when interactivity is required
- Server Actions replace traditional REST API endpoints
- Middleware-style authentication via `redirect()` and `notFound()`

**Key Architectural Decisions**:
1. **Server-side rendering** with async Server Components
2. **Session management** at layout level (DashboardLayout)
3. **Suspense boundaries** for progressive loading (dashboard, activity pages)
4. **Type safety** throughout with TypeScript + Zod + Prisma

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── actions/              # Server Actions (18 files)
│   ├── api/auth/             # NextAuth API handler
│   ├── schemas/              # Zod validation schemas (15+ files)
│   ├── dashboard/            # Main authenticated application
│   │   ├── activities/       # Activity detail pages
│   │   │   └── [id]/         # Dynamic route for activity details
│   │   └── components/       # Dashboard-specific components
│   ├── auth/                 # Authentication pages
│   │   └── sign-in/          # OTP sign-in flow
│   ├── fonts/                # Custom font files
│   ├── globals.css           # Global Tailwind + CSS variables
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Landing page
├── components/               # Shared UI components
│   ├── ui/                   # shadcn/ui base components (20+ files)
│   └── [feature].tsx         # Feature-specific components
├── lib/                      # Business logic & utilities
│   ├── auth/                 # NextAuth configuration + Resend
│   ├── prisma/               # Database client singleton
│   ├── services/             # Data access layer (25+ functions)
│   ├── utils/                # Utility functions
│   │   ├── cn.ts             # Class name merger
│   │   └── time.ts           # Time formatting utilities
│   └── rate-limiter/         # Request rate limiting
├── hooks/                    # Custom React hooks
│   ├── use-toast.ts          # Toast notification system
│   ├── use-debounce.ts       # Input debouncing
│   └── use-window-size.ts    # Responsive behavior
└── types.ts                  # Global TypeScript types
```

---

## Code Organization

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `ActivityCard.tsx`)
- Server Actions: `kebab-case-action.ts` (e.g., `create-activity-action.ts`)
- Services: `kebab-case.ts` (e.g., `get-activities.ts`)
- Schemas: `kebab-case-schema.ts` (e.g., `create-activity-schema.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-toast.ts`)

**Types**:
```typescript
// Component props
type ComponentNameProps = {
  prop1: string;
  prop2?: number;
};

// Service parameters
type ServiceParams = {
  userId: string;
  limit?: number;
};

// Inferred from Zod schemas
export type CreateActivitySchema = z.infer<typeof createActivitySchema>;
```

### Module Organization

**Separation of Concerns**:
1. **Presentation Layer** (`components/`, `app/[route]/page.tsx`)
   - Server Components for data fetching and rendering
   - Client Components for interactivity

2. **Validation Layer** (`app/schemas/`)
   - Zod schemas for request validation
   - Type inference for TypeScript

3. **Action Layer** (`app/actions/`)
   - Server Actions for form submissions
   - Authentication checks
   - Input validation
   - Error handling

4. **Service Layer** (`lib/services/`)
   - Database operations
   - Business logic
   - Data transformations

5. **Data Layer** (`prisma/`)
   - Schema definitions
   - Migrations
   - Database seeding

**File Size Guidelines**:
- Components: Generally 50-200 lines
- Server Actions: 50-150 lines (validation + error handling)
- Services: 20-100 lines (focused single responsibility)

---

## Key Patterns

### 1. Action → Service → Prisma Pattern

Every data mutation follows this three-layer pattern:

```typescript
// 1. Server Action (app/actions/create-activity-action.ts)
export async function createActivityAction(formData: FormData) {
  // Auth check
  const session = await auth();
  if (!session) redirect("/auth/sign-in");

  // Validate input
  const parsed = createActivitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });
  if (!parsed.success) return { error: parsed.error };

  // Call service
  const activity = await createActivity({
    userId: session.user.id,
    ...parsed.data
  });

  return { data: activity };
}

// 2. Service (lib/services/create-activity.ts)
export async function createActivity(params: CreateActivityParams) {
  return await prisma.activity.create({
    data: {
      userId: params.userId,
      name: params.name,
      description: params.description
    }
  });
}

// 3. Usage in Client Component
function CreateActivityForm() {
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createActivityAction(formData);
      if (result.error) {
        // Handle error
      } else {
        // Success
      }
    });
  }

  return <form action={handleSubmit}>...</form>;
}
```

**Why This Pattern**:
- **Separation of concerns**: Validation, authorization, business logic separated
- **Reusability**: Services can be called from multiple actions
- **Testability**: Each layer can be tested independently
- **Type safety**: Types flow from Zod → Action → Service → Prisma

### 2. Server Component Composition

Fetch data in Server Components, pass to Client Components:

```typescript
// Server Component (async)
export default async function ActivityPage({ params }: { params: { id: string } }) {
  const activity = await getActivity({ id: params.id });

  return (
    <div>
      {/* Client Component receives server data */}
      <ActivityTimer activity={activity} />
      <TasksList tasks={activity.tasks} />
    </div>
  );
}

// Client Component
"use client";
export function TasksList({ tasks }: { tasks: Task[] }) {
  const [localTasks, setLocalTasks] = useState(tasks);
  // Interactive drag-and-drop, etc.
}
```

### 3. Zod for Everything

Zod is used for all validation and type inference:

```typescript
// Define schema
export const createTaskSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  estimatedMinutes: z.coerce.number().min(0).max(59),
  estimatedSeconds: z.coerce.number().min(0).max(59)
});

// Infer TypeScript type
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;

// Use in React Hook Form
const form = useForm<CreateTaskSchema>({
  resolver: zodResolver(createTaskSchema),
  defaultValues: { name: "", estimatedMinutes: 0, estimatedSeconds: 0 }
});

// Validate in Server Action
const parsed = createTaskSchema.safeParse(formData);
if (!parsed.success) {
  return { error: transformZodErrors(parsed.error) };
}
```

### 4. Soft Deletes

All deletions are soft deletes using `deletedAt` timestamp:

```typescript
// Schema
model Activity {
  deletedAt DateTime?
}

// Delete (actually update)
await prisma.activity.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// Query (filter out deleted)
const activities = await prisma.activity.findMany({
  where: {
    userId,
    deletedAt: null  // Always filter deleted records
  }
});
```

### 5. Prisma Transactions

Multi-step operations use transactions for atomicity:

```typescript
export async function completeTask({ taskId, userId }: CompleteTaskParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get task
    const task = await tx.task.findUnique({ where: { id: taskId } });

    // 2. Stop any running time entries
    await tx.timeEntry.updateMany({
      where: { taskId, stoppedAt: null },
      data: { stoppedAt: new Date() }
    });

    // 3. Mark task complete
    await tx.task.update({
      where: { id: taskId },
      data: { completedAt: new Date() }
    });

    // All succeed or all fail
  });
}
```

### 6. Custom Prisma Types

Type-safe includes/selects using `Prisma.GetPayload`:

```typescript
// Define exact shape needed
const activityWithTasksAndTimeEntries = Prisma.validator<Prisma.ActivityDefaultArgs>()({
  include: {
    tasks: {
      include: { timeEntries: true }
    }
  }
});

// Create type from shape
export type ActivityWithTasksAndTimeEntries = Prisma.ActivityGetPayload<
  typeof activityWithTasksAndTimeEntries
>;

// Use in service function
export async function getActivity(
  params: GetActivityParams
): Promise<ActivityWithTasksAndTimeEntries> {
  return await prisma.activity.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: { timeEntries: true }
      }
    }
  });
}
```

---

## Data Layer

### Database Schema

The canonical schema lives in `prisma/schema.prisma`. Migration history is under `prisma/migrations/`. Read those files when you need exact field names, types, indexes, or `@map`/`@@map` directives — this doc deliberately does not duplicate them, since hand-maintained mirrors drift.

One non-obvious invariant worth knowing inline: case-insensitive uniqueness on `(team_id, name)` for `Category` is enforced by a Postgres functional unique index, NOT a Prisma `@@unique`. See `prisma/migrations/20260430204410_categories_case_insensitive_unique/`. Prisma cannot model functional indexes ([prisma/prisma#12914](https://github.com/prisma/prisma/issues/12914)), so every future `prisma migrate dev` run that touches `categories` MUST be inspected — Prisma will propose `DROP INDEX categories_team_id_lower_name_key`, and that line MUST be removed before the migration is committed.

### Database Conventions

**Timestamps**:
- All models have `createdAt` and `updatedAt`
- Use `@db.Timestamptz` for timezone-aware timestamps (no precision suffix; matches `prisma/schema.prisma`)
- Soft deletes via `deletedAt` field

**IDs**:
- Use `cuid()` for all primary keys
- Consistent ID generation across models

**Indexes**:
- Composite indexes on frequently filtered fields
- Example: `@@index([userId, deletedAt, completedAt])`
- Foreign key indexes for JOIN performance

**Cascading Deletes**:
- `onDelete: Cascade` for parent-child relationships
- When Activity deleted, Tasks automatically deleted
- When Task deleted, TimeEntries automatically deleted

### Service Layer Functions

**Location**: `src/lib/services/`. The directory listing is the canonical inventory — read filenames there rather than relying on this doc. Each file exports one async function. Naming convention: file `kebab-case.ts` → exported `camelCaseFunction`. Auth-flow services (`request-otp`, `find-user-by-email-and-otp`, `find-or-create-default-team`), activity/task/category CRUD, bookmarking (`toggle-bookmark-activity`, `get-bookmarked-activities`), task time tracking (`play-task`, `pause-task`), and helpers like `create-activity-from-template`, `duplicate-task`, `update-task-position` all live there.

**Service Function Pattern**:

```typescript
// Type-safe parameters
type GetActivitiesParams = {
  userId: string;
  completedAt?: "completed" | "incomplete";
  search?: string;
  categoryIds?: string[];
  limit?: number;
  page?: number;
};

// Return type from Prisma GetPayload
export async function getActivities(
  params: GetActivitiesParams
): Promise<ActivityWithCategories[]> {
  const { userId, completedAt, search, categoryIds, limit = 10, page = 1 } = params;

  return await prisma.activity.findMany({
    where: {
      userId,
      deletedAt: null,
      // Dynamic filters...
    },
    include: {
      activityCategories: {
        include: { category: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit
  });
}
```

---

## Authentication

### NextAuth.js v5 Setup

**Strategy**: Email OTP (One-Time Password) via Credentials Provider

**Authentication Flow**:

1. **Request OTP**:
   - User enters email on `/auth/sign-in`
   - Server Action `requestOtpAction()` called
   - Generates 6-digit OTP
   - Stores in `VerificationToken` table with expiration
   - Sends email via Resend

2. **Verify OTP**:
   - User enters OTP code
   - Server Action `verifyOtpAction()` validates
   - Checks OTP matches and not expired
   - Creates/updates User record
   - NextAuth signs in user

3. **Session Management**:
   - JWT-based sessions (not database)
   - Session includes user ID
   - Session checked in layouts and Server Components

**Key Files**:

```typescript
// lib/auth/index.ts - NextAuth configuration
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      authorize: async (credentials) => {
        const user = await findUserByEmailAndOtp(
          credentials.email as string,
          credentials.otp as string
        );
        return user;
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      return session;
    },
    signIn: async ({ user }) => {
      // Create default team for new users
      await ensureUserHasTeam(user.id);
      return true;
    }
  },
  pages: {
    signIn: "/auth/sign-in"
  },
  session: {
    strategy: "jwt"
  }
});

// lib/auth/resend.ts - Email sending
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string) {
  await resend.emails.send({
    from: "findmomentum <onboarding@resend.dev>",
    to: email,
    subject: "Your OTP code",
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`
  });
}
```

**Authorization Pattern in Server Components**:

```typescript
// Check auth and redirect if not authenticated
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/sign-in");

  // Fetch user-specific data
  const activities = await getActivities({ userId: session.user.id });

  return <div>...</div>;
}
```

**Authorization Pattern in Server Actions**:

```typescript
export async function createActivityAction(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, errors: createZodError("Unauthorized") };
  }

  // Validate, call service, return { success: true, data } or { success: false, errors }
}
```

---

## UI & Component Patterns

### Component Library: shadcn/ui

**Base Components** (`components/ui/`):
- `button.tsx` - Variants: default, destructive, outline, ghost, link
- `input.tsx` - Text inputs with error states
- `card.tsx` - Container with header, content, footer sections
- `dialog.tsx` - Modal dialogs
- `alert-dialog.tsx` - Confirmation dialogs
- `tabs.tsx` - Tabbed interfaces
- `badge.tsx` - Status indicators
- `select.tsx` - Dropdown selectors
- `dropdown-menu.tsx` - Context menus
- `toast.tsx` - Notification system
- `tooltip.tsx` - Hover tooltips
- `form.tsx` - Form wrapper with field errors

**Component Composition Pattern**:

```typescript
// Dialog composition
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={handleSubmit}>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Server vs Client Components

**Use Server Components (default) for**:
- Data fetching
- Static content
- SEO-important content
- Secure operations (API keys, tokens)

**Use Client Components (`"use client"`) for**:
- Event handlers (onClick, onChange)
- Hooks (useState, useEffect, useForm)
- Browser APIs (localStorage, window)
- Animations and transitions
- Drag-and-drop interactions

**Example Split**:

```typescript
// app/dashboard/page.tsx - Server Component
export default async function DashboardPage() {
  const session = await auth();
  const activities = await getActivities({ userId: session.user.id });

  return (
    <div>
      {/* Pass data to Client Component */}
      <ActivitiesList activities={activities} />
    </div>
  );
}

// components/activities-list.tsx - Client Component
"use client";
export function ActivitiesList({ activities }: { activities: Activity[] }) {
  const [localActivities, setLocalActivities] = useState(activities);

  // Interactive features
  async function handleDelete(id: string) {
    await deleteActivityAction(id);
    setLocalActivities((prev) => prev.filter((a) => a.id !== id));
  }

  return <div>{/* Render with interactions */}</div>;
}
```

### Common UI Patterns

**Dialogs for Forms**:
```typescript
function UpsertActivityDialog({ activity, trigger }: UpsertActivityDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <UpsertActivityForm
          activity={activity}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Collapsible Sections**:
```typescript
<CollapsibleSection
  title="Completed Tasks"
  count={completedTasks.length}
  defaultOpen={false}
>
  {completedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
</CollapsibleSection>
```

**Bottom Navigation** (Mobile):
```typescript
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex justify-around p-3">
        <NavLink href="/dashboard" icon={Home} label="Home" />
        <NavLink href="/dashboard/create" icon={Plus} label="Create" />
        <NavLink href="/dashboard/profile" icon={User} label="Profile" />
      </div>
    </nav>
  );
}
```

### Category picker

**Component**: `src/components/category-picker.tsx`

**`mode` prop** (default: `"manage"`):
- `"manage"` — full inline CRUD: create via a `Create '…'` row, rename/delete via pencil+trash icons. Popover width matches trigger width. Used in `UpsertActivityForm`.
- `"filter"` — read-only multi-select; no create/edit/delete UI; popover sized to content. Used in `ActivityFilters` to push `?categories=id1,id2` URL params.

**Props**: see `CategoryPickerProps` in `src/components/category-picker.tsx`, the source of truth for the current prop list.

**Usage**:
- `src/components/upsert-activity-form.tsx:155` — `mode` omitted (defaults to `"manage"`); merges server-passed `categories` with locally optimistic additions via `onCategoryCreated`.
- `src/app/dashboard/components/activity-filters.tsx:194` — `mode="filter"`; `onChange` drives URL via `?categories=id1,id2`.

**Prefetch convention**: `getCategories({ userId })` is called in async RSCs (`src/app/dashboard/layout.tsx:19`, `src/app/dashboard/components/activities-section.tsx:53`, `src/app/dashboard/activities/[id]/page.tsx:36–39`). The function is wrapped in React's `cache()` so multiple RSCs in the same request share one DB round-trip.

---

## Responsive Design

### Mobile-First Approach

**Core Principle**: Design for mobile first, enhance for desktop

**Breakpoints** (Tailwind defaults):
- `sm:` - 640px (small tablets)
- `md:` - 768px (tablets)
- `lg:` - 1024px (laptops)
- `xl:` - 1280px (desktops)
- `2xl:` - 1536px (large desktops)

**Common Usage**: Mobile (`sm:`) is most used in this codebase

### Navigation Patterns

**Mobile**:
- Fixed bottom navigation (`BottomNav`)
- 3 main tabs: Home, Create, Profile
- Content has `mb-[82px]` to avoid overlap

**Desktop**:
- Top navigation (`TopNav`) - sticky header
- Logo and user menu in top-right
- Full-width content

**Implementation**:

```typescript
function RootNavigation() {
  return (
    <>
      {/* Desktop: Top nav */}
      <TopNav className="hidden md:block" />

      {/* Mobile: Bottom nav */}
      <BottomNav className="md:hidden" />
    </>
  );
}
```

### Layout Patterns

**Container**:
```tsx
<div className="max-w-7xl mx-auto px-2 sm:px-4">
  {/* Responsive padding */}
</div>
```

**Grid Layouts**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

**Flex Direction**:
```tsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
  {/* Vertical mobile, horizontal desktop */}
</div>
```

### Typography Scaling

```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  {/* Responsive font sizes */}
</h1>

<p className="text-sm sm:text-base">
  {/* Smaller on mobile */}
</p>
```

### Component Responsive Patterns

**Task Card**:
```typescript
function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      {/* Mobile: vertical stack */}
      {/* Desktop: horizontal with space-between */}

      <div className="flex items-center gap-2">
        <DragHandle className="p-2 -m-2" /> {/* Larger tap target */}
        <span className="truncate">{task.name}</span>
      </div>

      <div className="flex gap-2 order-1 sm:order-none">
        {/* Badge order changes on mobile */}
        <Badge>{formatTimeMMss(task.durationMs)}</Badge>
      </div>
    </div>
  );
}
```

**Contribution Graph**:
```typescript
function ContributionGraph({ contributions }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[750px]"> {/* Force horizontal scroll on mobile */}
        <div className="grid grid-cols-53 gap-1">
          {contributions.map((day) => (
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Dialogs**:
```typescript
// Mobile: full viewport
// Desktop: centered modal with max-width
<DialogContent className="max-w-md">
  <DialogHeader>...</DialogHeader>
  {/* Form content */}
</DialogContent>
```

### Touch-Friendly Design

**Minimum Touch Target**: 44x44px (iOS guideline)

```tsx
{/* Visual size vs tap area */}
<button className="p-2 -m-2">
  <Icon className="h-5 w-5" />
  {/* Icon is 20x20, but button tap area is 36x36 */}
</button>
```

**Drag Handles**:
```tsx
<div className="p-3 -m-3 cursor-grab active:cursor-grabbing">
  <GripVertical className="h-4 w-4" />
</div>
```

### Performance Considerations

**Skeleton Loaders**:
```typescript
export function ActivityPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
    </div>
  );
}
```

**Suspense Boundaries**:
```typescript
<Suspense fallback={<ActivityPageSkeleton />}>
  <ActivityDetails activityId={params.id} />
</Suspense>
```

**Lazy Loading**:
```typescript
// Images (Next.js automatic)
<Image src={src} loading="lazy" />

// Components
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

---

## Forms & Validation

### React Hook Form + Zod Pattern

**Complete Form Example**:

```typescript
// 1. Define Zod schema
import { z } from "zod";

export const createTaskSchema = z.object({
  activityId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(255),
  estimatedMinutes: z.coerce.number().min(0).max(59),
  estimatedSeconds: z.coerce.number().min(0).max(59)
});

export type CreateTaskSchema = z.infer<typeof createTaskSchema>;

// 2. Form component
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function CreateTaskForm({ activityId, onSuccess }: Props) {
  const form = useForm<CreateTaskSchema>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      activityId,
      name: "",
      estimatedMinutes: 0,
      estimatedSeconds: 0
    }
  });

  async function onSubmit(data: CreateTaskSchema) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const result = await createTaskAction(formData);

    if (result.error) {
      // Handle field errors
      if (result.error.fieldErrors) {
        Object.entries(result.error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof CreateTaskSchema, {
            message: messages?.[0]
          });
        });
      }

      // Handle root error
      if (result.error.message) {
        form.setError("root", { message: result.error.message });
      }
    } else {
      onSuccess?.();
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter task name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="estimatedMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutes</FormLabel>
                <FormControl>
                  <Input type="number" {...field} min={0} max={59} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seconds</FormLabel>
                <FormControl>
                  <Input type="number" {...field} min={0} max={59} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </Form>
  );
}

// 3. Server Action — returns ActionResult<T>; no revalidatePath
export async function createTaskAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, errors: createZodError("Unauthorized") };
  }

  const parsed = createTaskSchema.safeParse({
    activityId: formData.get("activityId"),
    name: formData.get("name"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    estimatedSeconds: formData.get("estimatedSeconds")
  });

  if (!parsed.success) {
    return { success: false, errors: parseZodErrors(parsed) };
  }

  try {
    const task = await createTask({
      ...parsed.data,
      durationMs:
        (parsed.data.estimatedMinutes * 60 + parsed.data.estimatedSeconds) * 1000,
      userId: session.user.id
    });
    return { success: true, data: task };
  } catch (error) {
    return {
      success: false,
      errors: parseZodErrors(createZodError("Failed to create task"))
    };
  }
}
```

### Error Handling Pattern

**`ActionResult<T>` type** (`src/types.ts:37–39`):
```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; errors: FieldErrors };
```

`FieldErrors` is `import type { FieldErrors } from "react-hook-form"`. In this codebase `parseZodErrors` (in `src/lib/utils/form.ts:22-36`) constructs a flat record by joining each Zod issue path with `"."` (form.ts:27), so the runtime shape is effectively `Record<DottedPath, { type: "manual"; message: string }>` — keys like `"items.0.name"` rather than nested objects. Errors are forwarded directly to `form.setError` via the `setFormErrors` helper.

**Discriminating on the result**:
```typescript
const result = await someAction(formData);
if (result.success) {
  // result.data is T
} else {
  setFormErrors(form.setError, result.errors);
}
```

**Prisma error handling**: This codebase does not map Prisma errors to per-field Zod errors. The canonical pattern in Server Actions is to wrap service calls in `try/catch` and return `parseZodErrors(createZodError("..."))` from the catch branch (see the Server Action example above).

### Server actions / cache invalidation

**This codebase does NOT use `revalidatePath`, `revalidateTag`, or `unstable_cache`.** There are zero call sites for any of these in `src/`.

**How mutations propagate**:
- Server actions return `ActionResult<T>` and never call `revalidatePath`.
- Client components, after `result.success`, either:
  - call `router.push(newUrl)` when navigating to a newly created resource, or
  - call `router.refresh()` when staying on the same route.
  Both cause Next.js to re-execute the route's RSCs against the fresh DB.
- Server components fetch fresh data on every navigation because the routes touched by activity/category mutations don't opt into caching (no `export const revalidate`, no `fetch(..., { next: { revalidate } })`).

**Representative client mutation handler** (`src/components/upsert-activity-form.tsx:76–113`):
```typescript
const result = await createActivityAction(formData);
if (result.success) {
  if (activity) {
    router.refresh();           // updating in place
  } else {
    router.push(`/dashboard/activities/${result.data.id}`);  // created
  }
} else {
  setFormErrors(form.setError, result.errors);
}
```

---

## State Management

### No Global State Management Library

**Why no Redux/Zustand/Context**:
- Server Components handle most data fetching
- React Hook Form for form state
- Local `useState` for UI interactions
- URL state for filters/pagination

### State Patterns

**1. Server State (Fetch in Server Component)**:
```typescript
export default async function Page() {
  const activities = await getActivities({ userId: session.user.id });
  return <ClientComponent activities={activities} />;
}
```

**2. Form State (React Hook Form)**:
```typescript
const form = useForm<Schema>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

**3. UI State (Local useState)**:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState("all");
```

**4. URL State (Search Params)**:
```typescript
const searchParams = useSearchParams();
const page = searchParams.get("page") ?? "1";
const search = searchParams.get("search") ?? "";
```

**5. Toast State (Custom Hook)**:
```typescript
const { toast } = useToast();

toast({
  title: "Success",
  description: "Activity created successfully"
});
```

### Toast System

**Custom reducer-based toast**:

```typescript
// hooks/use-toast.ts
type ToastActionType = "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST";

type ToastState = {
  toasts: Toast[];
};

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        )
      };
    // Other cases...
  }
}

export function useToast() {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  function toast(props: Toast) {
    const id = genId();
    dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true } });
    return { id, dismiss: () => dismiss(id) };
  }

  return { toast, toasts: state.toasts, dismiss };
}
```

### Optimistic Updates

**Pattern**: Update UI immediately, revert on failure

```typescript
async function handleCompleteTask(taskId: string) {
  // Optimistic update
  setTasks((prev) =>
    prev.map((task) =>
      task.id === taskId ? { ...task, completedAt: new Date() } : task
    )
  );

  // Server action
  const result = await completeTaskAction(taskId);

  if (result.error) {
    // Revert on failure
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completedAt: null } : task
      )
    );

    toast({
      title: "Error",
      description: result.error.message,
      variant: "destructive"
    });
  }
}
```

---

## Best Practices

### 1. Type Safety

**Use TypeScript strictly**:
- Enable strict mode in `tsconfig.json`
- No `any` types (use `unknown` if needed)
- Infer types from Zod schemas
- Use Prisma's `GetPayload` for query types

**Example**:
```typescript
// ❌ Bad
function getActivity(id: any): any { ... }

// ✅ Good
export async function getActivity(
  params: GetActivityParams
): Promise<ActivityWithTasksAndTimeEntries> { ... }
```

### 2. Server Components First

**Default to Server Components**:
- Fetch data server-side
- Reduce JavaScript sent to client
- Better SEO and initial load performance
- Only use Client Components when needed

**Example**:
```typescript
// ✅ Good - Server Component
export default async function Page() {
  const data = await fetchData();
  return <ClientInteraction data={data} />;
}

// ❌ Bad - Unnecessary Client Component
"use client";
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchData().then(setData); }, []);
  return <div>{data}</div>;
}
```

### 3. Validation Everywhere

**Validate at multiple layers**:
- Client: React Hook Form + Zod (UX)
- Server: Zod validation in Server Actions (Security)
- Database: Prisma schema constraints (Data integrity)

### 4. Error Handling

**Comprehensive error handling**:
- Try-catch in Server Actions
- Transform Prisma errors to user-friendly messages
- Map Zod errors to form fields
- Display errors with toast notifications

### 5. Accessibility

**ARIA labels and semantic HTML**:
```typescript
<button aria-label="Delete activity">
  <Trash2 className="h-4 w-4" />
</button>

<nav aria-label="Main navigation">
  {/* Navigation links */}
</nav>
```

### 6. Performance

**Optimize data fetching**:
- Only fetch required fields with Prisma `select`
- Use indexes on frequently queried fields
- Paginate large lists
- Use Suspense for progressive loading

**Example**:
```typescript
// ✅ Good - Only fetch needed fields
const activities = await prisma.activity.findMany({
  select: { id: true, name: true, createdAt: true },
  take: 10
});

// ❌ Bad - Fetch everything
const activities = await prisma.activity.findMany();
```

### 7. Security

**Authentication checks**:
- Every Server Action checks `await auth()`
- Every protected page redirects if not authenticated
- Never expose sensitive data in client components

**Rate limiting**:
```typescript
// lib/rate-limiter/index.ts
import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});
```

### 8. Code Organization

**Single Responsibility Principle**:
- One component per file
- One service function per file
- One schema per file
- Clear separation of concerns

### 9. DRY (Don't Repeat Yourself)

**Reusable utilities**:
```typescript
// lib/utils/time.ts
export function formatTimeMMss(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Used across multiple components
<Badge>{formatTimeMMss(task.durationMs)}</Badge>
```

### 10. Testing Data

**Use Faker.js for seeds**:
```typescript
// prisma/seed.ts
import { faker } from "@faker-js/faker";

const user = await prisma.user.create({
  data: {
    email: faker.internet.email(),
    activities: {
      create: Array.from({ length: 10 }, () => ({
        name: faker.company.catchPhrase(),
        description: faker.lorem.sentence()
      }))
    }
  }
});
```

---

## Testing

**Runner**: Vitest. Config at `vitest.config.ts` — Node environment, `@` alias resolves to `./src`, single-fork pool (`pool: "forks"`, `maxWorkers: 1`, `fileParallelism: false`) because every test shares the same Postgres database.

**Test files** live next to the service they cover: `src/lib/services/<name>.test.ts`.

**DB safety invariant**: `vitest.setup.ts` (line 14) refuses to TRUNCATE unless the database name in `DATABASE_TEST_URL` contains the substring `"test"` (case-insensitive). This guard exists to prevent accidentally wiping a dev or prod database — don't bypass it. The DB name is parsed from the URL pathname via `new URL(url).pathname.slice(1)`.

**npm scripts** (`package.json:14-20`):
- `npm test` — runs `pretest` (which calls `test:setup`: re-exports `DATABASE_TEST_URL` as `DATABASE_URL` inside a `bash -c` subshell and runs `prisma migrate deploy`), then `vitest run`.
- `npm run test:watch` — same setup, then `vitest` in watch mode.
- `npm run test:coverage` — vitest run with `--coverage` (v8 provider).

`bash` is required because `test:setup` uses bash variable expansion. macOS/Linux have it by default; Windows users need WSL2 or Git Bash.

**CI**: `.github/workflows/ci.yml` runs on every push and PR to `main` — spins up a Postgres 16 service container, installs Node 22 (matches `.nvmrc`), runs `prisma generate` + `prisma migrate deploy`, then `npm run lint`, `npm run typecheck`, and `npx vitest run` (bypasses the `pretest` hook because CI's own setup step has already migrated the DB).

---

## Development Workflow

### Setup

```bash
# Install Node.js version
nvm install
nvm use

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with database URL and API keys

# Generate Prisma client
npx prisma generate

# Run migrations and seed
npx prisma migrate dev
```

### Development

```bash
# Start development server (with Turbopack)
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Database Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

### Git Workflow

**Branch naming**:
- Feature: `feature/description`
- Bug fix: `fix/description`
- Chore: `chore/description`

**Commit messages**:
- Format: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat: add task drag-and-drop reordering`

### Code Review Checklist

When reviewing code, check for:
- [ ] Type safety (no `any` types)
- [ ] Server Component used when possible
- [ ] Authentication checks in Server Actions
- [ ] Zod validation on user input
- [ ] Error handling with try-catch
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels, semantic HTML)
- [ ] Performance (Suspense, lazy loading, pagination)
- [ ] No security vulnerabilities (XSS, SQL injection, etc.)
- [ ] Consistent naming conventions

---

## Summary

**findmomentum** is a modern, type-safe Next.js application with:

1. **Architecture**: Server Components first, Client Components for interactivity
2. **Data**: Prisma ORM with PostgreSQL, strong typing via `GetPayload`
3. **Auth**: NextAuth v5 with email OTP flow
4. **UI**: shadcn/ui components, Tailwind CSS, mobile-first responsive design
5. **Forms**: React Hook Form + Zod for validation
6. **State**: Server-side data, local UI state, no global state library
7. **Patterns**: Action → Service → Prisma for all mutations
8. **Best Practices**: Type safety, security, performance, accessibility

**Key Principles**:
- Mobile-first (primary users are on mobile devices)
- Type safety at every layer
- Server Components for performance
- Comprehensive validation and error handling
- Clean separation of concerns

This document should be updated as new patterns emerge or architectural decisions are made.
