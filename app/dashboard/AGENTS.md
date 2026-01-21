# AGENTS.md

AI agents working on this dashboard should use this file as the authoritative source for project structure, development commands, and code conventions.

## Dashboard Overview

**Mastervolt Deep Research Dashboard** - Next.js UI for VoltAgent-based AI research system with real-time chat, message rendering, and model selection.

### Key Technologies

- **Framework**: Next.js 16.x (app/ directory)
- **UI Components**: AI Elements from `@/components/ai-elements/*`
- **Chat Interface**: `@/components/chat-interface.tsx` (main chat component using useChat)
- **State Management**: React hooks, VoltAgent memory
- **API Integration**: `/api/chat/*` endpoints
- **Styling**: Tailwind CSS, Shadcn UI components

## Project Structure

```
app/dashboard/
├── _components/              # Dashboard-specific React components
│   ├── chat-panel.tsx        # Main chat container (legacy, use chat-interface.tsx)
│   ├── chat-messages.tsx     # Message rendering with ai-elements
│   ├── chat-input.tsx        # Input with model selector, speech, web preview
│   ├── chat-header.tsx       # Chat header with status
│   ├── sidebar.tsx           # Sidebar navigation
│   ├── artifact-panel.tsx    # Artifact display panel
│   └── chat-panel.tsx        # Chat container (references ChatInterface)
├── chat/                     # Chat page routes
│   ├── page.tsx              # Chat page entry point (uses ChatInterface)
│   └── AGENTS.md             # Chat module documentation
├── workflows/                # Workflow management
│   └── page.tsx              # Workflows page
├── observability/            # Monitoring dashboard
│   └── page.tsx              # Observability page
├── research/                 # Research features
│   └── page.tsx              # Research page
├── models.ts                 # AI model catalog (latest models)
├── layout.tsx                # Dashboard layout
├── page.tsx                  # Dashboard home page
├── AGENTS.md                 # This file - Dashboard documentation
└── README.md                 # Dashboard README

app/api/chat/                 # Chat API endpoints
├── route.ts                  # POST - Send message, create stream
└── [id]/
    └── stream/route.ts       # GET - Resume stream

app/api/
├── messages/route.ts         # GET - Retrieve messages via sharedMemory
└── health/route.ts           # GET - Health check

components/
├── chat-interface.tsx        # MAIN CHAT COMPONENT - Use this for all chat functionality
├── ai-elements/              # AI visualization components (50+ components)
│   ├── conversation.tsx      # Conversation container, empty state, scroll
│   ├── message.tsx           # Message, content, response, actions
│   ├── prompt-input.tsx      # Input with textarea, buttons, footer
│   ├── suggestion.tsx        # Suggestion chips
│   ├── tool.tsx              # Tool call display (header, content, input, output)
│   ├── reasoning.tsx         # Chain of thought visualization
│   ├── sources.tsx           # Citation sources
│   ├── persona.tsx           # Assistant avatar
│   ├── artifact.tsx          # Code artifacts
│   ├── code-block.tsx        # Syntax highlighted code
│   ├── terminal.tsx          # Terminal output
│   ├── stack-trace.tsx       # Error stack traces
│   ├── file-tree.tsx         # File/folder structure
│   ├── test-results.tsx      # Test suite results
│   ├── agent.tsx             # Agent configuration display
│   ├── sandbox.tsx           # Sandbox with tabs
│   ├── schema-display.tsx    # API schema documentation
│   ├── snippet.tsx           # Inline code snippet
│   ├── package-info.tsx      # Package version info
│   ├── checkpoint.tsx        # Progress checkpoint
│   ├── confirmation.tsx       # Tool approval UI
│   ├── loader.tsx            # Loading indicator
│   ├── shimmer.tsx           # Shimmer effects
│   └── ...                   # Additional components
└── ui/                       # Shadcn UI components
    ├── button.tsx
    ├── input-group.tsx
    ├── collapsible.tsx
    ├── tabs.tsx
    ├── accordion.tsx
    ├── badge.tsx
    ├── alert.tsx
    ├── separator.tsx
    ├── select.tsx
    └── tooltip.tsx

voltagent/
├── config/
│   ├── libsql.ts             # sharedMemory configuration
│   ├── logger.ts             # Pino logger
│   ├── mcp.ts                # MCP client
│   ├── mcpserver.ts          # MCP server
│   ├── retriever.ts          # Vector DB config
│   ├── scorers.ts            # Evaluation scoring
│   └── supabase.ts           # Supabase client
├── agents/
│   ├── plan.agent.ts         # Deep planning agent
│   ├── assistant.agent.ts    # Query generation
│   ├── writer.agent.ts       # Report synthesis
│   ├── director.agent.ts     # Supervisor
│   ├── data-analyzer.agent.ts
│   ├── fact-checker.agent.ts
│   ├── synthesizer.agent.ts
│   ├── scrapper.agent.ts
│   ├── coding.agent.ts
│   ├── code-reviewer.agent.ts
│   ├── judge.agent.ts
│   ├── research-coordinator.agent.ts
│   ├── content-curator.agent.ts
│   ├── data-scientist.agent.ts
│   └── prompts.ts
├── tools/
│   ├── reasoning-tool.ts
│   ├── debug-tool.ts
│   ├── web-scraper-toolkit.ts
│   ├── filesystem-toolkit.ts
│   ├── data-processing-toolkit.ts
│   ├── knowledge-graph-toolkit.ts
│   ├── api-integration-toolkit.ts
│   ├── code-analysis-toolkit.ts
│   ├── rag-toolkit.ts
│   ├── test-toolkit.ts
│   ├── git-toolkit.ts
│   └── ...
├── a2a/
│   ├── server.ts
│   └── store.ts
├── retriever/
│   └── qdrant.ts
├── workflows/
├── experiments/
└── config/
```

## Key Files

### Chat Components

| File                                          | Purpose                                                                   | Use                               |
| --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| `components/chat-interface.tsx`               | **MAIN COMPONENT** - Full chat with useChat, transport, message rendering | **USE THIS**                      |
| `app/dashboard/_components/chat-panel.tsx`    | Legacy container                                                          | Deprecated                        |
| `app/dashboard/_components/chat-messages.tsx` | Enhanced message rendering with all ai-elements                           | Used by ChatInterface             |
| `app/dashboard/_components/chat-input.tsx`    | Input with model selector, speech, web preview                            | Used by ChatPanel                 |
| `app/dashboard/models.ts`                     | AI model catalog (Gemini 3, Claude Opus 4.5+)                             | Import MODELS, DEFAULT_FAST_MODEL |

### API Routes

| Route                   | Method | Purpose                               |
| ----------------------- | ------ | ------------------------------------- |
| `/api/chat`             | POST   | Send message, create resumable stream |
| `/api/chat/[id]/stream` | GET    | Resume stream from session            |
| `/api/messages`         | GET    | Retrieve messages via sharedMemory    |
| `/api/health`           | GET    | Health check                          |

## Chat Component Usage

### Main Chat Component (RECOMMENDED)

```typescript
import { ChatInterface } from '@/components/chat-interface'

export default function ChatPage() {
    return (
        <ChatInterface
            chatId="unique-id"
            userId="user-id"
            initialMessages={[]}
            resume={true}
        />
    )
}
```

### ChatInterface Props

```typescript
interface ChatInterfaceProps {
    chatId: string // Unique conversation ID
    userId: string // User identifier for memory
    initialMessages: UIMessage[] // Starting messages
    resume?: boolean // Resume from stream (default: true)
}
```

### AI SDK Types Used

```typescript
import type { UIMessage, TextUIPart, ReasoningUIPart, ToolUIPart } from 'ai'
import { isToolUIPart, getToolName, generateId } from 'ai'
import type { IdGenerator } from '@ai-sdk/provider-utils'
```

## Message Rendering

### Text Parts

```typescript
if (part.type === 'text') {
    const textPart = part as TextUIPart
    return <MessageResponse>{textPart.text}</MessageResponse>
}
```

### Reasoning Parts

```typescript
if (part.type === 'reasoning') {
    const reasoningPart = part as ReasoningUIPart
    return (
        <Reasoning>
            <ReasoningContent>{reasoningPart.text}</ReasoningContent>
        </Reasoning>
    )
}
```

### Tool Calls

```typescript
if (isToolUIPart(part)) {
    const toolPart = part as ToolUIPart
    const toolName = getToolName(toolPart)
    return (
        <Tool>
            <ToolHeader title={toolName} state={toolPart.state} />
            <ToolContent>
                <ToolInput input={toolPart.input} />
                <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
            </ToolContent>
        </Tool>
    )
}
```

## Enhanced Tool Outputs

### Terminal

```typescript
if (toolPart.output?.type === 'terminal') {
    return <Terminal output={toolPart.output.content} />
}
```

### Stack Trace

```typescript
if (toolPart.output?.type === 'stack-trace') {
    return <StackTrace trace={toolPart.output.trace} />
}
```

### Code Block

```typescript
if (toolPart.output?.type === 'code') {
    return (
        <CodeBlock
            code={toolPart.output.code}
            language={toolPart.output.language}
        />
    )
}
```

### File Tree

```typescript
if (toolPart.output?.type === 'file-tree') {
    return <FileTree>{renderFileTree(toolPart.output.files)}</FileTree>
}
```

### Test Results

```typescript
if (toolPart.output?.type === 'test-results') {
    return renderTestResults(toolPart.output.suites)
}
```

### Agent Display

```typescript
if (toolPart.output?.type === 'agent') {
    return (
        <Agent>
            <AgentHeader name={toolPart.output.agent.name} model={toolPart.output.agent.model} />
            <AgentContent>
                <AgentInstructions>{toolPart.output.agent.instructions}</AgentInstructions>
            </AgentContent>
        </Agent>
    )
}
```

### Sandbox

```typescript
if (toolPart.output?.type === 'sandbox') {
    return (
        <Sandbox>
            <SandboxHeader title={toolPart.output.sandbox.title} state={toolPart.state} />
            <SandboxContent>
                <SandboxTabs>
                    <SandboxTabsTrigger value="terminal">Terminal</SandboxTabsTrigger>
                    <SandboxTabsTrigger value="files">Files</SandboxTabsTrigger>
                    <SandboxTabsTrigger value="tests">Tests</SandboxTabsTrigger>
                </SandboxTabs>
            </SandboxContent>
        </Sandbox>
    )
}
```

### Schema Display

```typescript
if (toolPart.output?.type === 'schema') {
    return (
        <SchemaDisplay
            method={toolPart.output.method}
            path={toolPart.output.path}
            parameters={toolPart.output.parameters}
            requestBody={toolPart.output.requestBody}
            responseBody={toolPart.output.responseBody}
        />
    )
}
```

### Snippet

```typescript
if (toolPart.output?.type === 'snippet') {
    return (
        <Snippet code={toolPart.output.code}>
            <SnippetText>{toolPart.output.label}</SnippetText>
            <SnippetCopyButton />
        </Snippet>
    )
}
```

### Package Info

```typescript
if (toolPart.output?.type === 'package-info') {
    return (
        <PackageInfo
            name={toolPart.output.package.name}
            currentVersion={toolPart.output.package.currentVersion}
            newVersion={toolPart.output.package.newVersion}
            changeType={toolPart.output.package.changeType}
        />
    )
}
```

### Checkpoint

```typescript
if (toolPart.output?.type === 'checkpoint') {
    return (
        <Checkpoint>
            <CheckpointIcon>{statusIcons[toolPart.output.status]}</CheckpointIcon>
            <span>{toolPart.output.label}</span>
        </Checkpoint>
    )
}
```

### Confirmation

```typescript
if (toolPart.output?.type === 'confirmation') {
    return (
        <Confirmation approval={approval} state={toolPart.state}>
            <ConfirmationTitle>{toolPart.output.message}</ConfirmationTitle>
            <ConfirmationActions>
                <ConfirmationAction>Approve</ConfirmationAction>
                <ConfirmationAction>Deny</ConfirmationAction>
            </ConfirmationActions>
        </Confirmation>
    )
}
```

## Model Selection

```typescript
import {
    MODELS,
    DEFAULT_FAST_MODEL,
    DEFAULT_SMART_MODEL,
} from '@/app/dashboard/models'

// Select a model
const selectedModel = MODELS['google/gemini-3-flash']

// Use in chat transport
const transport = new DefaultChatTransport({
    api: '/api/chat',
    prepareSendMessagesRequest: ({ messages }) => ({
        body: {
            input: [messages[messages.length - 1]],
            options: {
                conversationId: id,
                userId,
                context: {
                    timezone: getTimezone(),
                    model: selectedModel.id,
                },
            },
        },
    }),
})
```

## Chat Transport

```typescript
import { DefaultChatTransport } from 'ai'
import { createResumableChatSession } from '@voltagent/resumable-streams'

const transport = new DefaultChatTransport({
    api: '/api/chat',
    prepareSendMessagesRequest: ({ id, messages }) => {
        const lastMessage = messages[messages.length - 1]
        return {
            body: {
                input: [lastMessage],
                options: {
                    conversationId: id,
                    userId,
                    context: { timezone: getTimezone() },
                },
            },
        }
    },
    prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/chat/${id}/stream?userId=${encodeURIComponent(userId)}`,
    }),
})
```

## ID Generation

Use AI SDK's `generateId` for message IDs:

```typescript
import { generateId } from 'ai'

const messageId = generateId()
// or with custom generator
import { createIdGenerator } from '@ai-sdk/provider-utils'
const customGenerateId = createIdGenerator({ prefix: 'msg_' })
const id = customGenerateId()
```

## Shared Memory Integration

```typescript
import { sharedMemory } from '@/voltagent/config/libsql.js'

// Get messages for a conversation
const messages = await sharedMemory.getMessages(userId, conversationId)

// Add a single message
await sharedMemory.addMessage(message, userId, conversationId)

// Add multiple messages
await sharedMemory.addMessages(messages, userId, conversationId)

// Clear messages
await sharedMemory.clearMessages(userId, conversationId)
```

## API Route Patterns

### POST /api/chat

```typescript
export async function POST(req: Request) {
    const body = await req.json()
    const { input, options } = body

    // Validate input
    if (!input) {
        return jsonError(400, 'Message input is required')
    }

    // Save to sharedMemory
    await sharedMemory.addMessage(userMessage, userId, conversationId)

    // Stream response
    const result = await deepAgent.streamText(input, {
        userId,
        conversationId,
    })

    return result.toUIMessageStreamResponse({
        consumeSseStream: session.consumeSseStream,
        onFinish: session.onFinish,
    })
}
```

### GET /api/messages

```typescript
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')

    const uiMessages = await sharedMemory.getMessages(userId!, conversationId!)

    return Response.json({ data: uiMessages || [] })
}
```

## Development

### Start Dashboard

```bash
npm run next        # Start Next.js dev server
npm run dev         # Start full dev server
```

### Key Patterns

- Use `ChatInterface` from `components/chat-interface.tsx` for all chat functionality
- Use `generateId` from `ai` for message IDs
- Use `parts` array instead of `content` string for UIMessage
- Use `addMessage`/`addMessages` for sharedMemory persistence
- Use `DefaultChatTransport` with resumable streams

## Code Style

- **Files**: kebab-case (e.g., `chat-interface.tsx`, `chat-messages.tsx`)
- **Components**: PascalCase (e.g., `ChatInterface`, `ChatMessages`)
- **Props**: camelCase
- **Imports**: Use `.js` extension for internal imports
- **No default exports** for components
- **AI SDK Types**: Import from `ai` (UIMessage, TextUIPart, etc.)
- **AI SDK Utils**: Import `generateId`, `getToolName`, `isToolUIPart` from `ai`

## Quick Reference

### Commands

```bash
npm run next        # Start Next.js dev server
npm run dev         # Start full dev server (includes VoltAgent)
npm run build       # Build for production
```

### AI SDK Imports

```typescript
// Types
import type { UIMessage, TextUIPart, ReasoningUIPart, ToolUIPart } from 'ai'

// Functions
import { generateId, getToolName, isToolUIPart } from 'ai'

// Provider utils
import { createIdGenerator } from '@ai-sdk/provider-utils'
```

### Component Imports

```typescript
// Chat (USE THIS)
import { ChatInterface } from '@/components/chat-interface'

// AI Elements
import {
    Message,
    MessageContent,
    MessageResponse,
} from '@/components/ai-elements/message'
import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool'
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { Terminal } from '@/components/ai-elements/terminal'
import { StackTrace } from '@/components/ai-elements/stack-trace'
import { FileTree } from '@/components/ai-elements/file-tree'
import { TestResults } from '@/components/ai-elements/test-results'
import { Agent } from '@/components/ai-elements/agent'
import { Sandbox } from '@/components/ai-elements/sandbox'
import { SchemaDisplay } from '@/components/ai-elements/schema-display'
import { Snippet } from '@/components/ai-elements/snippet'
import { PackageInfo } from '@/components/ai-elements/package-info'
import { Checkpoint } from '@/components/ai-elements/checkpoint'
import { Confirmation } from '@/components/ai-elements/confirmation'
```

---

**Related**:

- [Chat Module AGENTS.md](./chat/AGENTS.md)
- [Root AGENTS.md](../../AGENTS.md)
- [VoltAgent AGENTS.md](../../voltagent/AGENTS.md)

**Last Updated**: January 2026
