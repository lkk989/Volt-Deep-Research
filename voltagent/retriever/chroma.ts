import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";
import { CloudClient, type QueryRowResult, type Metadata } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import type { TextPart } from "@ai-sdk/provider-utils";
import { voltlogger } from "../config/logger.js";
import { sampleRecords } from "./sample-records.js";

interface ChromaIngestDocument {
  id?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface SeedRecord {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

// Initialize Chroma client - supports cloud
const chromaClient = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE
  });

// Configure embeddings
const embeddingFunction = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  modelName: "gemini-embedding-001", // Efficient and cost-effective
  taskType: "RETRIEVAL_QUERY"
});

const collectionName = "voltagent-knowledge-base";

function toChromaMetadata(input: Record<string, unknown> | undefined): Metadata {
  if (!input) {
    return {};
  }

  const metadata: Metadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      metadata[key] = value;
      continue;
    }

    if (value === null) {
      metadata[key] = "null";
      continue;
    }

    metadata[key] = JSON.stringify(value);
  }

  return metadata;
}

function createDocId(prefix: string, index: number): string {
  return `${prefix}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function upsertChromaDocuments(
  documents: ChromaIngestDocument[]
): Promise<{ count: number; ids: string[] }> {
  if (documents.length === 0) {
    return { count: 0, ids: [] };
  }

  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction,
  });

  const ids = documents.map((doc, index) => doc.id ?? createDocId("chroma", index));
  const serializedMetadata = documents.map((doc) => toChromaMetadata(doc.metadata));

  await collection.upsert({
    documents: documents.map((doc) => doc.content),
    ids,
    metadatas: serializedMetadata,
  });

  voltlogger.info("Upserted documents into Chroma retriever collection", {
    count: documents.length,
    collectionName,
  });

  return { count: documents.length, ids };
}


async function initializeCollection() {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction,
    });

    const seedRecords: SeedRecord[] = [];
    for (const item of sampleRecords) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        continue;
      }

      const record = item as Record<string, unknown>;
      const { id, payload: payloadRaw } = record;
      if (
        (typeof id !== "string" && typeof id !== "number") ||
        typeof payloadRaw !== "object" ||
        payloadRaw === null ||
        Array.isArray(payloadRaw)
      ) {
        continue;
      }

      const payload = payloadRaw as Record<string, unknown>;
      const { text } = payload;
      if (typeof text !== "string" || text.trim().length === 0) {
        continue;
      }

      seedRecords.push({
        id: String(id),
        text,
        metadata: {
          ...payload,
          source:
            typeof payload.source === "string" && payload.source.trim().length > 0
              ? payload.source
              : "seed://mastervolt/retrieval/shared-corpus",
        },
      });
    }

    if (seedRecords.length === 0) {
      voltlogger.warn("No valid sample records available for Chroma seed initialization");
      return;
    }

    // Use upsert to avoid duplicates
    await collection.upsert({
      documents: seedRecords.map((record) => record.text),
      ids: seedRecords.map((record) => record.id),
      metadatas: seedRecords.map((record) => toChromaMetadata(record.metadata)),
    });

    voltlogger.info("📚 Sample knowledge base initialized");
  } catch (error) {
    voltlogger.error("Error initializing collection:", { error });
  }
}

// Initialize when module loads
await initializeCollection();

async function retrieveDocuments(query: string, nResults = 3) {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction,
    });

    const results = await collection.query({
      queryTexts: [query],
      nResults,
    });

    // Use the new .rows() method for cleaner data access
    const rows = results.rows();

    if (!rows || rows.length === 0 || !rows[0]) {
      return [];
    }

    // Format results - rows[0] contains the actual row data
    return rows[0].map((row: QueryRowResult<Metadata>, index: number) => ({
      content: row.document ?? "",
      metadata: row.metadata ?? {},
      distance: results.distances?.[0]?.[index] ?? 0, // Distance still comes from the original results
      id: row.id,
    }));
  } catch (error) {
    voltlogger.error("Error retrieving documents:", { error });
    return [];
  }
}

export class ChromaRetriever extends BaseRetriever {
  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    // Convert input to searchable string
    let searchText = "";

    if (typeof input === "string") {
      searchText = input;
    } else if (Array.isArray(input) && input.length > 0) {
      const lastMessage = input[input.length - 1];

      // Handle different content formats
      if (Array.isArray(lastMessage.content)) {
        const textParts = lastMessage.content
          .filter((part): part is TextPart => part.type === "text")
          .map((part) => part.text);
        searchText = textParts.join(" ");
      } else {
        searchText = lastMessage.content;
      }
    }

    const normalizedSearchText = searchText.trim();
    if (normalizedSearchText.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }

    // Perform semantic search
    const results = await retrieveDocuments(normalizedSearchText, 3);

    // Add references to context for tracking
    if (options.context && results.length > 0) {
      const references = results.map((doc, index) => ({
        id: doc.id,
        title: doc.metadata.title ?? `Document ${index + 1}`,
        source: "Chroma Knowledge Base",
        distance: doc.distance,
      }));

      options.context.set("references", references);
    }

    // Format results for the LLM
    if (results.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }

    return results
      .map(
        (doc, index) =>
          `Document ${index + 1} (ID: ${doc.id}, Distance: ${doc.distance.toFixed(4)}):\n${doc.content}`
      )
      .join("\n\n---\n\n");
  }
}

export const chromaRetriever = new ChromaRetriever();
