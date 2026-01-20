# Technology Stack: Mastervolt Deep Research

## Core Runtime & Language
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.9.3 (Strict Mode)

## AI & Orchestration
- **Framework:** VoltAgent v2.1.3
- **Provider Abstraction:** Vercel AI SDK (ai ^6.0.42)
- **Primary Models:** Google Gemini (via `@ai-sdk/google`)
- **Secondary Models:** OpenAI (via `@ai-sdk/openai`), Vertex AI
- **Observability:** OpenTelemetry with VoltOps integration

## Frontend & UI
- **Framework:** Next.js 16.1.4 (App Router)
- **UI Foundation:** React 19.2.3, Tailwind CSS 4.0
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Animation:** GSAP 3.14.2, `@gsap/react`, Motion 12.27.3
- **Graph/Flow Management:** `@xyflow/react` 12.10.0
- **Icons:** Lucide React

## Data & Storage
- **Primary Database:** LibSQL (via `@voltagent/libsql`)
- **Shared Vector Store:** LibSQL Vector Adapter
- **Distributed State:** Supabase (via `@supabase/supabase-js`)
- **Server Framework:** Hono (via `@voltagent/server-hono`)

## Tooling & Infrastructure
- **Package Manager:** npm
- **Build Tool:** tsx, dotenvx
- **Testing:** Vitest 4.0.17
- **Linting:** ESLint 9.39.2, Prettier 3.8.0
