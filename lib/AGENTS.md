# AGENTS.md - lib/

**Generated:** 2026-01-20
**Purpose:** Shared utilities and core library functions.

## OVERVIEW

Utility functions and core adapters used across the application.

## STRUCTURE

```
lib/
├── resumable-stream.ts # VoltAgent resumable stream adapter
└── utils.ts            # Common utilities (cn, etc.)
```

## WHERE TO LOOK

| Task               | Location              | Notes                                   |
| ------------------ | --------------------- | --------------------------------------- |
| **Class Merging**  | `utils.ts`            | `cn()` function (clsx + tailwind-merge) |
| **Stream Adapter** | `resumable-stream.ts` | Adapter for resumable AI chat streams   |

## CONVENTIONS

- **Pure Functions**: Utilities should generally be pure functions.
- **Type Safety**: Strict TypeScript types for all utility arguments.

## ANTI-PATTERNS

- **Component Logic**: Do not put React component logic here.
- **State**: Avoid stateful logic in `lib/`.
