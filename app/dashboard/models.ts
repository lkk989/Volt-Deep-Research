/**
 * AI Model Configuration - Latest Models (Jan 2026)
 *
 * Sourced from official provider documentation and announcements
 * Google Gemini 3 Series (Nov 2025)
 * Anthropic Claude Opus 4.5 (Nov 2025)
 */

export interface ModelConfig {
    id: string
    name: string
    provider: string
    capabilities: readonly string[]
    contextWindow: number
    maxOutputTokens: number
    pricing?: {
        inputPerMillion: number
        outputPerMillion: number
    }
}

export type ModelId = string

// ============================================================
// GOOGLE GEMINI MODELS (Nov 2025 - Gemini 3 Series)
// ============================================================
export const GOOGLE_MODELS: Record<string, ModelConfig> = {
    // Gemini 3 Series - NEWEST (Nov 2025)
    'google/gemini-3-pro': {
        id: 'google/gemini-3-pro',
        name: 'Gemini 3 Pro',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 2000000,
        maxOutputTokens: 64000,
        // Pricing TBD - check AI Studio
    },
    'google/gemini-3-flash': {
        id: 'google/gemini-3-flash',
        name: 'Gemini 3 Flash',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 1000000,
        maxOutputTokens: 64000,
    },
    'google/gemini-3-pro-thinking': {
        id: 'google/gemini-3-pro-thinking',
        name: 'Gemini 3 Pro Thinking',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 2000000,
        maxOutputTokens: 128000,
    },
    // Gemini 2.5 Series (Previous generation)
    'google/gemini-2-5-pro': {
        id: 'google/gemini-2-5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 2000000,
        maxOutputTokens: 64000,
        pricing: { inputPerMillion: 1.25, outputPerMillion: 10 },
    },
    'google/gemini-2-5-flash-lite': {
        id: 'google/gemini-2-5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 1000000,
        maxOutputTokens: 64000,
        pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 },
    },
    'google/gemini-2-5-flash': {
        id: 'google/gemini-2-5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 1000000,
        maxOutputTokens: 64000,
        pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    },
    // Gemini 1.5 Series
    'google/gemini-1-5-pro': {
        id: 'google/gemini-1-5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 2000000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 1.25, outputPerMillion: 5 },
    },
    'google/gemini-1-5-flash': {
        id: 'google/gemini-1-5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 },
    },
}

// ============================================================
// ANTHROPIC CLAUDE MODELS (Nov 2025 - Claude 4.5 Series)
// ============================================================
export const ANTHROPIC_MODELS: Record<string, ModelConfig> = {
    // Claude 4.5 Series - NEWEST (Nov 2025)
    'anthropic/claude-opus-4-5-20251101': {
        id: 'anthropic/claude-opus-4-5-20251101',
        name: 'Claude Opus 4.5',
        provider: 'anthropic',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 5, outputPerMillion: 25 },
    },
    'anthropic/claude-sonnet-4-5-20251101': {
        id: 'anthropic/claude-sonnet-4-5-20251101',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 1.5, outputPerMillion: 7.5 },
    },
    'anthropic/claude-haiku-4-5-20251101': {
        id: 'anthropic/claude-haiku-4-5-20251101',
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        capabilities: ['text', 'code', 'streaming'],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 0.25, outputPerMillion: 1.25 },
    },
    // Claude 4 Series (Legacy)
    'anthropic/claude-opus-4-20250514': {
        id: 'anthropic/claude-opus-4-20250514',
        name: 'Claude Opus 4',
        provider: 'anthropic',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 15, outputPerMillion: 75 },
    },
    'anthropic/claude-sonnet-4-20250514': {
        id: 'anthropic/claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { inputPerMillion: 3, outputPerMillion: 15 },
    },
}

// ============================================================
// OPENAI MODELS
// ============================================================
export const OPENAI_MODELS: Record<string, ModelConfig> = {
    'openai/gpt-4o': {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { inputPerMillion: 2.5, outputPerMillion: 10 },
    },
    'openai/gpt-4o-mini': {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        capabilities: [
            'text',
            'code',
            'streaming',
            'tools',
            'structured-output',
        ],
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    },
    'openai/gpt-4-turbo': {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        capabilities: [
            'text',
            'reasoning',
            'code',
            'vision',
            'streaming',
            'tools',
        ],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPerMillion: 10, outputPerMillion: 30 },
    },
}

// ============================================================
// DEEPSEEK MODELS
// ============================================================
export const DEEPSEEK_MODELS: Record<string, ModelConfig> = {
    'deepseek/deepseek-chat': {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek Chat (V3)',
        provider: 'deepseek',
        capabilities: ['text', 'code', 'reasoning', 'streaming', 'tools'],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPerMillion: 0.14, outputPerMillion: 0.28 },
    },
    'deepseek/deepseek-reasoner': {
        id: 'deepseek/deepseek-reasoner',
        name: 'DeepSeek Reasoner (R1)',
        provider: 'deepseek',
        capabilities: ['text', 'reasoning', 'streaming'],
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { inputPerMillion: 0.55, outputPerMillion: 2.19 },
    },
}

// ============================================================
// GITHUB COPILOT MODELS (from voltagent/agents)
// ============================================================
export const GITHUB_COPILOT_MODELS: Record<string, ModelConfig> = {
    'github-copilot/gpt-5-mini': {
        id: 'github-copilot/gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'github-copilot',
        capabilities: ['text', 'reasoning', 'code', 'streaming', 'tools'],
        contextWindow: 128000,
        maxOutputTokens: 16384,
    },
    'github-copilot/grok-code-fast-1': {
        id: 'github-copilot/grok-code-fast-1',
        name: 'Grok Code Fast',
        provider: 'github-copilot',
        capabilities: ['text', 'code', 'streaming'],
        contextWindow: 131072,
        maxOutputTokens: 65536,
    },
}

// ============================================================
// COMPLETE MODEL CATALOG
// ============================================================
export const MODELS: Record<string, ModelConfig> = {
    ...GOOGLE_MODELS,
    ...ANTHROPIC_MODELS,
    ...OPENAI_MODELS,
    ...DEEPSEEK_MODELS,
    ...GITHUB_COPILOT_MODELS,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getModelById(id: string): ModelConfig | undefined {
    return MODELS[id]
}

export function getModelsByProvider(provider: string): ModelConfig[] {
    return Object.values(MODELS).filter((m) => m.provider === provider)
}

export function getModelsGroupedByProvider(): Record<string, ModelConfig[]> {
    const grouped: Record<string, ModelConfig[]> = {}
    for (const model of Object.values(MODELS)) {
        if (!grouped[model.provider]) {
            grouped[model.provider] = []
        }
        grouped[model.provider].push(model)
    }
    return grouped
}

export const PROVIDER_NAMES: Record<string, string> = {
    google: 'Google',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    deepseek: 'DeepSeek',
    'github-copilot': 'GitHub Copilot',
    groq: 'Groq',
    mistral: 'Mistral',
    xai: 'xAI',
}

// Default model for research (Gemini 3 Pro - latest and most capable)
export const DEFAULT_RESEARCH_MODEL = GOOGLE_MODELS['google/gemini-3-pro']

// Default model for cost-effective research
export const DEFAULT_FAST_MODEL = GOOGLE_MODELS['google/gemini-3-flash']

// Default for coding/agents
export const DEFAULT_CODING_MODEL =
    ANTHROPIC_MODELS['anthropic/claude-opus-4-5-20251101']

// Get all reasoning-capable models
export function getReasoningModels(): ModelConfig[] {
    return Object.values(MODELS).filter((m) =>
        m.capabilities.includes('reasoning')
    )
}

// Get all coding-capable models
export function getCodingModels(): ModelConfig[] {
    return Object.values(MODELS).filter((m) => m.capabilities.includes('code'))
}
