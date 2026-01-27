'use client'

import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuItem,
    PromptInputActionMenuTrigger,
    PromptInputProvider,
} from '@/components/ai-elements/prompt-input'
import { SpeechInput } from '@/components/ai-elements/speech-input'
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
import { ImageIcon, PaperclipIcon } from 'lucide-react'
import { useState, useCallback, useRef } from 'react'
// ChatStatus type based on Vercel AI SDK behavior
type ChatStatus = 'streaming' | 'submitted' | 'ready' | 'error' | undefined

interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

interface ChatInputProps {
    onSubmit: (message: PromptInputMessage) => Promise<void>
    tokenUsage?: TokenUsage
    selectedModel?: string
    onModelChange?: (model: string) => void
    modelOptions?: string[]
    showWebPreview?: boolean
    onWebPreviewToggle?: (show: boolean) => void
}

export function ChatInput({
    onSubmit,
    tokenUsage,
    selectedModel = '',
    onModelChange,
    modelOptions = [],
    showWebPreview = false,
    onWebPreviewToggle,
}: ChatInputProps) {
    const [status, setStatus] = useState<ChatStatus | undefined>(undefined)
    const [showModelSelector, setShowModelSelector] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = useCallback(
        async (message: PromptInputMessage) => {
            setStatus('submitted')
            try {
                await onSubmit(message)
                setStatus(undefined)
            } catch {
                setStatus('error')
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

    const selectedProvider = getProviderFromModelId(selectedModel)

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
                                    <PromptInputActionMenuItem>
                                        <ImageIcon className="mr-2 size-4" />
                                        Upload Image
                                    </PromptInputActionMenuItem>
                                    <PromptInputActionMenuItem>
                                        <PaperclipIcon className="mr-2 size-4" />
                                        Attach File
                                    </PromptInputActionMenuItem>
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
                                                {selectedModel.trim().length >
                                                0
                                                    ? selectedModel
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
                        </div>
                    </PromptInputFooter>
                </PromptInput>
            </PromptInputProvider>
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

// Helper component for empty state
function ModelSelectorEmpty({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-6 text-center text-sm text-muted-foreground">
            {children}
        </div>
    )
}
