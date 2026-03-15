'use client'

import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    PromptInputActionAddAttachments,
    PromptInputActionAddScreenshot,
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputProvider,
    usePromptInputAttachments,
    usePromptInputController,
} from '@/components/ai-elements/prompt-input'
import {
    Attachment,
    Attachments,
    AttachmentHoverCard,
    AttachmentHoverCardContent,
    AttachmentHoverCardTrigger,
    AttachmentInfo,
    AttachmentPreview,
    AttachmentRemove,
} from '@/components/ai-elements/attachments'
import { SpeechInput } from '@/components/ai-elements/speech-input'
import {
    WebPreview,
    WebPreviewBody,
    WebPreviewNavigation,
    WebPreviewUrl,
} from '@/components/ai-elements/web-preview'
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorDialog,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorName,
} from '@/components/ai-elements/model-selector'
import { cn } from '@/lib/utils'
import { GlobeIcon } from 'lucide-react'
import { useState, useCallback, useMemo, useRef } from 'react'
// ChatStatus type based on Vercel AI SDK behavior, Im not using Vercel AI SDK, im using Voltagent with AI SDK but the status values are similar enough that this type is still relevant for managing the submit button state in the UI. If we had a more direct integration with Vercel AI SDK, we might be able to use their types directly instead of defining our own ChatStatus type here.
type ChatStatus = 'streaming' | 'submitted' | 'ready' | 'error' | undefined

interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

interface ChatInputProps {
    onSubmit: (message: PromptInputMessage) => Promise<void>
    status?: ChatStatus
    onStop?: () => void
    tokenUsage?: TokenUsage
    selectedModel?: string
    defaultModelId?: string
    onModelChange?: (model: string) => void
    modelOptions?: string[]
    showWebPreview?: boolean
    onWebPreviewToggle?: (show: boolean) => void
}

export function ChatInput({
    onSubmit,
    status: externalStatus,
    onStop,
    tokenUsage,
    selectedModel = '',
    defaultModelId = '',
    onModelChange,
    modelOptions = [],
    showWebPreview = false,
    onWebPreviewToggle,
}: ChatInputProps) {
    const [localStatus, setLocalStatus] = useState<ChatStatus | undefined>(undefined)
    const [showModelSelector, setShowModelSelector] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const status = externalStatus ?? localStatus

    const handleSubmit = useCallback(
        async (message: PromptInputMessage) => {
            setLocalStatus('submitted')
            try {
                await onSubmit(message)
                setLocalStatus(undefined)
            } catch {
                setLocalStatus('error')
            }
        },
        [onSubmit]
    )

    const handleSpeechTranscription = useCallback((text: string) => {
        if (textareaRef.current) {
            textareaRef.current.value = text
            textareaRef.current.dispatchEvent(
                new Event('input', { bubbles: true })
            )
        }
    }, [])

    const handleModelSelect = useCallback(
        (modelId: string) => {
            onModelChange?.(modelId)
            setShowModelSelector(false)
        },
        [onModelChange]
    )

    const effectiveModelId =
        selectedModel.trim().length > 0 ? selectedModel : defaultModelId
    const selectedProvider = getProviderFromModelId(effectiveModelId)

    return (
        <div className="border-t bg-background">
            {/* Token Usage Display */}
            {tokenUsage && tokenUsage.totalTokens > 0 && (
                <div className="flex justify-center border-b py-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                                >
                                    <span className="font-mono">
                                        {tokenUsage.promptTokens.toLocaleString()}{' '}
                                        →{' '}
                                        {tokenUsage.completionTokens.toLocaleString()}{' '}
                                        (
                                        {tokenUsage.totalTokens.toLocaleString()}
                                        )
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">
                                    <span className="font-medium">
                                        Prompt:{' '}
                                    </span>
                                    {tokenUsage.promptTokens.toLocaleString()}{' '}
                                    tokens
                                </p>
                                <p className="text-xs">
                                    <span className="font-medium">
                                        Completion:{' '}
                                    </span>
                                    {tokenUsage.completionTokens.toLocaleString()}{' '}
                                    tokens
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <PromptInputProvider>
                <PromptInput onSubmit={handleSubmit} className="w-full">
                    <PromptInputBody>
                        <PromptInputTextarea
                            ref={textareaRef}
                            placeholder="Ask about your research..."
                            className="min-h-15 max-h-50 w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                        />

                        <ChatInputAttachments />

                        {showWebPreview ? <ChatInputWebPreview /> : null}
                    </PromptInputBody>

                    <PromptInputFooter>
                        {/* Left side: Tools */}
                        <PromptInputTools className="gap-1">
                            {/* Speech Input */}
                            <SpeechInput
                                onTranscriptionChange={
                                    handleSpeechTranscription
                                }
                                className="h-8 w-8"
                                aria-label="Speech input"
                            />

                            {/* Web Preview Toggle */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant={
                                                showWebPreview
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            size="icon-sm"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                onWebPreviewToggle?.(
                                                    !showWebPreview
                                                )
                                            }
                                        >
                                            <svg
                                                className="size-4"
                                                fill="none"
                                                height="24"
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                width="24"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                />
                                                <line
                                                    x1="2"
                                                    x2="22"
                                                    y1="12"
                                                    y2="12"
                                                />
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Toggle Web Preview</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Attachment Menu */}
                            <PromptInputActionMenu>
                                <PromptInputActionMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="h-8 w-8"
                                    >
                                        <span className="sr-only">
                                            Add attachment
                                        </span>
                                        <svg
                                            className="size-4"
                                            fill="none"
                                            height="24"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            width="24"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="M12 5v14" />
                                        </svg>
                                    </Button>
                                </PromptInputActionMenuTrigger>
                                <PromptInputActionMenuContent
                                    align="start"
                                    className="w-48"
                                >
                                    <PromptInputActionAddAttachments />
                                    <PromptInputActionAddScreenshot />
                                </PromptInputActionMenuContent>
                            </PromptInputActionMenu>

                            {/* Model Selector */}
                            <ModelSelector
                                open={showModelSelector}
                                onOpenChange={setShowModelSelector}
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setShowModelSelector(true)
                                                }
                                            >
                                                <svg
                                                    className="size-4"
                                                    fill="none"
                                                    height="24"
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                    width="24"
                                                >
                                                    <rect
                                                        height="18"
                                                        rx="2"
                                                        width="18"
                                                        x="3"
                                                        y="3"
                                                    />
                                                    <path d="M9 3v18" />
                                                    <path d="M15 3v18" />
                                                    <path d="M3 9h6" />
                                                    <path d="M3 15h6" />
                                                </svg>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Select Model</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <ModelSelectorContent
                                    title="Select Model"
                                    className="max-h-100 max-w-md"
                                >
                                    <ModelSelectorDialog
                                        open={showModelSelector}
                                        onOpenChange={setShowModelSelector}
                                    >
                                        <ModelSelectorInput placeholder="Search models..." />
                                        <ModelSelectorList>
                                            <ModelSelectorEmpty>
                                                No models found
                                            </ModelSelectorEmpty>
                                            {Object.entries(
                                                groupModelIdsByProvider(
                                                    modelOptions
                                                )
                                            ).map(([provider, models]) => (
                                                <ModelSelectorGroup
                                                    key={provider}
                                                    heading={provider}
                                                >
                                                    {models.map((modelId) => (
                                                        <ModelSelectorItem
                                                            key={modelId}
                                                            onClick={() =>
                                                                handleModelSelect(
                                                                    modelId
                                                                )
                                                            }
                                                            className={cn(
                                                                selectedModel ===
                                                                    modelId &&
                                                                    'bg-accent'
                                                            )}
                                                        >
                                                            {provider && (
                                                                <ModelSelectorLogo
                                                                    provider={
                                                                        provider
                                                                    }
                                                                />
                                                            )}
                                                            <ModelSelectorName>
                                                                {modelId}
                                                            </ModelSelectorName>
                                                        </ModelSelectorItem>
                                                    ))}
                                                </ModelSelectorGroup>
                                            ))}
                                        </ModelSelectorList>
                                    </ModelSelectorDialog>
                                </ModelSelectorContent>
                            </ModelSelector>
                        </PromptInputTools>

                        {/* Right side: Submit + Model Badge */}
                        <div className="flex items-center gap-2">
                            {/* Current Model Badge */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 gap-1 px-2 text-xs"
                                            onClick={() =>
                                                setShowModelSelector(true)
                                            }
                                        >
                                            {selectedProvider && (
                                                <ModelSelectorLogo
                                                    provider={selectedProvider}
                                                    className="size-3.5"
                                                />
                                            )}
                                            <span className="truncate max-w-40">
                                                {effectiveModelId.trim().length >
                                                0
                                                    ? effectiveModelId
                                                    : 'Model: (agent default)'}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Click to change model</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <PromptInputSubmit status={status} size="sm" />
                            {(status === 'streaming' || status === 'submitted') && onStop ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onStop}
                                >
                                    Stop
                                </Button>
                            ) : null}
                        </div>
                    </PromptInputFooter>
                </PromptInput>
            </PromptInputProvider>
        </div>
    )
}

function ChatInputAttachments() {
    const attachments = usePromptInputAttachments()

    if (attachments.files.length === 0) {
        return null
    }

    return (
        <Attachments className="px-3 pb-1" variant="grid">
            {attachments.files.map((file) => (
                <Attachment
                    key={file.id}
                    data={file}
                    onRemove={() => attachments.remove(file.id)}
                >
                    <AttachmentHoverCard>
                        <AttachmentHoverCardTrigger asChild>
                            <div className="size-full cursor-pointer">
                                <AttachmentPreview />
                            </div>
                        </AttachmentHoverCardTrigger>
                        <AttachmentHoverCardContent>
                            <div className="min-w-56 max-w-80">
                                <AttachmentPreview className="h-40 w-full rounded-md" />
                                <AttachmentInfo
                                    className="mt-2"
                                    showMediaType
                                />
                            </div>
                        </AttachmentHoverCardContent>
                    </AttachmentHoverCard>
                    <AttachmentRemove />
                </Attachment>
            ))}
        </Attachments>
    )
}

function ChatInputWebPreview() {
    const controller = usePromptInputController()
    const previewUrl = useMemo(
        () => extractFirstUrl(controller.textInput.value),
        [controller.textInput.value]
    )

    if (!previewUrl) {
        return (
            <div className="px-3 pb-2 text-xs text-muted-foreground">
                Type a URL in your message to preview it here.
            </div>
        )
    }

    return (
        <div className="px-3 pb-2">
            <WebPreview
                key={previewUrl}
                defaultUrl={previewUrl}
                className="h-72 overflow-hidden"
            >
                <WebPreviewNavigation>
                    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                        <GlobeIcon className="size-3.5" />
                        <span>Web preview</span>
                    </div>
                    <WebPreviewUrl />
                </WebPreviewNavigation>
                <WebPreviewBody />
            </WebPreview>
        </div>
    )
}

function getProviderFromModelId(modelId: string): string | undefined {
    const trimmed = modelId.trim()
    if (trimmed.length === 0) {
        return undefined
    }
    const idx = trimmed.indexOf('/')
    if (idx <= 0) {
        return undefined
    }
    return trimmed.slice(0, idx)
}

function groupModelIdsByProvider(modelIds: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    for (const id of modelIds) {
        const trimmed = id.trim()
        if (trimmed.length === 0) {
            continue
        }
        const provider = getProviderFromModelId(trimmed) ?? 'unknown'
        result[provider] ??= []
        result[provider].push(trimmed)
    }
    return result
}

function extractFirstUrl(text: string): string | undefined {
    const match = text.match(/https?:\/\/[^\s]+/i)
    const candidate = match?.[0]?.trim()

    if (!candidate) {
        return undefined
    }

    try {
        const url = new URL(candidate)
        return url.toString()
    } catch {
        return undefined
    }
}

// Helper component for empty state
function ModelSelectorEmpty({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-6 text-center text-sm text-muted-foreground">
            {children}
        </div>
    )
}
