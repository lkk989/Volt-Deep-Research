# AGENTS.md - components/

**Generated:** 2026-01-20
**Stack:** React, Shadcn UI, Tailwind CSS

## OVERVIEW

Reusable UI components. Divided into standard UI elements (Shadcn) and specialized AI interaction elements.

## STRUCTURE

```
components/
├── ai-elements/      # Specialized AI UI components (Chat, Artifacts, etc.)
├── ui/               # Standard Shadcn UI components
│   ├── base/         # Core primitives (Button, Input, etc.)
│   └── ...           # Compound components
└── theme-provider.tsx # Next-themes provider wrapper
```

## WHERE TO LOOK

| Task            | Location             | Notes                                     |
| --------------- | -------------------- | ----------------------------------------- |
| **AI Chat UI**  | `ai-elements/`       | Components for chat, artifacts, reasoning |
| **Standard UI** | `ui/`                | Buttons, Dialogs, Cards, etc.             |
| **Theme Logic** | `theme-provider.tsx` | Dark/Light mode handling                  |

## KEY COMPONENTS (AI ELEMENTS)

- **Artifact**: Container for generated content (`artifact.tsx`)
- **ChainOfThought**: Visualization of reasoning steps (`chain-of-thought.tsx`)
- **Message**: Chat message bubble (`message.tsx`)
- **PromptInput**: User input area (`prompt-input.tsx`)
- **Canvas**: Infinite canvas for node-based interactions (`canvas.tsx`)

## CONVENTIONS

- **Exports**: Named exports preferred.
- **Props**: Define `Interface` or `Type` for props (e.g., `ArtifactProps`).
- **Styling**: Use `cn()` utility for class merging.
- **Icons**: Lucide React (`lucide-react`).

## ANTI-PATTERNS

- **Business Logic**: Components should be presentational. Move logic to hooks or parent pages.
- **Hardcoded Colors**: Use CSS variables (e.g., `bg-background`, `text-foreground`) for theme support.
