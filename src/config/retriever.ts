import type VoltAgent from "@voltagent/core";
import type { RetrieveOptions } from "@voltagent/core";
import { BaseRetriever } from "@voltagent/core";
import fs from "fs";
import path from "path";

class FileRetriever extends BaseRetriever {
  docsPath: string;
  constructor(docsPath = "./docs") {
    super({
      toolName: "search_files",
      toolDescription: "Search through local documentation files",
    });
    this.docsPath = docsPath;
  }

  async retrieve(input: string | VoltAgent[], options: RetrieveOptions): Promise<string> {
    let query: string;
    if (typeof input === "string") {
      query = input;
    } else {
      // input is VoltAgent[]
      const agents = input;
      const lastAgent = agents[agents.length - 1];
      // Extract query from agent's purpose or name
      query = lastAgent.purpose || lastAgent.name || "default query";
    }

    // Read all .md files
    const files = fs.readdirSync(this.docsPath).filter((file) => file.endsWith(".md"));

    const results = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(this.docsPath, file), "utf8");
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push(`File: ${file}\n${content.slice(0, 500)}...`);
      }
    }

    return results.length > 0 ? results.join("\n\n---\n\n") : "No relevant files found.";
  }
}
