import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli'
import os from 'os'

const useApiKey =
    (process.env.GOOGLE_GENERATIVE_AI_API_KEY !== undefined) ||
    process.env.NODE_ENV === 'production'
const gemini = createGeminiProvider({
    authType: useApiKey ? 'api-key' : 'oauth-personal', // Use OAuth in dev, production use API key
    apiKey: useApiKey ? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' : undefined, // Provide API key if using API key auth
    cacheDir: process.env.GEMINI_OAUTH_CACHE ?? os.homedir() + '/.gemini/oauth-cache', // directory to store cached tokens
})

export const geminiAI = gemini('gemini-2.5-pro', {
    contextWindow: 1048576, // 1MB
    maxTokens: 65536,
    supportsStreaming: true,
    thinkingBudget: -1,
    showThoughts: true,
    codeexecution: true,
    structuredOutput: true,
    functionCalling: true,
    urlContext: true
});
export const geminiAIFlash = gemini('gemini-2.5-flash', {
    contextWindow: 1048576, // 1MB
    maxTokens: 65536,
    supportsStreaming: true,
    thinkingBudget: -1,
    codeexecution: true,
    showThoughts: true,
    structuredOutput: true,
    grounding: true,
    functionCalling: true,
    urlContext: true
});
export const geminiAIFlashLite = gemini('gemini-2.5-flash-lite', {
    contextWindow: 1048576, // 1MB
    maxTokens: 64000,
    supportsStreaming: true,
    thinkingBudget: -1,
    showThoughts: true,
    //codeexecution: true,
    structuredOutput: true,
    grounding: true,
    //functionCalling: true,
    urlContext: true
})

export const geminiAIFlashimg = gemini('gemini-2.5-flash-image-preview', {
    maxTokens: 8192,
    supportsStreaming: true,
})

export const geminiAIv = gemini(
    'gemini-2.5-flash-preview-native-audio-dialog',
    {
        maxTokens: 8192,
        supportsStreaming: true,
})

export const geminiAIv2 = gemini('gemini-2.5-flash-preview-tts', {
    maxTokens: 8192,
    supportsStreaming: true,
})

export const geminiAIv3 = gemini(
    'gemini-2.5-flash-exp-native-audio-thinking-dialog',
    {
        maxTokens: 8192,
        supportsStreaming: true,
})
