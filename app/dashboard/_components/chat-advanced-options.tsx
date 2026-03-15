'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdvancedChatOptions } from './chat-options'

interface ChatAdvancedOptionsProps {
    options: AdvancedChatOptions
    activeOptionCount: number
    onChange: <K extends keyof AdvancedChatOptions>(
        key: K,
        value: AdvancedChatOptions[K]
    ) => void
    onReset: () => void
    className?: string
}

export function ChatAdvancedOptions({
    options,
    activeOptionCount,
    onChange,
    onReset,
    className = '',
}: ChatAdvancedOptionsProps) {
    return (
        <details className={`rounded-lg border bg-background ${className}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                <span>Advanced chat options</span>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{activeOptionCount} active</Badge>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                            event.preventDefault()
                            onReset()
                        }}
                    >
                        Reset
                    </Button>
                </div>
            </summary>

            <div className="space-y-6 border-t px-4 py-4">
                <OptionSection title="Generation">
                    <OptionField label="Temperature">
                        <input
                            value={options.temperature}
                            onChange={(event) =>
                                onChange('temperature', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="0.7"
                        />
                    </OptionField>
                    <OptionField label="Max output tokens">
                        <input
                            value={options.maxOutputTokens}
                            onChange={(event) =>
                                onChange('maxOutputTokens', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="4000"
                        />
                    </OptionField>
                    <OptionField label="Max steps">
                        <input
                            value={options.maxSteps}
                            onChange={(event) =>
                                onChange('maxSteps', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="10"
                        />
                    </OptionField>
                    <OptionField label="Top P">
                        <input
                            value={options.topP}
                            onChange={(event) =>
                                onChange('topP', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="0.95"
                        />
                    </OptionField>
                    <OptionField label="Top K">
                        <input
                            value={options.topK}
                            onChange={(event) =>
                                onChange('topK', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="40"
                        />
                    </OptionField>
                    <OptionField label="Frequency penalty">
                        <input
                            value={options.frequencyPenalty}
                            onChange={(event) =>
                                onChange('frequencyPenalty', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="0"
                        />
                    </OptionField>
                    <OptionField label="Presence penalty">
                        <input
                            value={options.presencePenalty}
                            onChange={(event) =>
                                onChange('presencePenalty', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="0"
                        />
                    </OptionField>
                    <OptionField label="Seed">
                        <input
                            value={options.seed}
                            onChange={(event) =>
                                onChange('seed', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="42"
                        />
                    </OptionField>
                    <OptionField label="Stop sequences">
                        <input
                            value={options.stopSequences}
                            onChange={(event) =>
                                onChange('stopSequences', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="END, STOP"
                        />
                    </OptionField>
                    <OptionField label="Max retries">
                        <input
                            value={options.maxRetries}
                            onChange={(event) =>
                                onChange('maxRetries', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="2"
                        />
                    </OptionField>
                </OptionSection>

                <OptionSection title="Memory">
                    <ToggleField
                        label="Read only"
                        checked={options.readOnly}
                        onCheckedChange={(checked) =>
                            onChange('readOnly', checked)
                        }
                    />
                    <OptionField label="Context limit">
                        <input
                            value={options.contextLimit}
                            onChange={(event) =>
                                onChange('contextLimit', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="20"
                        />
                    </OptionField>
                    <OptionField label="Persistence mode">
                        <select
                            value={options.persistenceMode}
                            onChange={(event) =>
                                onChange(
                                    'persistenceMode',
                                    event.target.value as AdvancedChatOptions['persistenceMode']
                                )
                            }
                            className={INPUT_CLASS_NAME}
                        >
                            <option value="step">step</option>
                            <option value="finish">finish</option>
                        </select>
                    </OptionField>
                    <OptionField label="Debounce ms">
                        <input
                            value={options.debounceMs}
                            onChange={(event) =>
                                onChange('debounceMs', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="200"
                        />
                    </OptionField>
                    <ToggleField
                        label="Flush on tool result"
                        checked={options.flushOnToolResult}
                        onCheckedChange={(checked) =>
                            onChange('flushOnToolResult', checked)
                        }
                    />
                </OptionSection>

                <OptionSection title="Semantic memory">
                    <ToggleField
                        label="Enable semantic memory"
                        checked={options.semanticMemoryEnabled}
                        onCheckedChange={(checked) =>
                            onChange('semanticMemoryEnabled', checked)
                        }
                    />
                    <OptionField label="Semantic limit">
                        <input
                            value={options.semanticMemoryLimit}
                            onChange={(event) =>
                                onChange('semanticMemoryLimit', event.target.value)
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="8"
                        />
                    </OptionField>
                    <OptionField label="Semantic threshold">
                        <input
                            value={options.semanticMemoryThreshold}
                            onChange={(event) =>
                                onChange(
                                    'semanticMemoryThreshold',
                                    event.target.value
                                )
                            }
                            className={INPUT_CLASS_NAME}
                            placeholder="0.7"
                        />
                    </OptionField>
                    <OptionField label="Merge strategy">
                        <select
                            value={options.semanticMemoryMergeStrategy}
                            onChange={(event) =>
                                onChange(
                                    'semanticMemoryMergeStrategy',
                                    event.target.value as AdvancedChatOptions['semanticMemoryMergeStrategy']
                                )
                            }
                            className={INPUT_CLASS_NAME}
                        >
                            <option value="prepend">prepend</option>
                            <option value="append">append</option>
                            <option value="interleave">interleave</option>
                        </select>
                    </OptionField>
                </OptionSection>

                <OptionSection title="Provider options">
                    <OptionField label="OpenAI reasoning effort">
                        <select
                            value={options.openaiReasoningEffort}
                            onChange={(event) =>
                                onChange(
                                    'openaiReasoningEffort',
                                    event.target.value as AdvancedChatOptions['openaiReasoningEffort']
                                )
                            }
                            className={INPUT_CLASS_NAME}
                        >
                            <option value="">default</option>
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                        </select>
                    </OptionField>
                    <OptionField label="OpenAI text verbosity">
                        <select
                            value={options.openaiTextVerbosity}
                            onChange={(event) =>
                                onChange(
                                    'openaiTextVerbosity',
                                    event.target.value as AdvancedChatOptions['openaiTextVerbosity']
                                )
                            }
                            className={INPUT_CLASS_NAME}
                        >
                            <option value="">default</option>
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                        </select>
                    </OptionField>
                    <ToggleField
                        label="Anthropic send reasoning"
                        checked={options.anthropicSendReasoning}
                        onCheckedChange={(checked) =>
                            onChange('anthropicSendReasoning', checked)
                        }
                    />
                    <OptionField label="xAI reasoning effort">
                        <select
                            value={options.xaiReasoningEffort}
                            onChange={(event) =>
                                onChange(
                                    'xaiReasoningEffort',
                                    event.target.value as AdvancedChatOptions['xaiReasoningEffort']
                                )
                            }
                            className={INPUT_CLASS_NAME}
                        >
                            <option value="">default</option>
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                        </select>
                    </OptionField>
                    <OptionField label="Google thinking config JSON" fullWidth>
                        <textarea
                            value={options.googleThinkingConfigJson}
                            onChange={(event) =>
                                onChange(
                                    'googleThinkingConfigJson',
                                    event.target.value
                                )
                            }
                            className={TEXTAREA_CLASS_NAME}
                            placeholder='{"thinkingBudget": 1024}'
                            rows={3}
                        />
                    </OptionField>
                    <OptionField label="Extra provider options JSON" fullWidth>
                        <textarea
                            value={options.extraProviderOptionsJson}
                            onChange={(event) =>
                                onChange(
                                    'extraProviderOptionsJson',
                                    event.target.value
                                )
                            }
                            className={TEXTAREA_CLASS_NAME}
                            placeholder='{"customFlag": true}'
                            rows={3}
                        />
                    </OptionField>
                </OptionSection>

                <OptionSection title="Context">
                    <OptionField label="Context JSON" fullWidth>
                        <textarea
                            value={options.contextJson}
                            onChange={(event) =>
                                onChange('contextJson', event.target.value)
                            }
                            className={TEXTAREA_CLASS_NAME}
                            placeholder='{"role": "admin", "project": "mastervolt"}'
                            rows={3}
                        />
                    </OptionField>
                </OptionSection>
            </div>
        </details>
    )
}

function OptionSection({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-3">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="grid gap-3 md:grid-cols-2">{children}</div>
        </section>
    )
}

function OptionField({
    label,
    children,
    fullWidth = false,
}: {
    label: string
    children: React.ReactNode
    fullWidth?: boolean
}) {
    return (
        <label className={`space-y-1 text-xs text-muted-foreground ${fullWidth ? 'md:col-span-2' : ''}`}>
            <span>{label}</span>
            {children}
        </label>
    )
}

function ToggleField({
    label,
    checked,
    onCheckedChange,
}: {
    label: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs text-muted-foreground">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onCheckedChange(event.target.checked)}
                className="size-4"
            />
        </label>
    )
}

const INPUT_CLASS_NAME =
    'w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring'

const TEXTAREA_CLASS_NAME =
    'w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring'