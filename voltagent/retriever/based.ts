// retriever/index.ts
import { type BaseMessage, BaseRetriever, type RetrieveOptions } from "@voltagent/core";

// Your document data
const documents = [
  { title: "Getting Started", content: "VoltAgent is framework in typescript to build AI Agents, its built upon AI-SDK", source: "docs" },
  { title: "API Reference", content: "The Agent class...", source: "api" },
  { title: "Examples", content: "Here are some examples, including how to use the retriever\nText-based retrieval is a simple method where the retriever searches for relevant documents based on keywords or phrases in the input. This can be useful for quickly finding information without needing complex embeddings or vector search.", source: "examples" },
];

class SimpleRetriever extends BaseRetriever {
  private documents: typeof documents;

  constructor(docs: typeof documents) {
    super({});
    this.documents = docs;
  }

  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    // Convert input to searchable string
    let searchText = "";

    if (typeof input === "string") {
      searchText = input;
    } else if (Array.isArray(input) && input.length > 0) {
      const lastMessage = input[input.length - 1];
      searchText = typeof lastMessage.content === "string" ? lastMessage.content : "";
    }

    // Simple keyword-based search
    const searchTerms = searchText.toLowerCase().split(/\s+/);
    const matchedDocs = this.documents.filter((doc) => {
      const content = doc.content.toLowerCase();
      return searchTerms.some((term) => content.includes(term));
    });

    if (matchedDocs.length === 0) {
      return "No relevant documents found.";
    }

    return matchedDocs.map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`).join("\n\n");
  }
}

export const BasedRetriever = new SimpleRetriever(documents);
