import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";
import { CloudClient, type QueryRowResult, type Metadata } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import type { TextPart } from "@ai-sdk/provider-utils";
import { voltlogger } from "../config/logger.js";

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


async function initializeCollection() {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction,
    });

    // Sample documents about your domain
    const sampleDocuments = [
      "VoltAgent is a TypeScript framework for building AI agents with modular components.",
      "Chroma is an AI-native open-source vector database that handles embeddings automatically.",
      "Vector databases store high-dimensional vectors and enable semantic search capabilities.",
      "Retrieval-Augmented Generation (RAG) combines information retrieval with language generation.",
      "TypeScript provides static typing for JavaScript, making code more reliable and maintainable.",
    ];

    const sampleIds = sampleDocuments.map((_, index) => `sample_${index + 1}`);

    // Use upsert to avoid duplicates
    await collection.upsert({
      documents: sampleDocuments,
      ids: sampleIds,
      metadatas: sampleDocuments.map((_, index) => ({
        type: "sample",
        index: index + 1,
        topic: index < 2 ? "frameworks" : index < 4 ? "databases" : "programming",
      })),
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

    // Perform semantic search
    const results = await retrieveDocuments(searchText, 3);

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

export const retriever = new ChromaRetriever();
