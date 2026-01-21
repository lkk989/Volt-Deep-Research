# AGENTS.md - app/

**Generated:** 2026-01-20
**Framework:** Next.js 16 (App Router)

## OVERVIEW

Frontend application routes and pages. Uses Next.js App Router with Shadcn UI and Tailwind CSS.

## STRUCTURE

```
app/
├── about/            # About page
├── dashboard/        # User dashboard (protected)
├── documentation/    # Docs pages
├── features/         # Feature showcase
├── pricing/          # Pricing page
├── global.css        # Global styles (Tailwind + CSS variables)
├── layout.tsx        # Root layout (Providers: Theme, Toast, SmoothScroll)
└── page.tsx          # Landing page
```

## WHERE TO LOOK

| Task                 | Location     | Notes                           |
| -------------------- | ------------ | ------------------------------- |
| **Layout/Providers** | `layout.tsx` | Root providers (Theme, Toaster) |
| **Global Styles**    | `global.css` | Tailwind directives, CSS vars   |
| **Landing Page**     | `page.tsx`   | Main entry point                |

## CONVENTIONS

- **Client Components**: Use `"use client"` at top of file.
- **Styling**: Tailwind CSS via `className`. Use `cn()` for conditional classes.
- **Fonts**: Geist Sans / Geist Mono via `next/font/google`.
- **Metadata**: Export `metadata` object for SEO.

## ANTI-PATTERNS

- **Direct CSS**: Avoid CSS modules or inline styles; use Tailwind.
- **Heavy Client Components**: Keep leaf nodes as client components; keep layouts server-side.
