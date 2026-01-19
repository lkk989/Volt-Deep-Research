import { QdrantClient } from '@qdrant/js-client-rest'
import {
  BaseRetriever,
  type BaseMessage,
  type RetrieveOptions,
} from '@voltagent/core'
import { embed } from 'ai'
import { googleAIEmbedding } from '../config/google.js'
import { voltlogger } from '../config/logger.js'
import { sampleRecords } from './sample-records.js'; // Assuming this exists or I'll check

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
})

const collectionName = 'voltagent-knowledge-base'

async function initializeCollection(): Promise<void> {
  try {
    // Check if collection exists
    let exists = false
    try {
      await qdrant.getCollection(collectionName)
      exists = true
      voltlogger.info(`📋 Collection "${collectionName}" already exists`)
    } catch (err: unknown) {
      // Log reason for creating collection (if available) but continue
      const errInfo =
        err instanceof Error ? { message: err.message, stack: err.stack } : { error: String(err) }
      voltlogger.info(`📋 Creating new collection "${collectionName}"...`, errInfo)
    }

    // Create collection if it doesn't exist
    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' }, // Updated for Google Gemini (768)
      })
      voltlogger.info(`✅ Collection "${collectionName}" created successfully`)
    }

    // Check if we need to populate with sample data
    const stats = (await qdrant.count(collectionName)) as { count?: number } | undefined
    const currentCount = typeof stats?.count === 'number' ? stats.count : 0

    if (currentCount === 0) {
      voltlogger.info('📚 Populating collection with sample documents...')

      if (!Array.isArray(sampleRecords) || sampleRecords.length === 0) {
        voltlogger.warn('No sample records available to populate the collection')
      } else {
        type PointPayload = Record<string, unknown>
        interface UpsertPoint {
          id: string | number
          vector: number[]
          payload: PointPayload
        }

        // Treat incoming sample records as unknown[] to avoid implicit any
        const records: unknown[] = sampleRecords as unknown[]
        const points: UpsertPoint[] = []

        for (const rawRecord of records) {
          // Ensure the record has the expected shape before accessing properties
          if (typeof rawRecord !== 'object' || rawRecord === null || Array.isArray(rawRecord)) {
            voltlogger.warn('Skipping invalid sample record (not an object)', { record: rawRecord })
            continue
          }

          const record = rawRecord as Record<string, unknown>

          const idCandidate = record['id']
          if (typeof idCandidate !== 'string' && typeof idCandidate !== 'number') {
            voltlogger.warn('Skipping sample record with missing or invalid id', { record })
            continue
          }
          const recordId = idCandidate

          const payloadCandidate = record['payload']
          if (typeof payloadCandidate !== 'object' || payloadCandidate === null || Array.isArray(payloadCandidate)) {
            voltlogger.warn(`Skipping ${String(recordId)}: payload is missing or invalid`)
            continue
          }
          const payload = payloadCandidate as Record<string, unknown>

          const textCandidate = payload['text']
          if (typeof textCandidate !== 'string') {
            voltlogger.warn(`Skipping ${String(recordId)}: payload.text missing or not a string`)
            continue
          }
          const text = textCandidate.trim()
          if (text === '') {
            voltlogger.warn(`Skipping ${String(recordId)}: payload.text missing or not a string`)
            continue
          }

          try {
            const embedResult = (await embed({
              model: googleAIEmbedding,
              value: text,
            })) as unknown

            // Safely extract embedding
            let embeddingCandidate: unknown = undefined
            if (typeof embedResult === 'object' && embedResult !== null && 'embedding' in embedResult) {
              embeddingCandidate = (embedResult as Record<string, unknown>)['embedding']
            }

            if (
              !Array.isArray(embeddingCandidate) ||
              embeddingCandidate.length === 0 ||
              !embeddingCandidate.every((n: unknown) => typeof n === 'number')
            ) {
              voltlogger.warn(`Skipped ${String(recordId)}: received invalid embedding`)
              continue
            }

            points.push({
              id: recordId,
              vector: embeddingCandidate,
              payload,
            })
          } catch (err: unknown) {
            const errInfo =
              err instanceof Error ? { message: err.message, stack: err.stack } : { error: String(err) }
            voltlogger.error(`Error generating embedding for ${String(recordId)}:`, errInfo)
          }
        }

        if (points.length > 0) {
          try {
            await qdrant.upsert(collectionName, { points })
            voltlogger.info(`✅ Successfully upserted ${points.length} documents to collection`)
          } catch (err: unknown) {
            const errInfo =
              err instanceof Error ? { message: err.message, stack: err.stack } : { error: String(err) }
            voltlogger.error('Error upserting documents to Qdrant:', errInfo)
          }
        } else {
          voltlogger.warn('No valid documents to upsert to the collection')
        }
      }
    } else {
      voltlogger.info(`📊 Collection already contains ${currentCount} documents`)
    }
  } catch (err: unknown) {
    const errInfo = err instanceof Error ? { message: err.message, stack: err.stack } : { error: String(err) }
    voltlogger.error('Error initializing Qdrant collection:', errInfo)
  }
}

// Initialize collection at startup (non-blocking)
initializeCollection().catch((e: unknown) => {
  const errInfo = e instanceof Error ? { message: e.message, stack: e.stack } : { error: String(e) }
  voltlogger.error('Failed to initialize Qdrant collection at startup:', errInfo)
})

// Retriever function
async function retrieveDocuments(
  query: string,
  topK = 3
): Promise<Array<{ content: string; metadata: Record<string, unknown>; score: number; id: string | number }>> {
  try {
    if (!query || typeof query !== 'string') {
      voltlogger.warn('retrieveDocuments called with empty or invalid query')
      return []
    }

    const limit = typeof topK === 'number' && topK > 0 ? Math.floor(topK) : 3

    // Generate embedding for the query using Google Gemini (be defensive about the return shape)
    let embeddingCandidate: number[] | undefined
    try {
      const embedResult: unknown = await embed({
        model: googleAIEmbedding,
        value: query,
      })

      // embed may return the embedding directly as number[] or as { embedding: number[] }
      if (Array.isArray(embedResult) && embedResult.every((n) => typeof n === 'number')) {
        embeddingCandidate = embedResult as number[]
      } else if (typeof embedResult === 'object' && embedResult !== null) {
        const maybeEmbedding = (embedResult as Record<string, unknown>)['embedding']
        if (Array.isArray(maybeEmbedding) && maybeEmbedding.every((n) => typeof n === 'number')) {
          embeddingCandidate = maybeEmbedding as number[]
        }
      }
    } catch (err: unknown) {
      const errInfo = err instanceof Error ? { message: err.message, stack: err.stack } : { error: String(err) }
      voltlogger.error('Error generating embedding for query:', errInfo)
      return []
    }

    if (!embeddingCandidate || embeddingCandidate.length === 0) {
      voltlogger.warn('Received invalid embedding for query')
      return []
    }

    // Perform search in Qdrant (defensive typing of the response)
    const rawResponse: unknown = await qdrant.query(collectionName, {
      query: embeddingCandidate,
      limit,
      with_payload: true,
    })

    // Normalize and validate the points array from the response
    const pointsRaw = (rawResponse && typeof rawResponse === 'object') ? (rawResponse as Record<string, unknown>)['points'] : undefined
    if (!Array.isArray(pointsRaw)) {
      voltlogger.debug('Qdrant returned unexpected search response shape', { response: rawResponse })
      return []
    }

    const results: Array<{ id: string | number; payload: Record<string, unknown>; score: number }> = []

    for (const rawPoint of pointsRaw) {
      if (!rawPoint || typeof rawPoint !== 'object') {
        voltlogger.debug('Skipping invalid point (not an object) in Qdrant results', { rawPoint })
        continue
      }

      const point = rawPoint as Record<string, unknown>

      const idValue = point['id']
      if (typeof idValue !== 'string' && typeof idValue !== 'number') {
        voltlogger.debug('Skipping point with invalid id in Qdrant results', { point })
        continue
      }

      const payloadValue = point['payload']
      const payload =
        typeof payloadValue === 'object' && payloadValue !== null && !Array.isArray(payloadValue)
          ? (payloadValue as Record<string, unknown>)
          : {}

      const scoreValue = point['score']
      const score = typeof scoreValue === 'number' ? scoreValue : 0

      results.push({
        id: idValue as string | number,
        payload,
        score,
      })
    }

    // Map to expected return shape
    return results.map((r) => {
      const textCandidate = r.payload['text']
      const content = typeof textCandidate === 'string' ? textCandidate : ''
      return {
        content,
        metadata: r.payload,
        score: r.score,
        id: r.id,
      }
    })
  } catch (e: unknown) {
    const errInfo = e instanceof Error ? { message: e.message, stack: e.stack } : { error: String(e) }
    voltlogger.error('Error retrieving documents from Qdrant:', errInfo)
    return []
  }
}

/**
 * Qdrant-based retriever implementation for VoltAgent
 */
export class QdrantRetriever extends BaseRetriever {
  /**
   * Retrieve documents from Qdrant based on semantic similarity
   * @param input - The input to use for retrieval (string or BaseMessage[])
   * @param options - Configuration and context for the retrieval
   * @returns Promise resolving to a formatted context string
   */
  async retrieve(
    input: string | BaseMessage[],
    options: RetrieveOptions
  ): Promise<string> {
    // Convert input to searchable string
    let searchText = ''
    if (typeof input === 'string') {
      searchText = input
    } else if (Array.isArray(input) && input.length > 0) {
      const lastMessage = input[input.length - 1]
      if (Array.isArray(lastMessage.content)) {
        const textParts = (lastMessage.content as unknown[])
          .filter((part): part is { type: 'text'; text: string } => {
            if (typeof part !== 'object' || part === null || Array.isArray(part)) return false
            const obj = part as Record<string, unknown>
            return obj['type'] === 'text' && typeof obj['text'] === 'string'
          })
          .map((part) => part.text)
        searchText = textParts.join(' ')
      } else {
        searchText = lastMessage.content as string
      }
    }
    // Perform semantic search using Qdrant
    const results = await retrieveDocuments(searchText, 3)
    // Add references to context if available
    if (options.context && results.length > 0) {
      const references = results.map((doc: any, index: number) => ({
        id: doc.id,
        title: Boolean(doc.metadata.topic) || `Document ${index + 1}`,
        source: 'Qdrant Knowledge Base',
        score: doc.score,
        category: doc.metadata.category,
      }))
      options.context.set('references', references)
    }
    // Return the concatenated content for the LLM
    if (results.length === 0) {
      return 'No relevant documents found in the knowledge base.'
    }
    return results
      .map(
        (doc: any, index: number) =>
          `Document ${index + 1} (ID: ${doc.id}, Score: ${doc.score.toFixed(4)}, Category: ${doc.metadata.category}):\n${doc.content}`
      )
      .join('\n\n---\n\n')
  }
}

// Create retriever instance
export const retriever = new QdrantRetriever()
