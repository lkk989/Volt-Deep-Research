'use client'

import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Spinner } from '@/components/ui/spinner'
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
    JSXPreview,
    JSXPreviewContent,
    JSXPreviewError,
} from '@/components/ai-elements/jsx-preview'
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
    Plan,
    PlanAction,
    PlanContent,
    PlanDescription,
    PlanHeader,
    PlanTitle,
    PlanTrigger,
} from '@/components/ai-elements/plan'
import {
    Task,
    TaskContent,
    TaskItem,
    TaskItemFile,
    TaskTrigger,
} from '@/components/ai-elements/task'
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
    Queue,
    QueueItem,
    QueueItemAttachment,
    QueueItemContent,
    QueueItemDescription,
    QueueItemFile,
    QueueItemImage,
    QueueItemIndicator,
    QueueList,
    QueueSection,
    QueueSectionContent,
    QueueSectionLabel,
    QueueSectionTrigger,
} from '@/components/ai-elements/queue'
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
import {
    useState,
    useCallback,
    useMemo,
    Fragment,
    memo,
    useEffect,
} from 'react'
import type {
    FileUIPart,
    DataUIPart,
    UIMessagePart,
    UITools,
    ProviderMetadata,
    ReasoningUIPart,
    SourceDocumentUIPart,
    SourceUrlUIPart,
    StepStartUIPart,
    TextUIPart,
    Tool as AITool,
    ToolUIPart,
    DynamicToolUIPart,
    UIDataTypes,
    UIMessage,
} from 'ai'
import {
    safeValidateUIMessages,
    getTextFromDataUrl,
    getToolName,
    isDeepEqualData,
    isDataUIPart,
    isFileUIPart,
    isReasoningUIPart,
    isTextUIPart,
    isToolUIPart,
    InvalidResponseDataError,
    InvalidMessageRoleError,
    InvalidArgumentError,
    UIMessageStreamError,
} from 'ai'
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
    const [validatedMessages, setValidatedMessages] =
        useState<UIMessage[]>(messages)
    const [validationError, setValidationError] = useState<string | undefined>()

    useEffect(() => {
        let isActive = true

        const validateMessages = async () => {
            const result = await safeValidateUIMessages<UIMessage>({
                messages,
            })

            if (!isActive) {
                return
            }

            if (result.success) {
                setValidatedMessages((current) =>
                    areMessagesEquivalent(current, result.data)
                        ? current
                        : result.data
                )
                setValidationError(undefined)
                return
            }

            setValidatedMessages(messages)
            setValidationError(describeMessageValidationError(result.error))
        }

        void validateMessages()

        return () => {
            isActive = false
        }
    }, [messages])

    const handleCopy = useCallback(
        async (messageId: string, content: string) => {
            await navigator.clipboard.writeText(content)
            setCopiedId(messageId)
            setTimeout(() => setCopiedId(null), 2000)
            onCopyMessage?.(messageId, content)
        },
        [onCopyMessage]
    )

    const renderedMessages = useMemo(
        () => validatedMessages,
        [validatedMessages]
    )

    // Extract sources from message parts
    const getSourcesFromParts = (
        parts: UIMessage['parts']
    ): SourceDocument[] => {
        const sources: SourceDocument[] = []
        for (const part of parts) {
            if (isSourceUrlPart(part)) {
                const candidate: SourceDocument = {
                    title: part.title,
                    url: part.url,
                    description: part.url,
                }
                if (
                    !sources.some((source) =>
                        isDeepEqualData(source, candidate)
                    )
                ) {
                    sources.push(candidate)
                }
                continue
            }

            if (isSourceDocumentPart(part)) {
                const candidate: SourceDocument = {
                    title: part.title,
                    description: part.filename ?? part.mediaType,
                }
                if (
                    !sources.some((source) =>
                        isDeepEqualData(source, candidate)
                    )
                ) {
                    sources.push(candidate)
                }
            }
        }
        return sources
    }

    return (
        <Conversation className="min-h-0 flex-1">
            <ConversationContent className="space-y-6 p-6">
                {renderedMessages.length === 0 ? (
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
                    <Fragment>
                        {renderedMessages.map((message) => {
                            const { role, id } = message
                            const isUser = role === 'user'
                            const isAssistant = role === 'assistant'
                            const messageText = messageHelpers.hasContent(
                                message
                            )
                                ? messageHelpers.extractText(message)
                                : ''
                            const modelLabel = getModelLabel(message.metadata)

                            // Get sources from parts
                            const messageParts = message.parts ?? []
                            const subAgentName =
                                getSubagentNameFromParts(messageParts)
                            const sources = getSourcesFromParts(messageParts)

                            return (
                                <Message key={id} from={role}>
                                    {/* Persona for assistant messages */}
                                    {isAssistant && (
                                        <div className="mb-2 flex items-center gap-2">
                                            <Persona
                                                variant="obsidian"
                                                state={
                                                    status === 'streaming' &&
                                                    renderedMessages[
                                                        renderedMessages.length -
                                                            1
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

                                            if (isFileUIPart(part)) {
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

                                                if (
                                                    canReadFilePartAsText(part)
                                                ) {
                                                    return (
                                                        <Artifact
                                                            key={`file-${id}-${idx}`}
                                                        >
                                                            <ArtifactHeader>
                                                                <div className="flex items-center gap-2">
                                                                    <FileJsonIcon className="size-4 text-muted-foreground" />
                                                                    <ArtifactTitle className="text-sm">
                                                                        {part.filename ??
                                                                            'Attached text file'}
                                                                    </ArtifactTitle>
                                                                </div>
                                                            </ArtifactHeader>
                                                            <ArtifactContent className="p-0">
                                                                <CodeBlock
                                                                    code={readTextFromFilePart(
                                                                        part
                                                                    )}
                                                                    language={inferCodeLanguage(
                                                                        part
                                                                    )}
                                                                    showLineNumbers
                                                                />
                                                            </ArtifactContent>
                                                        </Artifact>
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
                                            if (isTextUIPart(part)) {
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
                                            if (isReasoningUIPart(part)) {
                                                const reasoningPart =
                                                    part as ReasoningUIPart
                                                const reasoningText =
                                                    reasoningPart.text ?? ''
                                                if (!reasoningText) return null

                                                return (
                                                    <Reasoning
                                                        key={`reasoning-${id}-${idx}`}
                                                        isStreaming={
                                                            status ===
                                                                'streaming' &&
                                                            renderedMessages[
                                                                renderedMessages.length -
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
                                            if (isToolUIPart(part)) {
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
                                                    renderedMessages[
                                                        renderedMessages.length -
                                                            1
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
                                                            type={toolType}
                                                            state={
                                                                isStreaming
                                                                    ? 'input-available'
                                                                    : toolPart.state
                                                            }
                                                        />
                                                        <ToolContent>
                                                            <Fragment>
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
                                                                {toolPart.output !==
                                                                    undefined &&
                                                                    toolPart.output !==
                                                                        null && (
                                                                    <Fragment>
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
                                                                                            | 'markdown'
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
                                                                                                                    tool
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

                                                                        {isWorkspaceCommandOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderWorkspaceCommandOutput(
                                                                                    toolPart.output,
                                                                                    isStreaming,
                                                                                    toolPart.state,
                                                                                    toolName
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isWorkspaceListingOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderWorkspaceListingOutput(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isWorkspaceReadOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderWorkspaceReadOutput(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {isWorkspaceSearchOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2">
                                                                                {renderWorkspaceSearchOutput(
                                                                                    toolPart.output
                                                                                )}
                                                                            </div>
                                                                        )}
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
                                                                            isWorkspaceCommandOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isWorkspaceListingOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isWorkspaceReadOutput(
                                                                                toolPart.output
                                                                            ) ||
                                                                            isWorkspaceSearchOutput(
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
                                                                            ) ||
                                                                            isJsxPreviewOutput(
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

                                                                        {isJsxPreviewOutput(
                                                                            toolPart.output
                                                                        ) && (
                                                                            <div className="mt-2 space-y-2">
                                                                                <JSXPreview
                                                                                    jsx={getJsxPreviewContent(
                                                                                        toolPart.output
                                                                                    )}
                                                                                    isStreaming={
                                                                                        toolPart
                                                                                            .output
                                                                                            .isStreaming ??
                                                                                        false
                                                                                    }
                                                                                    className="rounded-md border bg-background p-3"
                                                                                >
                                                                                    <JSXPreviewContent />
                                                                                </JSXPreview>
                                                                                <JSXPreviewError />
                                                                            </div>
                                                                        )}
                                                                    </Fragment>
                                                                )}

                                                                {/* Tool error fallback when no structured output is provided */}
                                                                {toolPart.state ===
                                                                    'output-error' &&
                                                                    !toolPart.output && (
                                                                        <ToolOutput
                                                                            output={{
                                                                                error:
                                                                                    toolPart.errorText ||
                                                                                    'Tool execution failed',
                                                                            }}
                                                                            errorText={
                                                                                toolPart.errorText ||
                                                                                'Tool execution failed'
                                                                            }
                                                                        />
                                                                    )}
                                                            </Fragment>
                                                        </ToolContent>
                                                    </Tool>
                                                )
                                            }

                                            if (
                                                isDataUIPart<UIDataTypes>(part)
                                            ) {
                                                return (
                                                    <Fragment key={`data-${id}-${idx}`}>
                                                        {renderStructuredDataPart(
                                                            part.type,
                                                            part.data
                                                        ) ?? (
                                                            <DataPartArtifact
                                                                partType={
                                                                    part.type
                                                                }
                                                                data={part.data}
                                                            />
                                                        )}
                                                    </Fragment>
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

                        {validationError && (
                            <div className="flex justify-center">
                                <div className="max-w-2xl rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                                    <p className="font-semibold">
                                        Message validation warning
                                    </p>
                                    <p className="opacity-90">
                                        {validationError}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Streaming indicator */}
                        {status === 'streaming' &&
                            renderedMessages[renderedMessages.length - 1]
                                ?.role !== 'assistant' && (
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
                                            <Spinner className="h-4 w-4" />
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
                    </Fragment>
                )}
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
    )
}

function isSourceUrlPart(
    part: UIMessagePart<UIDataTypes, UITools>
): part is SourceUrlUIPart {
    return part.type === 'source-url'
}

function isSourceDocumentPart(
    part: UIMessagePart<UIDataTypes, UITools>
): part is SourceDocumentUIPart {
    return part.type === 'source-document'
}

function isStepStartPart(
    part: UIMessagePart<UIDataTypes, UITools>
): part is StepStartUIPart {
    return part.type === 'step-start'
}

function getToolType(part: ToolUIPart | DynamicToolUIPart): `tool-${string}` {
    if (part.type === 'dynamic-tool') {
        return `tool-${part.toolName}`
    }

    return part.type as `tool-${string}`
}
interface MessageMetadataShape {
    model?: {
        id?: string
        providerMetadata?: ProviderMetadata
    }
}

function getModelLabel(
    metadata: MessageMetadataShape | unknown
): string | undefined {
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

function isSubagentResultPart(
    part: UIMessage['parts'][number]
): part is SubagentResultPart {
    if (
        !isDataUIPart<UIDataTypes>(part) ||
        part.type !== 'data-subagent-result'
    ) {
        return false
    }
    return isRecord(part.data) && typeof part.data.text === 'string'
}

function isSubagentStreamPart(
    part: UIMessage['parts'][number]
): part is SubagentStreamPart {
    return (
        isDataUIPart<UIDataTypes>(part) && part.type === 'data-subagent-stream'
    )
}

function getSubagentNameFromParts(
    parts: UIMessage['parts']
): string | undefined {
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
function isTerminalOutput(output: ToolOutputValue): output is TerminalOutput {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'terminal' && typeof obj.content === 'string'
    }
    return false
}

function isStackTrace(output: ToolOutputValue): output is StackTraceOutput {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return obj.type === 'stack-trace' && typeof obj.trace === 'string'
    }
    return false
}

function isCodeOutput(output: ToolOutputValue): output is CodeOutput {
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

function isFileTree(output: ToolOutputValue): output is FileTreeOutput {
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

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type TerminalOutput = { type: 'terminal'; content: string }
type StackTraceOutput = { type: 'stack-trace'; trace: string }
type CodeOutput = { type: 'code'; code: string; language: string }
type FileTreeOutput = { type: 'file-tree'; files: FileNode[] }
type TestResultsOutput = { type: 'test-results'; suites: TestSuiteData[] }

type SchemaOutput = {
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
}

type SnippetOutput = { type: 'snippet'; code: string; label?: string }
type PackageInfoOutput = { type: 'package-info'; package: PackageData }
type CheckpointOutput = {
    type: 'checkpoint'
    label: string
    status: 'completed' | 'pending' | 'in-progress' | 'error'
    timestamp?: string
    tooltip?: string
}
type ConfirmationOutput = {
    type: 'confirmation'
    id: string
    message: string
    approved?: boolean
    reason?: string
}
type JsxPreviewOutput = {
    type?: 'jsx-preview'
    jsx?: string
    content?: string
    isStreaming?: boolean
}

interface WorkspaceCommandOutput {
    stdout: string
    stderr: string
    exitCode: number
    durationMs?: number
    timedOut?: boolean
    aborted?: boolean
    stdoutTruncated?: boolean
    stderrTruncated?: boolean
}

interface WorkspaceFileEntry {
    path: string
    is_dir: boolean
    modified_at?: string
    size?: number
}

interface WorkspaceListingOutput {
    path: string
    entries: WorkspaceFileEntry[]
}

interface WorkspaceReadOutput {
    path: string
    content: string
}

interface WorkspaceSearchResultItem {
    path: string
    score: number
    snippet?: string
    lineRange?: [number, number]
    content?: string
    scoreDetails?: {
        bm25?: number
        vector?: number
    }
}

interface WorkspaceSearchOutput {
    query: string
    results: WorkspaceSearchResultItem[]
}

type ToolOutputValue =
    | ToolUIPart['output']
    | DynamicToolUIPart['output']
    | JsonValue
    | TerminalOutput
    | StackTraceOutput
    | CodeOutput
    | FileTreeOutput
    | TestResultsOutput
    | SchemaOutput
    | SnippetOutput
    | PackageInfoOutput
    | CheckpointOutput
    | ConfirmationOutput
    | JsxPreviewOutput
    | WorkspaceCommandOutput
    | WorkspaceListingOutput
    | WorkspaceReadOutput
    | WorkspaceSearchOutput

function isTestResults(output: ToolOutputValue): output is TestResultsOutput {
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
    tools?: AITool[]
    outputSchema?: string
}

function isAgentOutput(
    output: ToolOutputValue
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
    output: ToolOutputValue
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

function isWorkspaceCommandOutput(
    output: ToolOutputValue
): output is WorkspaceCommandOutput {
    if (!output || typeof output !== 'object') {
        return false
    }

    const obj = output as Record<string, unknown>
    return (
        typeof obj.stdout === 'string' &&
        typeof obj.stderr === 'string' &&
        typeof obj.exitCode === 'number' &&
        !('type' in obj)
    )
}

function isWorkspaceListingOutput(
    output: ToolOutputValue
): output is WorkspaceListingOutput {
    if (!output || typeof output !== 'object') {
        return false
    }

    const obj = output as Record<string, unknown>
    return (
        typeof obj.path === 'string' &&
        Array.isArray(obj.entries) &&
        obj.entries.every(
            (entry) =>
                isRecord(entry) &&
                typeof entry.path === 'string' &&
                typeof entry.is_dir === 'boolean'
        )
    )
}

function isWorkspaceReadOutput(
    output: ToolOutputValue
): output is WorkspaceReadOutput {
    if (!output || typeof output !== 'object') {
        return false
    }

    const obj = output as Record<string, unknown>
    return (
        typeof obj.path === 'string' &&
        typeof obj.content === 'string' &&
        !Array.isArray(obj.content)
    )
}

function isWorkspaceSearchOutput(
    output: ToolOutputValue
): output is WorkspaceSearchOutput {
    if (!output || typeof output !== 'object') {
        return false
    }

    const obj = output as Record<string, unknown>
    return (
        typeof obj.query === 'string' &&
        Array.isArray(obj.results) &&
        obj.results.every(
            (result) =>
                isRecord(result) &&
                typeof result.path === 'string' &&
                typeof result.score === 'number'
        )
    )
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

function renderWorkspaceCommandOutput(
    output: WorkspaceCommandOutput,
    isStreaming: boolean,
    toolState: ToolUIPart['state'],
    toolName: string
): React.ReactNode {
    const terminalOutput = formatWorkspaceCommandOutput(output)

    return (
        <Sandbox defaultOpen>
            <SandboxHeader
                title={toolName === 'execute_command' ? 'Workspace Sandbox' : toolName}
                state={isStreaming ? 'output-available' : toolState}
            />
            <SandboxContent>
                <SandboxTabs defaultValue="terminal">
                    <SandboxTabsBar>
                        <SandboxTabsList>
                            <SandboxTabsTrigger value="terminal">
                                Terminal
                            </SandboxTabsTrigger>
                        </SandboxTabsList>
                    </SandboxTabsBar>
                    <SandboxTabContent value="terminal">
                        <Terminal output={terminalOutput} isStreaming={isStreaming}>
                            <TerminalContent />
                        </Terminal>
                    </SandboxTabContent>
                </SandboxTabs>
            </SandboxContent>
        </Sandbox>
    )
}

function renderWorkspaceListingOutput(
    output: WorkspaceListingOutput
): React.ReactNode {
    return (
        <Artifact>
            <ArtifactHeader>
                <div className="flex items-center gap-2">
                    <FolderIcon className="size-4 text-muted-foreground" />
                    <ArtifactTitle className="text-sm">
                        {output.path}
                    </ArtifactTitle>
                </div>
            </ArtifactHeader>
            <ArtifactContent>
                <FileTree defaultExpanded={new Set([''])}>
                    {renderFileTree(workspaceEntriesToFileNodes(output.entries, output.path))}
                </FileTree>
            </ArtifactContent>
        </Artifact>
    )
}

function renderWorkspaceReadOutput(output: WorkspaceReadOutput): React.ReactNode {
    return (
        <Artifact>
            <ArtifactHeader>
                <div className="flex items-center gap-2">
                    <FileJsonIcon className="size-4 text-muted-foreground" />
                    <ArtifactTitle className="text-sm">{output.path}</ArtifactTitle>
                </div>
            </ArtifactHeader>
            <ArtifactContent className="p-0">
                <CodeBlock
                    code={output.content}
                    language={inferCodeLanguageFromPath(output.path)}
                    showLineNumbers
                />
            </ArtifactContent>
        </Artifact>
    )
}

function renderWorkspaceSearchOutput(
    output: WorkspaceSearchOutput
): React.ReactNode {
    return (
        <Artifact>
            <ArtifactHeader>
                <div className="flex items-center gap-2">
                    <HistoryIcon className="size-4 text-muted-foreground" />
                    <ArtifactTitle className="text-sm">
                        Workspace search: {output.query}
                    </ArtifactTitle>
                </div>
            </ArtifactHeader>
            <ArtifactContent className="space-y-3">
                {output.results.length === 0 ? (
                    <ArtifactDescription>No matching workspace results.</ArtifactDescription>
                ) : (
                    output.results.map((result) => (
                        <div key={`${result.path}-${result.score}`} className="rounded-md border p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-sm">{result.path}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Score: {result.score.toFixed(3)}
                                        {result.lineRange
                                            ? ` • Lines ${result.lineRange[0]}-${result.lineRange[1]}`
                                            : ''}
                                    </div>
                                </div>
                            </div>
                            {result.snippet ? (
                                <CodeBlock
                                    code={result.snippet}
                                    language={inferCodeLanguageFromPath(result.path)}
                                />
                            ) : null}
                        </div>
                    ))
                )}
            </ArtifactContent>
        </Artifact>
    )
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
function isSchemaOutput(output: ToolOutputValue): output is SchemaOutput {
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

function isSnippetOutput(output: ToolOutputValue): output is SnippetOutput {
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
    output: ToolOutputValue
): output is PackageInfoOutput {
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

function isCheckpointOutput(
    output: ToolOutputValue
): output is CheckpointOutput {
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

function isConfirmationOutput(
    output: ToolOutputValue
): output is ConfirmationOutput {
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

function isJsxPreviewOutput(
    output: ToolOutputValue
): output is JsxPreviewOutput {
    if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>
        return (
            typeof obj.jsx === 'string' ||
            (obj.type === 'jsx-preview' && typeof obj.content === 'string')
        )
    }
    return false
}

function getJsxPreviewContent(output: {
    jsx?: string
    content?: string
}): string {
    return output.jsx ?? output.content ?? ''
}

interface DataPartArtifactProps {
    partType: string
    data: unknown
}

const DataPartArtifact = memo(function DataPartArtifact({
    partType,
    data,
}: DataPartArtifactProps) {
    const serializedData = useMemo(() => safeJsonStringify(data), [data])

    return (
        <Artifact>
            <ArtifactHeader>
                <div className="flex items-center gap-2">
                    <FileJsonIcon className="size-4 text-muted-foreground" />
                    <ArtifactTitle className="text-sm">
                        {partType}
                    </ArtifactTitle>
                </div>
            </ArtifactHeader>
            <ArtifactContent className="p-0">
                <CodeBlock
                    code={serializedData}
                    language="json"
                    showLineNumbers
                />
            </ArtifactContent>
        </Artifact>
    )
})

function safeJsonStringify(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

function formatWorkspaceCommandOutput(output: WorkspaceCommandOutput): string {
    const sections: string[] = []

    sections.push(
        [
            `$ exitCode=${output.exitCode}`,
            typeof output.durationMs === 'number'
                ? `duration=${output.durationMs}ms`
                : undefined,
            output.timedOut ? 'timedOut=true' : undefined,
            output.aborted ? 'aborted=true' : undefined,
        ]
            .filter(Boolean)
            .join(' ')
    )

    if (output.stdout.length > 0) {
        sections.push(output.stdout)
    }

    if (output.stderr.length > 0) {
        sections.push(output.stdout.length > 0 ? `\n[stderr]\n${output.stderr}` : `[stderr]\n${output.stderr}`)
    }

    if (output.stdoutTruncated || output.stderrTruncated) {
        sections.push('\n[output truncated]')
    }

    return sections.join('\n')
}

function workspaceEntriesToFileNodes(
    entries: WorkspaceFileEntry[],
    rootPath: string
): FileNode[] {
    const rootNodes: FileNode[] = []

    const ensureFolder = (nodes: FileNode[], name: string, path: string): FileNode => {
        const existing = nodes.find(
            (node) => node.type === 'folder' && node.name === name
        )
        if (existing) {
            existing.children ??= []
            return existing
        }

        const folder: FileNode = {
            name,
            path,
            type: 'folder',
            children: [],
        }
        nodes.push(folder)
        return folder
    }

    for (const entry of entries) {
        const relativePath = toRelativeWorkspacePath(entry.path, rootPath)
        const segments = relativePath.split('/').filter(Boolean)
        if (segments.length === 0) {
            continue
        }

        let level = rootNodes
        let currentPath = ''

        for (let index = 0; index < segments.length; index += 1) {
            const segment = segments[index]
            currentPath = currentPath ? `${currentPath}/${segment}` : segment
            const isLeaf = index === segments.length - 1

            if (isLeaf && !entry.is_dir) {
                level.push({
                    name: segment,
                    path: currentPath,
                    type: 'file',
                })
                continue
            }

            const folder = ensureFolder(level, segment, currentPath)
            level = folder.children ?? []
            folder.children = level
        }
    }

    return sortFileNodes(rootNodes)
}

function sortFileNodes(nodes: FileNode[]): FileNode[] {
    return [...nodes]
        .sort((left, right) => {
            if (left.type !== right.type) {
                return left.type === 'folder' ? -1 : 1
            }
            return left.name.localeCompare(right.name)
        })
        .map((node) =>
            node.type === 'folder' && node.children
                ? { ...node, children: sortFileNodes(node.children) }
                : node
        )
}

function toRelativeWorkspacePath(path: string, rootPath: string): string {
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '')
    const normalizedRoot = rootPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')

    if (normalizedRoot.length === 0) {
        return normalizedPath
    }

    return normalizedPath.startsWith(`${normalizedRoot}/`)
        ? normalizedPath.slice(normalizedRoot.length + 1)
        : normalizedPath
}

function inferCodeLanguageFromPath(
    path: string
): 'typescript' | 'javascript' | 'python' | 'json' | 'bash' | 'html' | 'css' {
    return inferCodeLanguage({
        type: 'file',
        filename: path.split('/').pop(),
        mediaType: 'text/plain',
        url: path,
    })
}

interface PlanStepData {
    title: string
    description?: string
}

interface PlanDataShape {
    title: string
    description?: string
    steps?: PlanStepData[]
    isStreaming?: boolean
}

interface TaskDataShape {
    title: string
    items: Array<{
        text: string
        file?: string
    }>
}

interface QueueAttachmentData {
    type: 'image' | 'file'
    url?: string
    filename?: string
}

interface QueueItemData {
    id: string
    title: string
    description?: string
    status?: 'pending' | 'completed'
    attachments?: QueueAttachmentData[]
}

interface QueueSectionData {
    id: string
    label: string
    items: QueueItemData[]
}

interface QueueDataShape {
    sections: QueueSectionData[]
}

interface ChainOfThoughtStepData {
    label: string
    description?: string
    status?: 'complete' | 'active' | 'pending'
}

interface ChainOfThoughtDataShape {
    title?: string
    steps: ChainOfThoughtStepData[]
    searchResults?: string[]
}

function renderStructuredDataPart(
    partType: string,
    data: unknown
): React.ReactNode | null {
    if (isPlanDataPart(partType, data)) {
        return renderPlanData(data)
    }

    if (isTaskDataPart(partType, data)) {
        return renderTaskData(data)
    }

    if (isQueueDataPart(partType, data)) {
        return renderQueueData(data)
    }

    if (isChainOfThoughtDataPart(partType, data)) {
        return renderChainOfThoughtData(data)
    }

    return null
}

function isPlanDataPart(partType: string, data: unknown): data is PlanDataShape {
    return (
        partType.includes('plan') &&
        isRecord(data) &&
        typeof data.title === 'string'
    )
}

function isTaskDataPart(partType: string, data: unknown): data is TaskDataShape {
    return (
        partType.includes('task') &&
        isRecord(data) &&
        typeof data.title === 'string' &&
        Array.isArray(data.items)
    )
}

function isQueueDataPart(
    partType: string,
    data: unknown
): data is QueueDataShape {
    return partType.includes('queue') && isRecord(data) && Array.isArray(data.sections)
}

function isChainOfThoughtDataPart(
    partType: string,
    data: unknown
): data is ChainOfThoughtDataShape {
    return (
        (partType.includes('chain') || partType.includes('thought')) &&
        isRecord(data) &&
        Array.isArray(data.steps)
    )
}

function renderPlanData(data: PlanDataShape): React.ReactNode {
    return (
        <Plan defaultOpen isStreaming={data.isStreaming ?? false}>
            <PlanHeader>
                <div>
                    <PlanTitle>{data.title}</PlanTitle>
                    {data.description ? (
                        <PlanDescription>{data.description}</PlanDescription>
                    ) : null}
                </div>
                <PlanAction>
                    <PlanTrigger />
                </PlanAction>
            </PlanHeader>
            {Array.isArray(data.steps) && data.steps.length > 0 ? (
                <PlanContent className="space-y-2">
                    {data.steps.map((step, index) => (
                        <TaskItem key={`${step.title}-${index}`}>
                            {index + 1}. {step.title}
                            {step.description ? ` — ${step.description}` : ''}
                        </TaskItem>
                    ))}
                </PlanContent>
            ) : null}
        </Plan>
    )
}

function renderTaskData(data: TaskDataShape): React.ReactNode {
    return (
        <Task defaultOpen>
            <TaskTrigger title={data.title} />
            <TaskContent>
                {data.items.map((item, index) => (
                    <TaskItem key={`${item.text}-${index}`}>
                        {item.text}
                        {item.file ? <TaskItemFile>{item.file}</TaskItemFile> : null}
                    </TaskItem>
                ))}
            </TaskContent>
        </Task>
    )
}

function renderQueueData(data: QueueDataShape): React.ReactNode {
    return (
        <Queue>
            {data.sections.map((section) => (
                <QueueSection key={section.id} defaultOpen>
                    <QueueSectionTrigger>
                        <QueueSectionLabel
                            count={section.items.length}
                            label={section.label}
                        />
                    </QueueSectionTrigger>
                    <QueueSectionContent>
                        <QueueList>
                            {section.items.map((item) => {
                                const completed = item.status === 'completed'

                                return (
                                    <QueueItem key={item.id}>
                                        <div className="flex items-start gap-2">
                                            <QueueItemIndicator
                                                completed={completed}
                                            />
                                            <QueueItemContent
                                                completed={completed}
                                            >
                                                {item.title}
                                            </QueueItemContent>
                                        </div>
                                        {item.description ? (
                                            <QueueItemDescription
                                                completed={completed}
                                            >
                                                {item.description}
                                            </QueueItemDescription>
                                        ) : null}
                                        {Array.isArray(item.attachments) &&
                                        item.attachments.length > 0 ? (
                                            <QueueItemAttachment>
                                                {item.attachments.map(
                                                    (attachment, index) =>
                                                        attachment.type ===
                                                            'image' &&
                                                        attachment.url ? (
                                                            <QueueItemImage
                                                                key={`${item.id}-image-${index}`}
                                                                src={attachment.url}
                                                            />
                                                        ) : (
                                                            <QueueItemFile
                                                                key={`${item.id}-file-${index}`}
                                                            >
                                                                {attachment.filename ??
                                                                    attachment.url ??
                                                                    'attachment'}
                                                            </QueueItemFile>
                                                        )
                                                )}
                                            </QueueItemAttachment>
                                        ) : null}
                                    </QueueItem>
                                )
                            })}
                        </QueueList>
                    </QueueSectionContent>
                </QueueSection>
            ))}
        </Queue>
    )
}

function renderChainOfThoughtData(
    data: ChainOfThoughtDataShape
): React.ReactNode {
    return (
        <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader>
                {data.title ?? 'Chain of Thought'}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {Array.isArray(data.searchResults) &&
                data.searchResults.length > 0 ? (
                    <ChainOfThoughtSearchResults>
                        {data.searchResults.map((result, index) => (
                            <ChainOfThoughtSearchResult key={`${result}-${index}`}>
                                {result}
                            </ChainOfThoughtSearchResult>
                        ))}
                    </ChainOfThoughtSearchResults>
                ) : null}
                {data.steps.map((step, index) => (
                    <ChainOfThoughtStep
                        key={`${step.label}-${index}`}
                        label={step.label}
                        description={step.description}
                        status={step.status ?? 'complete'}
                    />
                ))}
            </ChainOfThoughtContent>
        </ChainOfThought>
    )
}

// Render schema display
function renderSchema(output: ToolOutputValue): React.ReactNode {
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
                        {output.parameters.map((p) => (
                            <SchemaDisplayParameter key={p.name} {...p} />
                        ))}
                    </SchemaDisplayParameters>
                )}

                {output.requestBody && output.requestBody.length > 0 && (
                    <SchemaDisplayRequest>
                        <SchemaDisplayBody>
                            {output.requestBody.map((prop) => (
                                <SchemaDisplayProperty
                                    key={prop.name}
                                    {...prop}
                                />
                            ))}
                        </SchemaDisplayBody>
                    </SchemaDisplayRequest>
                )}

                {output.responseBody && output.responseBody.length > 0 && (
                    <SchemaDisplayResponse>
                        <SchemaDisplayBody>
                            {output.responseBody.map((prop) => (
                                <SchemaDisplayProperty
                                    key={prop.name}
                                    {...prop}
                                />
                            ))}
                        </SchemaDisplayBody>
                    </SchemaDisplayResponse>
                )}
            </SchemaDisplayContent>

            <SchemaDisplayExample>
                <div className="flex items-center gap-2">
                    <CodeIcon className="size-4" />
                    <span className="font-mono text-sm">
                        {output.method} {output.path}
                    </span>
                </div>
                <pre className="mt-2">
                    {JSON.stringify(
                        { method: output.method, path: output.path },
                        null,
                        2
                    )}
                </pre>
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
function renderSnippet(output: ToolOutputValue): React.ReactNode {
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
function renderPackageInfo(output: ToolOutputValue): React.ReactNode {
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
                        {Object.entries(pkg.dependencies).map(
                            ([depName, depVersion]) => (
                                <PackageInfoDependency key={depName} name={''}>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="truncate">
                                            {depName}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {depVersion}
                                        </span>
                                    </div>
                                </PackageInfoDependency>
                            )
                        )}
                    </PackageInfoDependencies>
                </PackageInfoContent>
            )}
        </PackageInfo>
    )
}

// Render checkpoint
function renderCheckpoint(output: ToolOutputValue): React.ReactNode {
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
    output: ToolOutputValue,
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

function areMessagesEquivalent(left: UIMessage[], right: UIMessage[]): boolean {
    if (left.length !== right.length) {
        return false
    }

    return left.every((message, index) => {
        const candidate = right[index]

        return (
            message.id === candidate?.id &&
            message.role === candidate?.role &&
            isDeepEqualData(
                message.metadata ?? null,
                candidate?.metadata ?? null
            ) &&
            isDeepEqualData(message.parts, candidate?.parts)
        )
    })
}

function describeMessageValidationError(validationError: Error): string {
    if (validationError instanceof InvalidResponseDataError) {
        return 'The server returned UI message data that does not match the expected structure.'
    }

    if (validationError instanceof InvalidMessageRoleError) {
        return 'A restored message used an unsupported role.'
    }

    if (validationError instanceof InvalidArgumentError) {
        return 'The conversation payload was missing a required argument during validation.'
    }

    if (validationError instanceof UIMessageStreamError) {
        return 'A streamed UI message chunk could not be reconstructed cleanly.'
    }

    return validationError.message
}

function canReadFilePartAsText(part: FileUIPart): boolean {
    return (
        part.url.startsWith('data:text/') ||
        part.mediaType.startsWith('text/') ||
        part.mediaType === 'application/json'
    )
}

function readTextFromFilePart(part: FileUIPart): string {
    try {
        if (part.url.startsWith('data:')) {
            return getTextFromDataUrl(part.url)
        }
    } catch {
        // Fall through to link fallback.
    }

    return `${part.filename ?? 'Attached file'}\n${part.url}`
}

function inferCodeLanguage(
    part: FileUIPart
): 'typescript' | 'javascript' | 'python' | 'json' | 'bash' | 'html' | 'css' {
    const filename = part.filename?.toLowerCase() ?? ''

    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
        return 'typescript'
    }

    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
        return 'javascript'
    }

    if (filename.endsWith('.py')) {
        return 'python'
    }

    if (filename.endsWith('.html')) {
        return 'html'
    }

    if (filename.endsWith('.css')) {
        return 'css'
    }

    if (filename.endsWith('.sh')) {
        return 'bash'
    }

    return 'json'
}
