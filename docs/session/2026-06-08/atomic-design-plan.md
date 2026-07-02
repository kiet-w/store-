# Superpower Plan: Frontend Architecture & Atomic Design

## 1. Turbopack Watch Limit Issue (Fixed)
The error `OS file watch limit reached` occurs because Next.js inferred the workspace root to be your home directory `/home/baudui` (due to `package-lock.json` presence).
**Fix Applied:** We updated `next.config.ts` to strictly scope the watch directory:
```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // ...
};
```

## 2. Atomic Design Component Restructure
Currently, components in `src/components/` are flat (`NoteCard.tsx`, `NoteInput.tsx`, `Sidebar.tsx`). We will organize them into the Atomic Design methodology.

### `src/components/atoms/`
Basic UI elements that can't be broken down further.
- `Button.tsx` (Reusable clickables)
- `Input.tsx` (Base text inputs)
- `Badge.tsx` (Status indicators: PROCESSING, COMPLETED)
- `Icon.tsx` (Lucide-react wrappers)

### `src/components/molecules/`
Simple UI combinations of atoms.
- `NoteInput.tsx` (Input + Button combined)
- `SkeletonCard.tsx` (Loading state for notes)
- `CategoryLink.tsx` (Sidebar link + Icon)

### `src/components/organisms/`
Complex, distinct sections of the UI.
- `Sidebar.tsx` (Collection of CategoryLinks and navigation)
- `NoteCard.tsx` (Combination of Typography, Badges, and content blocks)
- `NoteList.tsx` (The feed rendering multiple NoteCards)

### `src/components/templates/`
Page-level layouts that arrange organisms but don't inject data directly.
- `MainTemplate.tsx` (Defines the Grid/Flex layout of Sidebar left + Content right)

## 3. Next.js `@app` Directory Structure
The App Router (`src/app`) will be refined to follow best practices:
- **`src/app/layout.tsx`**: Root layout. Will wrap the application in global providers (e.g., Theme, React Query if used) and the `MainTemplate`.
- **`src/app/page.tsx`**: Root page. Will handle data fetching (or initial state) and pass data down to organisms (like `NoteList`).
- **(Future) Routing**: If we want category-specific URLs (e.g., `/category/tech`), we will add dynamic routes `src/app/category/[slug]/page.tsx` to handle server-side params.

## 4. Next Actions
If approved, we can begin:
1. Creating the folder structure (`atoms`, `molecules`, `organisms`, `templates`).
2. Breaking down `Sidebar`, `NoteInput`, and `NoteCard` into smaller atoms.
3. Refactoring `layout.tsx` and `page.tsx` to consume the new component hierarchy.
