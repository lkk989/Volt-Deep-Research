import {
    BaseRetriever,
    type BaseMessage,
    type RetrieveOptions,
} from '@voltagent/core'
import { google } from '@ai-sdk/google'
import { embed } from 'ai'
import { sharedVectorAdapter } from '../config/libsql.js'
import { sampleRecords } from './sample-records.js'

type StaticDocument = {
    id: string
    title: string
    content: string
    source: string
    tags: string[]
}

const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'was',
    'with',
])

const synonymMap: Record<string, string[]> = {
    rag: ['retrieval', 'retriever', 'retrieval-augmented'],
    retriever: ['rag', 'search', 'knowledge'],
    embedding: ['embeddings', 'vector', 'semantic'],
    vectors: ['vector', 'embedding', 'embeddings'],
    guardrails: ['safety', 'policy', 'security'],
    agent: ['agents', 'assistant', 'planagent'],
    workflow: ['workflows', 'pipeline', 'orchestration'],
    memory: ['libsql', 'semantic', 'working-memory'],
}

const toStaticDocumentsFromSamples = (records: unknown[]): StaticDocument[] => {
    const docs: StaticDocument[] = []

    for (const item of records) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            continue
        }

        const record = item as Record<string, unknown>
        const rawId = record.id
        const payloadRaw = record.payload

        if (
            (typeof rawId !== 'string' && typeof rawId !== 'number') ||
            typeof payloadRaw !== 'object' ||
            payloadRaw === null ||
            Array.isArray(payloadRaw)
        ) {
            continue
        }

        const payload = payloadRaw as Record<string, unknown>
        const content = payload.text
        if (typeof content !== 'string' || content.trim().length === 0) {
            continue
        }

        const titleCandidate = payload.title
        const title =
            typeof titleCandidate === 'string' && titleCandidate.trim().length > 0
                ? titleCandidate
                : `Seed ${String(rawId)}`

        const sourceCandidate = payload.source
        const source =
            typeof sourceCandidate === 'string' && sourceCandidate.trim().length > 0
                ? sourceCandidate
                : 'seed://mastervolt/retrieval/shared-corpus'

        const tagsRaw = payload.tags
        const tags = Array.isArray(tagsRaw)
            ? tagsRaw.filter((tag): tag is string => typeof tag === 'string')
            : []

        docs.push({
            id: String(rawId),
            title,
            content,
            source,
            tags,
        })
    }

    return docs
}

const defaultDocuments = toStaticDocumentsFromSamples(sampleRecords)

const tokenize = (text: string): string[] =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1 && !stopWords.has(token))

const toSearchText = (input: string | BaseMessage[]): string => {
    if (typeof input === 'string') {
        return input
    }

    if (!Array.isArray(input) || input.length === 0) {
        return ''
    }

    const lastMessage = input[input.length - 1]
    const {content} = lastMessage

    if (typeof content === 'string') {
        return content
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'object' && part && 'type' in part && part.type === 'text' && 'text' in part) {
                    const maybeText = (part as { text?: unknown }).text
                    return typeof maybeText === 'string' ? maybeText : ''
                }
                return ''
            })
            .filter(Boolean)
            .join(' ')
    }

    return ''
}

const EMBEDDING_MODEL = 'gemini-embedding-001' as const

class SimpleRetriever extends BaseRetriever {
    private documents: StaticDocument[]

    constructor(docs: StaticDocument[]) {
        super({
            toolName: 'search_based_retriever',
            toolDescription:
                'Searches the baseline Mastervolt knowledge corpus for architecture, retrieval, memory, and operations guidance.',
        })
        this.documents = docs
    }

    addDocuments(newDocuments: StaticDocument[]): void {
        this.documents = [...this.documents, ...newDocuments]
    }

    replaceDocuments(newDocuments: StaticDocument[]): void {
        this.documents = [...newDocuments]
    }

    private expandTerms(terms: string[]): string[] {
        const expanded = new Set<string>()
        for (const term of terms) {
            expanded.add(term)
            const synonyms = synonymMap[term]
            if (synonyms) {
                for (const synonym of synonyms) {
                    expanded.add(synonym)
                }
            }
        }
        return Array.from(expanded)
    }

    private scoreDocuments(searchText: string): Array<{ doc: StaticDocument; score: number; matches: string[] }> {
        const rawTerms = tokenize(searchText)
        const terms = this.expandTerms(rawTerms)

        if (terms.length === 0) {
            return []
        }

        const docFrequencies = new Map<string, number>()
        const indexedDocs = this.documents.map((doc) => {
            const bag = tokenize(`${doc.title} ${doc.content} ${doc.tags.join(' ')}`)
            const unique = new Set(bag)
            for (const term of unique) {
                docFrequencies.set(term, (docFrequencies.get(term) ?? 0) + 1)
            }
            return { doc, bag }
        })

        const totalDocs = Math.max(1, this.documents.length)

        return indexedDocs
            .map(({ doc, bag }) => {
                const termCounts = new Map<string, number>()
                for (const token of bag) {
                    termCounts.set(token, (termCounts.get(token) ?? 0) + 1)
                }

                let score = 0
                const matches: string[] = []

                for (const term of terms) {
                    const tf = termCounts.get(term) ?? 0
                    if (tf === 0) {
                        continue
                    }

                    const df = docFrequencies.get(term) ?? 1
                    const idf = Math.log(1 + totalDocs / df)
                    score += tf * idf
                    matches.push(term)
                }

                const lowerQuery = searchText.toLowerCase()
                if (doc.title.toLowerCase().includes(lowerQuery)) {
                    score += 2.0
                }

                return {
                    doc,
                    score,
                    matches: Array.from(new Set(matches)),
                }
            })
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score)
    }

    private async retrieveFromLibSqlVector(searchText: string) {
        const { embedding } = await embed({
            model: google.embedding(EMBEDDING_MODEL),
            value: searchText,
        })

        const hits = await sharedVectorAdapter.search(embedding, {
            limit: 5,
        })

        return hits
            .filter((hit) => {
                const hasContent =
                    typeof hit.content === 'string' && hit.content.trim().length > 0
                const metadataContent =
                    typeof hit.metadata?.content === 'string' &&
                    hit.metadata.content.trim().length > 0
                return hasContent || metadataContent
            })
            .map((hit, index) => {
                const content =
                    typeof hit.content === 'string' && hit.content.trim().length > 0
                        ? hit.content
                        : typeof hit.metadata?.content === 'string'
                          ? hit.metadata.content
                          : ''

                const title =
                    typeof hit.metadata?.title === 'string' &&
                    hit.metadata.title.trim().length > 0
                        ? hit.metadata.title
                        : `Vector Document ${index + 1}`

                const source =
                    typeof hit.metadata?.source === 'string' &&
                    hit.metadata.source.trim().length > 0
                        ? hit.metadata.source
                        : 'libsql://shared-vector'

                return {
                    id: hit.id,
                    title,
                    source,
                    content,
                    score: hit.score,
                    metadata: hit.metadata ?? {},
                }
            })
    }

    async retrieve(
        input: string | BaseMessage[],
        options: RetrieveOptions
    ): Promise<string> {
        const searchText = toSearchText(input).trim()

        if (searchText.length === 0) {
            return 'No query text was provided for retrieval.'
        }

        const vectorResults = await this.retrieveFromLibSqlVector(searchText)

        if (vectorResults.length > 0) {
            if (options.context) {
                options.context.set(
                    'references',
                    vectorResults.map((doc) => ({
                        id: doc.id,
                        title: doc.title,
                        source: doc.source,
                        score: doc.score,
                    }))
                )
            }

            return vectorResults
                .map(
                    (doc, index) =>
                        `Result ${index + 1}: ${doc.title}\nSource: ${doc.source}\nScore: ${doc.score.toFixed(3)}\nContent: ${doc.content}`
                )
                .join('\n\n---\n\n')
        }

        const ranked = this.scoreDocuments(searchText).slice(0, 5)

        if (ranked.length === 0) {
            return 'No relevant documents found.'
        }

        if (options.context) {
            options.context.set(
                'references',
                ranked.map(({ doc, score, matches }) => ({
                    id: doc.id,
                    title: doc.title,
                    source: doc.source,
                    score,
                    matches,
                }))
            )
        }

        return ranked
            .map(
                ({ doc, score, matches }, index) =>
                    `Result ${index + 1}: ${doc.title}\nSource: ${doc.source}\nScore: ${score.toFixed(3)}\nMatched Terms: ${matches.join(', ')}\nContent: ${doc.content}`
            )
            .join('\n\n---\n\n')
    }
}

export const basedRetriever = new SimpleRetriever(defaultDocuments)
export const BasedRetriever = basedRetriever
