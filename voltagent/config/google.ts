import { createGoogleGenerativeAI } from '@ai-sdk/google'


export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})
export const GOOGLE_FLASH_LITE_MODEL_ID = 'gemini-3.1-flash-lite-preview'
export const GOOGLE_EMBEDDING_MODEL_ID = 'gemini-embedding-2-preview'
// Gemini 2.5 Flash model for general-purpose applications
/*
 * googleAI: Main Gemini 2.5 Flash model for general-purpose applications
    * When to use: This model is suitable for a wide range of tasks including text generation, reasoning, and vision-related applications. It offers a good balance between performance and cost, making it ideal for most standard use cases.
    * Why use: Choose this model when you need reliable performance for diverse applications without the higher costs associated with premium models.
 */
export const googleAI = google('gemini-2.5-flash-preview-09-2025')
// Gemini 2.5 Pro model for higher-performance applications
/*
 * googleAIPro: Gemini 2.5 Pro model for higher-performance applications
    * When to use: This model is designed for applications that require enhanced reasoning capabilities, more complex text generation, and advanced vision tasks. It is ideal for scenarios where quality and depth of response are critical.
    * Why use: Opt for this model when your application demands superior performance and can benefit from the advanced features it offers, despite the higher associated costs.
 */
export const googleAIPro = google('gemini-2.5-pro')
// Gemini 3.1 Flash Lite Preview model for fast, low-cost multimodal workflows
/*
 * googleAIFlashLite: Gemini 3.1 Flash Lite Preview model for fast, low-cost applications
    * When to use: This model is suitable for large-context, multimodal reasoning and tool-using workflows that need low latency and low cost.
    * Why use: Select this model when you want the latest Flash Lite capabilities, including structured outputs, search grounding, and strong tool calling support.
 */
export const googleAIFlashLite = google(GOOGLE_FLASH_LITE_MODEL_ID)
// Gemini Embedding 2 Preview model for generating text embeddings
/*
 * googleAIEmbedding: Gemini Embedding 2 Preview model for generating text embeddings
    * When to use: This model is ideal for tasks that require higher-quality embeddings across semantic search, clustering, and retrieval workflows.
    * Why use: Utilize this model when you are ready to re-embed your vector data and want the latest embedding space and flexible dimensions.
 */
export const googleAIEmbedding = google.embedding(GOOGLE_EMBEDDING_MODEL_ID)
// Gemini Computer Use model for tasks requiring higher accuracy and reliability
/*
 * googleAIComputerUse: Gemini Computer Use model for tasks requiring higher accuracy and reliability
    * When to use: This model is tailored for applications that demand precise and dependable outputs, such as critical decision-making systems, technical content generation, and scenarios where accuracy is paramount.
    * Why use: Choose this model when the quality and reliability of the generated content are crucial to your application's success, even if it comes with increased computational costs.
 */
export const googleAIComputerUse = google('gemini-2.5-computer-use-preview-10-2025')
// Gemini Nano Banana model for low-cost image generation
/*
 * googleAINanoBanana: Gemini Nano Banana model for low-cost image generation
    * When to use: This model is optimized for generating images at a lower cost, making it suitable for applications where budget constraints are a priority, and high-resolution images are not essential.
    * Why use: Opt for this model when you need to produce images affordably, especially for applications like social media content, basic visualizations, or scenarios where image quality can be compromised for cost savings.
 */
export const googleAINanoBanana = google('gemini-2.5-flash-image')
