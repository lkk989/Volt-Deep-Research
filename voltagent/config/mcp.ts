import { MCPConfiguration } from "@voltagent/core";
import path from "path";
import { voltlogger } from "./logger.js";

voltlogger.info("mcp Initializing");
// UPGRADE: Now we have BOTH local filesystem AND remote AI models!
export const mcp_Config = new MCPConfiguration({
  servers: {
    // Local filesystem access (from previous example)
    filesystem: {
      type: "stdio",
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        path.join(process.env.HOME || "", "Desktop"),
      ],
      cwd: process.env.HOME,
      // Optional: Request timeout in milliseconds (default: 30000)
      timeout: 60000,
    },
    // NEW: Remote Hugging Face AI models
    "hf-mcp-server": {
      url: "https://huggingface.co/mcp",
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`
        },
      },
      type: "http",
      // Optional: Request timeout in milliseconds (default: 30000)
      timeout: 60000,
    },
  },
});
