'use client'

import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
    Message,
    MessageContent,
    MessageResponse,
    MessageActions,
    MessageAction,
} from '@/components/ai-elements/message'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool'
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
    Sources,
    SourcesTrigger,
    SourcesContent,
    Source,
} from '@/components/ai-elements/sources'
import { Persona } from '@/components/ai-elements/persona'
import {
    Artifact,
    ArtifactHeader,
    ArtifactContent,
    ArtifactClose,
    ArtifactTitle,
    ArtifactDescription,
    ArtifactActions,
    ArtifactAction,
} from '@/components/ai-elements/artifact'
import { CodeBlock } from '@/components/ai-elements/code-block'
import {
    Terminal,
    TerminalHeader,
    TerminalTitle,
    TerminalContent,
} from '@/components/ai-elements/terminal'
import {
    StackTrace,
    StackTraceHeader,
    StackTraceError,
    StackTraceErrorType,
    StackTraceErrorMessage,
    StackTraceContent,
    StackTraceFrames,
    StackTraceActions,
    StackTraceCopyButton,
} from '@/components/ai-elements/stack-trace'
import {
    Sandbox,
    SandboxHeader,
    SandboxContent,
    SandboxTabs,
    SandboxTabsBar,
    SandboxTabsList,
    SandboxTabsTrigger,
    SandboxTabContent,
} from '@/components/ai-elements/sandbox'
import {
    FileTree,
    FileTreeFolder,
    FileTreeFile,
    FileTreeIcon,
    FileTreeName,
} from '@/components/ai-elements/file-tree'
import {
    TestResults,
    TestResultsHeader,
    TestResultsSummary,
    TestResultsDuration,
    TestResultsProgress,
    TestResultsContent,
    TestSuite,
    TestSuiteName,
    TestSuiteStats,
    TestSuiteContent,
    Test,
    TestStatus,
    TestName,
    TestDuration,
    TestError,
    TestErrorMessage,
    TestErrorStack,
} from '@/components/ai-elements/test-results'
import {
    Agent,
    AgentHeader,
    AgentContent,
    AgentInstructions,
    AgentTools,
    AgentTool,
} from '@/components/ai-elements/agent'
import {
    Checkpoint,
    CheckpointIcon,
    CheckpointTrigger,
} from '@/components/ai-elements/checkpoint'
import {
    Confirmation,
    ConfirmationTitle,
    ConfirmationRequest,
    ConfirmationAccepted,
    ConfirmationRejected,
    ConfirmationActions,
    ConfirmationAction,
} from '@/components/ai-elements/confirmation'
import {
    SchemaDisplay,
    SchemaDisplayHeader,
    SchemaDisplayMethod,
    SchemaDisplayPath,
    SchemaDisplayDescription,
    SchemaDisplayContent,
    SchemaDisplayParameters,
    SchemaDisplayParameter,
    SchemaDisplayRequest,
    SchemaDisplayResponse,
    SchemaDisplayBody,
    SchemaDisplayProperty,
    SchemaDisplayExample,
} from '@/components/ai-elements/schema-display'
import {
    Snippet,
    SnippetText,
    SnippetInput,
    SnippetCopyButton,
} from '@/components/ai-elements/snippet'
import {
    PackageInfo,
    PackageInfoName,
    PackageInfoChangeType,
    PackageInfoVersion,
    PackageInfoDescription,
    PackageInfoContent,
    PackageInfoDependencies,
    PackageInfoDependency,
} from '@/components/ai-elements/package-info'
import {
    CodeIcon,
    FileJsonIcon,
    HistoryIcon,
    CheckCircle2Icon,
    XCircleIcon,
    Sparkles,
    CopyIcon,
    RefreshCwIcon,
    CheckIcon,
    TerminalIcon,
    FileIcon,
    FolderIcon,
} from 'lucide-react'
import { useState, useCallback, memo } from 'react'
import type {
    DataUIPart,
    FileUIPart,
    ReasoningUIPart,
    SourceDocumentUIPart,
    SourceUrlUIPart,
    StepStartUIPart,
    TextUIPart,
    ToolUIPart,
    DynamicToolUIPart,
    UIDataTypes,
    UIMessage,
} from 'ai'
import { getToolName, isDataUIPart, isToolUIPart } from 'ai'
import { messageHelpers } from '@voltagent/core'

interface ChatMessagesProps {
    messages: UIMessage[]
    status: string
    error: Error | undefined
    onSuggestionClick: (suggestion: string) => void
    onCopyMessage?: (messageId: string, content: string) => void
    onRegenerate?: (messageId: string) => void
}

interface SourceDocument {
    title?: string
    url?: string
    description?: string
    sourceDocument?: string
}

// Example prompts for research-focused chat
const EXAMPLE_PROMPTS = [
    'Research the latest developments in quantum computing',
    'Analyze the impact of AI on healthcare industry',
    'Find information about sustainable energy solutions',
    'Compare different machine learning frameworks',
]

export function ChatMessages({
    messages,
    status,
    error,
    onSuggestionClick,
    onCopyMessage,
    onRegenerate,
}: ChatMessagesProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = useCallback(
        async (messageId: string, content: string) => {
            await navigator.clipboard.writeText(content)
            setCopiedId(messageId)
            setTimeout(() => setCopiedId(null), 2000)
            onCopyMessage?.(messageId, content)
        },
        [onCopyMessage]
    )

    // Get text content from message parts using message helpers
    const getMessageText = useCallback((message: UIMessage): string => {
        return messageHelpers.extractText(message)
    }, [])

    // Extract sources from message parts
    const getSourcesFromParts = (parts: UIMessage['parts']): SourceDocument[] => {
        const sources: SourceDocument[] = []
        for (const part of parts) {
            if (isSourceUrlPart(part)) {
                sources.push({
                    title: part.title,
                    url: part.url,
                    description: part.url,
                })
                continue
            }

            if (isSourceDocumentPart(part)) {
                sources.push({
                    title: part.title,
                    description: part.filename ?? part.mediaType,
                })
            }
        }
        return sources
    }

    return (
        <Conversation className="flex-1">
            <ConversationContent className="space-y-6 p-6">
                {messages.length === 0 ? (
                    <ConversationEmptyState
                        title="Welcome to Mastervolt Deep Research"
                        description="Start a conversation by selecting a suggestion below or type your own research query"
                        icon={
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/10">
                                <Sparkles className="h-10 w-10 text-primary" />
                            </div>
                        }
                    >
                        <div className="mt-8 w-full max-w-3xl space-y-3">
                            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                                Try these research topics
                            </p>
                            <Suggestions className="justify-center gap-2">
                                {EXAMPLE_PROMPTS.map((prompt) => (
                                    <Suggestion
                                        key={prompt}
                                        suggestion={prompt}
                                        onClick={onSuggestionClick}
                                        size="default"
                                        className="text-sm"
                                    />
                                ))}
                            </Suggestions>
                        </div>
                    </ConversationEmptyState>
                ) : (
                    <>
                        {messages.map((message) => {
                            const { role, id } = message
                            const isUser = role === 'user'
                            const isAssistant = role === 'assistant'
                            const messageText = getMessageText(message)
                            const modelLabel = getModelLabel(message.metadata)

                            // Get sources from parts
                            const messageParts = message.parts ?? []
                            const subAgentName = getSubagentNameFromParts(
                                messageParts
                            )
                            const sources = getSourcesFromParts(
                                messageParts
                            )

                            return (
                                <Message key={id} from={role}>
                                    {/* Persona for assistant messages */}
                                    {isAssistant && (
                                        <div className="mb-2 flex items-center gap-2">
                                            <Persona
                                                variant="obsidian"
                                                state={
                                                    status === 'streaming' &&
                                                    messages[
                                                        messages.length - 1
                                                    ]?.id === id
                                                        ? 'thinking'
                                                        : 'idle'
                                                }
                                                className="size-8"
                                            />
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {subAgentName ?? 'Assistant'}
                                            </span>
                                            {modelLabel && (
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {modelLabel}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <MessageContent>
                                        {/* Render message parts */}
                                        {messageParts.map((part, idx) => {
                                            if (isSubagentResultPart(part)) {
                                                return (
                                                    <MessageResponse
                                                        key={`subagent-result-${id}-${idx}`}
                                                    >
                                                        {`${part.data.subAgentName || 'SubAgent'}: ${part.data.text}`}
                                                    </MessageResponse>
                                                )
                                            }

                                            if (isSubagentStreamPart(part)) {
                                                const textDelta =
                                                    getSubagentStreamTextDelta(
                                                        part.data
                                                    )
                                                if (!textDelta) {
                                                    return null
                                                }

                                                return (
                                                    <MessageResponse
                                                        key={`subagent-stream-${id}-${idx}`}
                                                    >
                                                        {`${part.data.subAgentName || 'SubAgent'}: ${textDelta}`}
                                                    </MessageResponse>
                                                )
                                            }

                                            if (isStepStartPart(part)) {
                                                return (
                                                    <Checkpoint
                                                        key={`step-start-${id}-${idx}`}
                                                        className="py-1"
                                                    >
                                                        <CheckpointIcon />
                                                        <span className="text-xs">
                                                            Step started
                                                        </span>
                                                    </Checkpoint>
                                                )
                                            }

                                            if (isFilePart(part)) {
                                                if (
                                                    part.mediaType.startsWith(
                                                        'image/'
                                                    )
                                                ) {
                                                    return (
                                                        <div
                                                            key={`file-${id}-${idx}`}
                                                            className="overflow-hidden rounded-md border"
                                                        >
                                                            <img
                                                                src={part.url}
                                                                alt={
                                                                    part.filename ??
                                                                    'uploaded image'
                                                                }
                                                                className="max-h-96 w-full object-contain"
                                                            />
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <MessageResponse
                                                        key={`file-${id}-${idx}`}
                                                    >
                                                        {`[${part.filename ?? part.url}](${part.url})`}
                                                    </MessageResponse>
                                                )
                                            }

                                            // Render text parts with proper typing
                                            if (part.type === 'text') {
                                                const textPart =
                                                    part as TextUIPart
                                                return (
                                                    <MessageResponse
                                                        key={`text-${id}-${idx}`}
                                                    >
                                                        {textPart.text ?? ''}
                                                    </MessageResponse>
                                                )
                                            }

                                            // Render reasoning parts with proper typing
                                            if (part.type === 'reasoning') {
                                                const reasoningPart =
                                                    part as ReasoningUIPart
                                                const reasoningText =
                                                    extractReasoningText(
                                                        reasoningPart
                                                    )
                                                if (!reasoningText) return null

                                                return (
                                                    <Reasoning
                                                        key={`reasoning-${id}-${idx}`}
                                                        isStreaming={
                                                            status ===
                                                                'streaming' &&
                                                            messages[
                                                                messages.length -
                                                                    1
                                                            ]?.id === id
                                                        }
                                                    >
                                                        <ReasoningTrigger />
                                                        <ReasoningContent>
                                                            {reasoningText}
                                                        </ReasoningContent>
                                                    </Reasoning>
                                                )
                                            }

                                            // Render tool invocation parts
                                            if (
                                                isToolUIPart(part as ToolUIPart)
                                            ) {
                                                const toolPart = part as
                                                    | ToolUIPart
                                                    | DynamicToolUIPart
                                                const toolName =
                                                    getToolName(toolPart)
                                                const toolType =
                                                    getToolType(toolPart)
                                                const isLastTool =
                                                    idx ===
                                                    messageParts.length - 1
                                                const isStreaming =
                                                    status === 'streaming' &&
                                                    messages[
                                                        messages.length - 1
                                                    ]?.id === id &&
                                                    isLastTool

                                                return (
                                                    <Tool
                                                        key={
                                                            toolPart.toolCallId
                                                        }
                                                        defaultOpen={
                                                            isStreaming
                                                        }
                                                    >
                                                        <ToolHeader
                                                            title={toolName}
                                                            type={
                                                                toolType
                                                            }
                                                            state={
                                                                isStreaming
                                                                    ? 'input-available'
                                                                    : toolPart.state
                                                            }
                                                        />
                                                        <ToolContent>
                                                            <>
                                                                {Boolean(
                                                                    toolPart.input
                                                                ) && (
                                                                    <ToolInput
                                                                        input={
                                                                            toolPart.input
                                                                        }
                                                                    />
                                                                )}

                                                                {/* Render enhanced output types from tool output */}
                                                                {toolPart.output && (
                                                                    <>
                                                                        {/* Terminal output */}
                                                                        {isTerminalOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <Terminal
                                                                                    output={
                                                                                        toolPart
                                                                                            .output
                                                                                            .content
                                                                                    }
                                                                                    isStreaming={
                                                                                        isStreaming
                                                                                    }
                                                                                >
                                                                                    <TerminalHeader>
                                                                                        <TerminalTitle>
                                                                                            <TerminalIcon className="size-4" />
                                                                                            Terminal
                                                                                        </TerminalTitle>
                                                                                    </TerminalHeader>
                                                                                    <TerminalContent />
                                                                                </Terminal>
                                                                            </div>
                                                                        )}

                                                                        {/* Stack trace output */}
                                                                        {isStackTrace(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <StackTrace
                                                                                    trace={
                                                                                        toolPart
                                                                                            .output
                                                                                            .trace
                                                                                    }
                                                                                >
                                                                                    <StackTraceHeader>
                                                                                        <StackTraceError>
                                                                                            <StackTraceErrorType />
                                                                                            <StackTraceErrorMessage />
                                                                                        </StackTraceError>
                                                                                        <StackTraceActions>
                                                                                            <StackTraceCopyButton />
                                                                                        </StackTraceActions>
                                                                                    </StackTraceHeader>
                                                                                    <StackTraceContent>
                                                                                        <StackTraceFrames
                                                                                            showInternalFrames={
                                                                                                false
                                                                                            }
                                                                                        />
                                                                                    </StackTraceContent>
                                                                                </StackTrace>
                                                                            </div>
                                                                        )}

                                                                        {/* Code output */}
                                                                        {isCodeOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <CodeBlock
                                                                                    code={
                                                                                        toolPart
                                                                                            .output
                                                                                            .code
                                                                                    }
                                                                                    language={
                                                                                        toolPart
                                                                                            .output
                                                                                            .language as
                                                                                            | 'typescript'
                                                                                            | 'javascript'
                                                                                            | 'python'
                                                                                            | 'json'
                                                                                            | 'bash'
                                                                                            | 'html'
                                                                                            | 'css'
                                                                                    }
                                                                                    showLineNumbers
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* File tree output */}
                                                                        {isFileTree(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <FileTree
                                                                                    defaultExpanded={
                                                                                        new Set(
                                                                                            [
                                                                                                '',
                                                                                            ]
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {renderFileTree(
                                                                                        toolPart
                                                                                            .output
                                                                                            .files
                                                                                    )}
                                                                                </FileTree>
                                                                            </div>
                                                                        )}

                                                                        {/* Test results output */}
                                                                        {isTestResults(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderTestResults(
                                                                                    toolPart
                                                                                        .output
                                                                                        .suites
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Agent output */}
                                                                        {isAgentOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <Agent>
                                                                                    <AgentHeader
                                                                                        name={
                                                                                            toolPart
                                                                                                .output
                                                                                                .agent
                                                                                                .name
                                                                                        }
                                                                                        model={
                                                                                            toolPart
                                                                                                .output
                                                                                                .agent
                                                                                                .model
                                                                                        }
                                                                                    />
                                                                                    <AgentContent>
                                                                                        {toolPart
                                                                                            .output
                                                                                            .agent
                                                                                            .instructions && (
                                                                                            <AgentInstructions>
                                                                                                {
                                                                                                    toolPart
                                                                                                        .output
                                                                                                        .agent
                                                                                                        .instructions
                                                                                                }
                                                                                            </AgentInstructions>
                                                                                        )}
                                                                                        {toolPart
                                                                                            .output
                                                                                            .agent
                                                                                            .tools &&
                                                                                            toolPart
                                                                                                .output
                                                                                                .agent
                                                                                                .tools
                                                                                                .length >
                                                                                                0 && (
                                                                                                <AgentTools type="multiple">
                                                                                                    {toolPart.output.agent.tools.map(
                                                                                                        (
                                                                                                            tool,
                                                                                                            tIdx
                                                                                                        ) => (
                                                                                                            <AgentTool
                                                                                                                key={
                                                                                                                    tIdx
                                                                                                                }
                                                                                                                tool={
                                                                                                                    tool as unknown as import('ai').Tool
                                                                                                                }
                                                                                                                value={`tool-${tIdx}`}
                                                                                                            />
                                                                                                        )
                                                                                                    )}
                                                                                                </AgentTools>
                                                                                            )}
                                                                                    </AgentContent>
                                                                                </Agent>
                                                                            </div>
                                                                        )}

                                                                        {/* Sandbox output */}
                                                                        {isSandboxOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                <Sandbox
                                                                                    defaultOpen
                                                                                >
                                                                                    <SandboxHeader
                                                                                        title={
                                                                                            toolPart
                                                                                                .output
                                                                                                .sandbox
                                                                                                .title ||
                                                                                            'Sandbox'
                                                                                        }
                                                                                        state={
                                                                                            isStreaming
                                                                                                ? 'output-available'
                                                                                                : toolPart.state
                                                                                        }
                                                                                    />
                                                                                    <SandboxContent>
                                                                                        <SandboxTabs
                                                                                            defaultValue={
                                                                                                toolPart
                                                                                                    .output
                                                                                                    .sandbox
                                                                                                    .terminal
                                                                                                    ? 'terminal'
                                                                                                    : toolPart
                                                                                                            .output
                                                                                                            .sandbox
                                                                                                            .files
                                                                                                      ? 'files'
                                                                                                      : 'tests'
                                                                                            }
                                                                                        >
                                                                                            <SandboxTabsBar>
                                                                                                <SandboxTabsList>
                                                                                                    {toolPart
                                                                                                        .output
                                                                                                        .sandbox
                                                                                                        .terminal && (
                                                                                                        <SandboxTabsTrigger value="terminal">
                                                                                                            Terminal
                                                                                                        </SandboxTabsTrigger>
                                                                                                    )}
                                                                                                    {toolPart
                                                                                                        .output
                                                                                                        .sandbox
                                                                                                        .files && (
                                                                                                        <SandboxTabsTrigger value="files">
                                                                                                            <span className="inline-flex items-center gap-1">
                                                                                                                <FolderIcon className="size-3" />
                                                                                                                Files
                                                                                                            </span>
                                                                                                        </SandboxTabsTrigger>
                                                                                                    )}
                                                                                                    {toolPart
                                                                                                        .output
                                                                                                        .sandbox
                                                                                                        .testResults && (
                                                                                                        <SandboxTabsTrigger value="tests">
                                                                                                            Tests
                                                                                                        </SandboxTabsTrigger>
                                                                                                    )}
                                                                                                </SandboxTabsList>
                                                                                            </SandboxTabsBar>

                                                                                            {toolPart
                                                                                                .output
                                                                                                .sandbox
                                                                                                .terminal && (
                                                                                                <SandboxTabContent value="terminal">
                                                                                                    <Terminal
                                                                                                        output={
                                                                                                            toolPart
                                                                                                                .output
                                                                                                                .sandbox
                                                                                                                .terminal
                                                                                                        }
                                                                                                        isStreaming={
                                                                                                            isStreaming
                                                                                                        }
                                                                                                    >
                                                                                                        <TerminalContent />
                                                                                                    </Terminal>
                                                                                                </SandboxTabContent>
                                                                                            )}

                                                                                            {toolPart
                                                                                                .output
                                                                                                .sandbox
                                                                                                .files && (
                                                                                                <SandboxTabContent value="files">
                                                                                                    <FileTree
                                                                                                        defaultExpanded={
                                                                                                            new Set(
                                                                                                                [
                                                                                                                    '',
                                                                                                                ]
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        {renderFileTree(
                                                                                                            toolPart
                                                                                                                .output
                                                                                                                .sandbox
                                                                                                                .files!
                                                                                                        )}
                                                                                                    </FileTree>
                                                                                                </SandboxTabContent>
                                                                                            )}

                                                                                            {toolPart
                                                                                                .output
                                                                                                .sandbox
                                                                                                .testResults && (
                                                                                                <SandboxTabContent value="tests">
                                                                                                    {renderTestResults(
                                                                                                        toolPart
                                                                                                            .output
                                                                                                            .sandbox
                                                                                                            .testResults!
                                                                                                            .suites
                                                                                                    )}
                                                                                                </SandboxTabContent>
                                                                                            )}
                                                                                        </SandboxTabs>
                                                                                    </SandboxContent>
                                                                                </Sandbox>
                                                                            </div>
                                                                        )}

                                                                        {/* Fallback to standard output */}
                                                                        {!(
                                                                            isTerminalOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isStackTrace(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isCodeOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isFileTree(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isTestResults(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isAgentOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isSandboxOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isSchemaOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isSnippetOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isPackageInfoOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isCheckpointOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isConfirmationOutput(
                                                                                toolPart.output
                                                                            )
                                                                        ) && (
                                                                            <ToolOutput
                                                                                output={
                                                                                    toolPart.output
                                                                                }
                                                                                errorText={
                                                                                    toolPart.errorText
                                                                                }
                                                                            />
                                                                        )}

                                                                        {/* Render additional output types */}
                                                                        {isSchemaOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderSchema(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isSnippetOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderSnippet(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isPackageInfoOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderPackageInfo(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isCheckpointOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderCheckpoint(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isConfirmationOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderConfirmation(
                                                                                    toolPart.output,
                                                                                    toolPart.state
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        </ToolContent>
                                                    </Tool>
                                                )
                                            }

                                            // Note: Artifact and CodeBlock rendering removed
                                            // These types are not part of the current AI SDK UIMessagePart union
                                            // If needed, they should be rendered from DataUIPart

                                            return null
                                        })}
                                    </MessageContent>

                                    {/* Sources section */}
                                    {sources.length > 0 && (
                                        <Sources>
                                            <SourcesTrigger
                                                count={sources.length}
                                            />
                                            <SourcesContent>
                                                {sources.map((source, idx) => (
                                                    <Source
                                                        key={idx}
                                                        href={source.url}
                                                        title={
                                                            source.title ||
                                                            source.url
                                                        }
                                                    >
                                                        <span className="block font-medium truncate">
                                                            {source.title ||
                                                                source.url}
                                                        </span>
                                                        {source.description && (
                                                            <span className="block text-xs text-muted-foreground truncate">
                                                                {
                                                                    source.description
                                                                }
                                                            </span>
                                                        )}
                                                    </Source>
                                                ))}
                                            </SourcesContent>
                                        </Sources>
                                    )}

                                    {/* Message actions */}
                                    {!isUser && (
                                        <MessageActions>
                                            <MessageAction
                                                tooltip="Copy"
                                                onClick={() =>
                                                    handleCopy(id, messageText)
                                                }
                                            >
                                                {copiedId === id ? (
                                                    <CheckIcon className="size-4" />
                                                ) : (
                                                    <CopyIcon className="size-4" />
                                                )}
                                            </MessageAction>
                                            {onRegenerate && (
                                                <MessageAction
                                                    tooltip="Regenerate"
                                                    onClick={() =>
                                                        onRegenerate(id)
                                                    }
                                                >
                                                    <RefreshCwIcon className="size-4" />
                                                </MessageAction>
                                            )}
                                        </MessageActions>
                                    )}
                                </Message>
                            )
                        })}

                        {/* Streaming indicator */}
                        {status === 'streaming' && (
                            <Message from="assistant">
                                <div className="mb-2 flex items-center gap-2">
                                    <Persona
                                        variant="obsidian"
                                        state="thinking"
                                        className="size-8"
                                    />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Assistant
                                    </span>
                                </div>
                                <MessageContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader />
                                        <span>Thinking...</span>
                                    </div>
                                </MessageContent>
                            </Message>
                        )}

                        {/* Error display */}
                        {error && (
                            <div className="flex justify-center">
                                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    <p className="font-semibold">Error</p>
                                    <p className="text-xs opacity-90">
                                        {error.message}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
    )
}

// Helper function to extract reasoning text from ReasoningUIPart
function extractReasoningText(part: ReasoningUIPart): string {
    return part.text ?? ''
}

function isSourceUrlPart(part: UIMessage['parts'][number]): part is SourceUrlUIPart {
    return part.type === 'source-url'
}

function isSourceDocumentPart(
    part: UIMessage['parts'][number]
): part is SourceDocumentUIPart {
    return part.type === 'source-document'
}

function isFilePart(part: UIMessage['parts'][number]): part is FileUIPart {
    return part.type === 'file'
}

function isStepStartPart(
    part: UIMessage['parts'][number]
): part is StepStartUIPart {
    return part.type === 'step-start'
}

function getToolType(
    part: ToolUIPart | DynamicToolUIPart
): `tool-${string}` {
    if (part.type === 'dynamic-tool') {
        return `tool-${part.toolName}`
    }

    return part.type as `tool-${string}`
}
function getModelLabel(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
        return undefined
    }

    const record = metadata as Record<string, unknown>
    const { model } = record
    if (!model || typeof model !== 'object') {
        return undefined
    }

    const modelRecord = model as Record<string, unknown>
    const { id } = modelRecord
    return typeof id === 'string' && id.trim().length > 0 ? id : undefined
}

type SubagentResultPart = DataUIPart<{
    'subagent-result': {
        subAgentId?: string
        subAgentName?: string
        text: string
    }
}>

type SubagentStreamPart = DataUIPart<{
    'subagent-stream': {
        subAgentId?: string
        subAgentName?: string
        originalType?: string
        [key: string]: unknown
    }
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

function isSubagentResultPart(part: UIMessage['parts'][number]): part is SubagentResultPart {
    if (!isDataUIPart<UIDataTypes>(part) || part.type !== 'data-subagent-result') {
        return false
    }
    return isRecord(part.data) && typeof part.data.text === 'string'
}

function isSubagentStreamPart(part: UIMessage['parts'][number]): part is SubagentStreamPart {
    return isDataUIPart<UIDataTypes>(part) && part.type === 'data-subagent-stream'
}

function getSubagentNameFromParts(parts: UIMessage['parts']): string | undefined {
    for (const part of parts) {
        if (isSubagentResultPart(part) && part.data.subAgentName) {
            return part.data.subAgentName
        }
        if (isSubagentStreamPart(part)) {
            const name = part.data.subAgentName
            if (typeof name === 'string' && name.trim().length > 0) {
                return name
            }
        }
    }
    return undefined
}

function getSubagentStreamTextDelta(data: Record<string, unknown>): string {
    const { delta, textDelta, inputTextDelta } = data
    if (typeof delta === 'string') {
        return delta
    }
    if (typeof textDelta === 'string') {
        return textDelta
    }
    if (typeof inputTextDelta === 'string') {
        return inputTextDelta
    }
    return ''
}

// Type guards for detecting content types from tool outputs
function isTerminalOutput(
    output: unknown
): output is { type: 'terminal'; content: string } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'terminal' && typeof obj.content === 'string'
    }
    return false
}

function isStackTrace(
    output: unknown
): output is { type: 'stack-trace'; trace: string } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'stack-trace' && typeof obj.trace === 'string'
    }
    return false
}

function isCodeOutput(
    output: unknown
): output is { type: 'code'; code: string; language: string } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'code' &&
            typeof obj.code === 'string' &&
            typeof obj.language === 'string'
        )
    }
    return false
}

interface FileNode {
    name: string
    path: string
    type: 'file' | 'folder'
    children?: FileNode[]
}

function isFileTree(
    output: unknown
): output is { type: 'file-tree'; files: FileNode[] } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'file-tree' && Array.isArray(obj.files)
    }
    return false
}

interface TestResult {
    name: string
    status: 'passed' | 'failed' | 'skipped' | 'running'
    duration?: number
    error?: string
    stack?: string
}

interface TestSuiteData {
    name: string
    status: 'passed' | 'failed' | 'skipped' | 'running'
    passed?: number
    failed?: number
    skipped?: number
    tests: TestResult[]
}

function isTestResults(
    output: unknown
): output is { type: 'test-results'; suites: TestSuiteData[] } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'test-results' && Array.isArray(obj.suites)
    }
    return false
}

interface AgentData {
    name: string
    model?: string
    instructions?: string
    tools?: Array<{
        name: string
        description?: string
        inputSchema?: Record<string, unknown>
    }>
    outputSchema?: string
}

function isAgentOutput(
    output: unknown
): output is { type: 'agent'; agent: AgentData } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'agent' &&
            obj.agent != null &&
            typeof obj.agent === 'object'
        )
    }
    return false
}

interface SandboxData {
    title?: string
    files?: FileNode[]
    terminal?: string
    testResults?: { suites: TestSuiteData[] }
}

function isSandboxOutput(
    output: unknown
): output is { type: 'sandbox'; sandbox: SandboxData } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'sandbox' &&
            obj.sandbox != null &&
            typeof obj.sandbox === 'object'
        )
    }
    return false
}

// Render file tree from FileNode structure
function renderFileTree(files: FileNode[], basePath = ''): React.ReactNode {
    return files.map((file) => {
        const fullPath = basePath ? `${basePath}/${file.name}` : file.name
        if (file.type === 'folder' && file.children) {
            return (
                <FileTreeFolder key={fullPath} path={fullPath} name={file.name}>
                    {renderFileTree(file.children, fullPath)}
                </FileTreeFolder>
            )
        }
        return (
            <FileTreeFile key={fullPath} path={fullPath} name={file.name}>
                <FileTreeIcon>
                    <FileIcon className="size-4 text-muted-foreground" />
                </FileTreeIcon>
                <FileTreeName>{file.name}</FileTreeName>
            </FileTreeFile>
        )
    })
}

// Render test results
function renderTestResults(suites: TestSuiteData[]): React.ReactNode {
    const totalPassed = suites.reduce((sum, s) => sum + (s.passed ?? 0), 0)
    const totalFailed = suites.reduce((sum, s) => sum + (s.failed ?? 0), 0)
    const totalSkipped = suites.reduce((sum, s) => sum + (s.skipped ?? 0), 0)
    const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0)
    const duration = suites
        .flatMap((s) => s.tests)
        .reduce((sum, t) => sum + (t.duration ?? 0), 0)

    return (
        <TestResults
            summary={{
                passed: totalPassed,
                failed: totalFailed,
                skipped: totalSkipped,
                total: totalTests,
                duration,
            }}
        >
            <TestResultsHeader>
                <TestResultsSummary />
                <TestResultsDuration />
            </TestResultsHeader>
            <div className="px-4 pb-2">
                <TestResultsProgress />
            </div>
            <TestResultsContent>
                {suites.map((suite, idx) => (
                    <TestSuite
                        key={idx}
                        name={suite.name}
                        status={suite.status}
                    >
                        <TestSuiteName>{suite.name}</TestSuiteName>
                        <TestSuiteStats
                            passed={suite.passed}
                            failed={suite.failed}
                            skipped={suite.skipped}
                        />
                        <TestSuiteContent>
                            {suite.tests.map((test, testIdx) => (
                                <Test
                                    key={testIdx}
                                    name={test.name}
                                    status={test.status}
                                    duration={test.duration}
                                >
                                    <TestStatus />
                                    <TestName />
                                    {test.duration !== undefined && (
                                        <TestDuration />
                                    )}
                                    {test.status === 'failed' && test.error && (
                                        <TestError>
                                            <TestErrorMessage>
                                                {test.error}
                                            </TestErrorMessage>
                                            {test.stack && (
                                                <TestErrorStack>
                                                    {test.stack}
                                                </TestErrorStack>
                                            )}
                                        </TestError>
                                    )}
                                </Test>
                            ))}
                        </TestSuiteContent>
                    </TestSuite>
                ))}
            </TestResultsContent>
        </TestResults>
    )
}

// Type guards for additional output types
function isSchemaOutput(output: unknown): output is {
    type: 'schema'
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    description?: string
    parameters?: Array<{
        name: string
        type: string
        required?: boolean
        description?: string
        location?: 'path' | 'query' | 'header'
    }>
    requestBody?: Array<{
        name: string
        type: string
        required?: boolean
        description?: string
        properties?: Array<{
            name: string
            type: string
            required?: boolean
            description?: string
        }>
    }>
    responseBody?: Array<{
        name: string
        type: string
        required?: boolean
        description?: string
    }>
} {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'schema' &&
            typeof obj.method === 'string' &&
            typeof obj.path === 'string'
        )
    }
    return false
}

function isSnippetOutput(
    output: unknown
): output is { type: 'snippet'; code: string; label?: string } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'snippet' && typeof obj.code === 'string'
    }
    return false
}

interface PackageData {
    name: string
    currentVersion?: string
    newVersion?: string
    changeType?: 'major' | 'minor' | 'patch' | 'added' | 'removed'
    description?: string
    dependencies?: Record<string, string>
}

function isPackageInfoOutput(
    output: unknown
): output is { type: 'package-info'; package: PackageData } {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'package-info' &&
            obj.package != null &&
            typeof obj.package === 'object' &&
            typeof (obj.package as Record<string, unknown>).name === 'string'
        )
    }
    return false
}

function isCheckpointOutput(output: unknown): output is {
    type: 'checkpoint'
    label: string
    status: 'completed' | 'pending' | 'in-progress' | 'error'
    timestamp?: string
    tooltip?: string
} {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'checkpoint' &&
            typeof obj.label === 'string' &&
            typeof obj.status === 'string'
        )
    }
    return false
}

function isConfirmationOutput(output: unknown): output is {
    type: 'confirmation'
    id: string
    message: string
    approved?: boolean
    reason?: string
} {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            obj.type === 'confirmation' &&
            typeof obj.id === 'string' &&
            typeof obj.message === 'string'
        )
    }
    return false
}

// Render schema display
function renderSchema(output: unknown): React.ReactNode {
    if (!isSchemaOutput(output)) return null

    // Use the SchemaDisplay subcomponents explicitly so imports are exercised
    return (
        <SchemaDisplay
            method={output.method}
            path={output.path}
            description={output.description}
            parameters={output.parameters}
            requestBody={output.requestBody}
            responseBody={output.responseBody}
        >
            <SchemaDisplayHeader>
                <div className="flex items-center gap-3">
                    <SchemaDisplayMethod />
                    <SchemaDisplayPath />
                    <div className="ml-auto flex items-center gap-2">
                        <CodeIcon className="size-4 text-muted-foreground" />
                        <FileJsonIcon className="size-4 text-muted-foreground" />
                    </div>
                </div>
            </SchemaDisplayHeader>

            {output.description && (
                <SchemaDisplayDescription>
                    {output.description}
                </SchemaDisplayDescription>
            )}

            <SchemaDisplayContent>
                {output.parameters && output.parameters.length > 0 && (
                    <SchemaDisplayParameters>
                        {output.parameters.map((p: any) => (
                            <SchemaDisplayParameter key={p.name} {...p} />
                        ))}
                    </SchemaDisplayParameters>
                )}

                {output.requestBody && output.requestBody.length > 0 && (
                    <SchemaDisplayRequest>
                        <SchemaDisplayBody>
                            {output.requestBody.map((prop: any) => (
                                <SchemaDisplayProperty key={prop.name} {...prop} />
                            ))}
                        </SchemaDisplayBody>
                    </SchemaDisplayRequest>
                )}

                {output.responseBody && output.responseBody.length > 0 && (
                    <SchemaDisplayResponse>
                        <SchemaDisplayBody>
                            {output.responseBody.map((prop: any) => (
                                <SchemaDisplayProperty key={prop.name} {...prop} />
                            ))}
                        </SchemaDisplayBody>
                    </SchemaDisplayResponse>
                )}
            </SchemaDisplayContent>

            <SchemaDisplayExample>
                <div className="flex items-center gap-2">
                    <CodeIcon className="size-4" />
                    <span className="font-mono text-sm">{output.method} {output.path}</span>
                </div>
                <pre className="mt-2">{JSON.stringify({ method: output.method, path: output.path }, null, 2)}</pre>
            </SchemaDisplayExample>

            {/* Use artifact components to surface a small source summary (exercise Artifact imports) */}
            <Artifact>
                <ArtifactHeader>
                    <div className="flex items-center gap-2">
                        <FileJsonIcon className="size-4 text-muted-foreground" />
                        <ArtifactTitle className="text-sm truncate">
                            {output.path}
                        </ArtifactTitle>
                    </div>
                    <ArtifactClose />
                </ArtifactHeader>

                <ArtifactContent>
                    {output.description ? (
                        <ArtifactDescription>
                            {output.description}
                        </ArtifactDescription>
                    ) : (
                        <ArtifactDescription className="text-xs text-muted-foreground">
                            No description available
                        </ArtifactDescription>
                    )}
                </ArtifactContent>

                <ArtifactActions>
                    <ArtifactAction>Open Source</ArtifactAction>
                    <ArtifactAction>Copy Path</ArtifactAction>
                </ArtifactActions>
            </Artifact>
        </SchemaDisplay>
    )
}

// Render snippet
function renderSnippet(output: unknown): React.ReactNode {
    if (!isSnippetOutput(output)) return null
    return (
        <Snippet code={output.code}>
            {output.label && <SnippetText>{output.label}</SnippetText>}
            <SnippetInput />
            <SnippetCopyButton />
        </Snippet>
    )
}

// Render package info
function renderPackageInfo(output: unknown): React.ReactNode {
    if (!isPackageInfoOutput(output)) return null
    const pkg = output.package
    return (
        <PackageInfo
            name={pkg.name}
            currentVersion={pkg.currentVersion}
            newVersion={pkg.newVersion}
            changeType={pkg.changeType}
        >
            <PackageInfoName>{pkg.name}</PackageInfoName>
            {pkg.changeType && <PackageInfoChangeType />}
            {(pkg.currentVersion || pkg.newVersion) && <PackageInfoVersion />}
            {pkg.description && (
                <PackageInfoDescription>
                    {pkg.description}
                </PackageInfoDescription>
            )}

            {/* Render dependency list if available (exercise PackageInfoContent, PackageInfoDependencies, PackageInfoDependency imports) */}
            {pkg.dependencies && Object.keys(pkg.dependencies).length > 0 && (
                <PackageInfoContent>
                    <PackageInfoDependencies>
                        {Object.entries(pkg.dependencies).map(([depName, depVersion]) => (
                            <PackageInfoDependency key={depName} name={''}>
                                <div className="flex items-center justify-between w-full">
                                    <span className="truncate">{depName}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{depVersion}</span>
                                </div>
                            </PackageInfoDependency>
                        ))}
                    </PackageInfoDependencies>
                </PackageInfoContent>
            )}
        </PackageInfo>
    )
}

// Render checkpoint
function renderCheckpoint(output: unknown): React.ReactNode {
    if (!isCheckpointOutput(output)) return null

    const statusIcons: Record<string, React.ReactNode> = {
        completed: <CheckCircle2Icon className="size-4 text-green-500" />,
        'in-progress': (
            <HistoryIcon className="size-4 animate-pulse text-blue-500" />
        ),
        pending: <HistoryIcon className="size-4 text-muted-foreground" />,
        error: <XCircleIcon className="size-4 text-red-500" />,
    }

    return (
        <Checkpoint>
            <div className="flex items-center gap-2 py-1 w-full">
                <CheckpointIcon>
                    {statusIcons[output.status] || statusIcons.pending}
                </CheckpointIcon>

                <span className="text-sm">{output.label}</span>

                {output.tooltip && (
                    <div className="ml-auto">
                        <CheckpointTrigger
                            variant="ghost"
                            size="sm"
                            tooltip={output.tooltip}
                        />
                    </div>
                )}
            </div>
        </Checkpoint>
    )
}

// Render confirmation
function renderConfirmation(
    output: unknown,
    toolState: ToolUIPart['state']
): React.ReactNode {
    if (!isConfirmationOutput(output)) return null

    const approval =
        output.approved !== undefined
            ? {
                  id: output.id,
                  approved: output.approved,
                  reason: output.reason,
              }
            : undefined

    return (
        <Confirmation approval={approval} state={toolState}>
            <ConfirmationTitle>{output.message}</ConfirmationTitle>
            <ConfirmationRequest>
                <ConfirmationActions>
                    <ConfirmationAction variant="default">
                        Approve
                    </ConfirmationAction>
                    <ConfirmationAction variant="destructive">
                        Deny
                    </ConfirmationAction>
                </ConfirmationActions>
            </ConfirmationRequest>
            <ConfirmationAccepted>
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Approved {output.reason && `- ${output.reason}`}
                </div>
            </ConfirmationAccepted>
            <ConfirmationRejected>
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Rejected {output.reason && `- ${output.reason}`}
                </div>
            </ConfirmationRejected>
        </Confirmation>
    )
}

// Memoize for performance
export const MemoizedChatMessages = memo(ChatMessages)
