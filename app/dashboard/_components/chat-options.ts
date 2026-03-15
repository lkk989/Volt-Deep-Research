'use client'

export interface AdvancedChatOptions {
    contextJson: string
    temperature: string
    maxOutputTokens: string
    maxSteps: string
    topP: string
    topK: string
    frequencyPenalty: string
    presencePenalty: string
    seed: string
    stopSequences: string
    maxRetries: string
    readOnly: boolean
    contextLimit: string
    persistenceMode: 'step' | 'finish'
    debounceMs: string
    flushOnToolResult: boolean
    semanticMemoryEnabled: boolean
    semanticMemoryLimit: string
    semanticMemoryThreshold: string
    semanticMemoryMergeStrategy: 'prepend' | 'append' | 'interleave'
    openaiReasoningEffort: '' | 'low' | 'medium' | 'high'
    openaiTextVerbosity: '' | 'low' | 'medium' | 'high'
    anthropicSendReasoning: boolean
    googleThinkingConfigJson: string
    xaiReasoningEffort: '' | 'low' | 'medium' | 'high'
    extraProviderOptionsJson: string
}

export const DEFAULT_ADVANCED_CHAT_OPTIONS: AdvancedChatOptions = {
    contextJson: '',
    temperature: '',
    maxOutputTokens: '64000',
    maxSteps: '',
    topP: '',
    topK: '',
    frequencyPenalty: '',
    presencePenalty: '',
    seed: '',
    stopSequences: '',
    maxRetries: '',
    readOnly: false,
    contextLimit: '',
    persistenceMode: 'step',
    debounceMs: '',
    flushOnToolResult: true,
    semanticMemoryEnabled: false,
    semanticMemoryLimit: '',
    semanticMemoryThreshold: '',
    semanticMemoryMergeStrategy: 'prepend',
    openaiReasoningEffort: '',
    openaiTextVerbosity: '',
    anthropicSendReasoning: false,
    googleThinkingConfigJson: '',
    xaiReasoningEffort: '',
    extraProviderOptionsJson: '',
}

interface BuildChatRequestOptionsParams {
    activeAgentId: string
    conversationId: string
    userId: string
    selectedModel: string
    advancedOptions: AdvancedChatOptions
}

export function buildChatRequestOptions({
    activeAgentId,
    conversationId,
    userId,
    selectedModel,
    advancedOptions,
}: BuildChatRequestOptionsParams): Record<string, unknown> {
    const trimmedModelId = selectedModel.trim()
    const [provider, ...modelParts] = trimmedModelId.split('/')
    const model = modelParts.join('/')
    const hasProviderAndModel =
        provider.trim().length > 0 && model.trim().length > 0

    const context = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...parseJsonObject(advancedOptions.contextJson),
        ...(trimmedModelId.length > 0 && hasProviderAndModel
            ? {
                  provider,
                  model,
                  modelId: trimmedModelId,
              }
            : {}),
    }

    const memoryOptions: Record<string, unknown> = {
        readOnly: advancedOptions.readOnly,
        conversationPersistence: {
            mode: advancedOptions.persistenceMode,
            flushOnToolResult: advancedOptions.flushOnToolResult,
            ...withDefinedNumber(
                'debounceMs',
                parseInteger(advancedOptions.debounceMs)
            ),
        },
        ...withDefinedNumber(
            'contextLimit',
            parseInteger(advancedOptions.contextLimit)
        ),
    }

    if (advancedOptions.semanticMemoryEnabled) {
        memoryOptions.semanticMemory = {
            enabled: true,
            mergeStrategy: advancedOptions.semanticMemoryMergeStrategy,
            ...withDefinedNumber(
                'semanticLimit',
                parseInteger(advancedOptions.semanticMemoryLimit)
            ),
            ...withDefinedNumber(
                'semanticThreshold',
                parseNumber(advancedOptions.semanticMemoryThreshold)
            ),
        }
    }

    const providerOptions: Record<string, unknown> = {
        ...withDefinedRecord(
            'openai',
            compactRecord({
                reasoningEffort:
                    advancedOptions.openaiReasoningEffort || undefined,
                textVerbosity:
                    advancedOptions.openaiTextVerbosity || undefined,
            })
        ),
        ...withDefinedRecord(
            'anthropic',
            advancedOptions.anthropicSendReasoning
                ? { sendReasoning: true }
                : undefined
        ),
        ...withDefinedRecord(
            'google',
            parseJsonObject(advancedOptions.googleThinkingConfigJson)
                ? {
                      thinkingConfig: parseJsonObject(
                          advancedOptions.googleThinkingConfigJson
                      ),
                  }
                : undefined
        ),
        ...withDefinedRecord(
            'xai',
            compactRecord({
                reasoningEffort:
                    advancedOptions.xaiReasoningEffort || undefined,
            })
        ),
        ...withDefinedRecord(
            'extraOptions',
            parseJsonObject(advancedOptions.extraProviderOptionsJson)
        ),
    }

    return (
        compactRecord({
        agentId: activeAgentId,
        memory: {
            userId,
            conversationId,
            options: memoryOptions,
        },
        context,
        temperature: parseNumber(advancedOptions.temperature),
        maxOutputTokens: parseInteger(advancedOptions.maxOutputTokens),
        maxSteps: parseInteger(advancedOptions.maxSteps),
        topP: parseNumber(advancedOptions.topP),
        topK: parseInteger(advancedOptions.topK),
        frequencyPenalty: parseNumber(advancedOptions.frequencyPenalty),
        presencePenalty: parseNumber(advancedOptions.presencePenalty),
        seed: parseInteger(advancedOptions.seed),
        stopSequences: parseStringArray(advancedOptions.stopSequences),
        maxRetries: parseInteger(advancedOptions.maxRetries),
        providerOptions:
            Object.keys(providerOptions).length > 0 ? providerOptions : undefined,
        }) ?? {}
    )
}

export function countActiveAdvancedChatOptions(
    options: AdvancedChatOptions
): number {
    let count = 0

    for (const [key, value] of Object.entries(options)) {
        const defaultValue =
            DEFAULT_ADVANCED_CHAT_OPTIONS[
                key as keyof AdvancedChatOptions
            ]

        if (value !== defaultValue) {
            if (typeof value === 'string' && value.trim().length === 0) {
                continue
            }

            count += 1
        }
    }

    return count
}

function parseNumber(value: string): number | undefined {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return undefined
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
}

function parseInteger(value: string): number | undefined {
    const parsed = parseNumber(value)
    return parsed !== undefined ? Math.trunc(parsed) : undefined
}

function parseStringArray(value: string): string[] | undefined {
    const items = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

    return items.length > 0 ? items : undefined
}

function parseJsonObject(value: string): Record<string, unknown> | undefined {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return undefined
    }

    try {
        const parsed = JSON.parse(trimmed) as unknown
        return isRecord(parsed) ? parsed : undefined
    } catch {
        return undefined
    }
}

function compactRecord(
    value: Record<string, unknown>
): Record<string, unknown> | undefined {
    const entries = Object.entries(value).filter(([, entryValue]) => {
        if (entryValue === undefined) {
            return false
        }

        if (Array.isArray(entryValue)) {
            return entryValue.length > 0
        }

        if (isRecord(entryValue)) {
            return Object.keys(entryValue).length > 0
        }

        return true
    })

    return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function withDefinedNumber(
    key: string,
    value: number | undefined
): Record<string, number> {
    return value !== undefined ? { [key]: value } : {}
}

function withDefinedRecord(
    key: string,
    value: Record<string, unknown> | undefined
): Record<string, Record<string, unknown>> {
    return value !== undefined ? { [key]: value } : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
