import { createTool } from "@voltagent/core";
import z from "zod";
import { inspect } from "node:util";
import { voltlogger } from "../config/logger.js";

export const debugTool = createTool({
  name: "log_debug_info",
  description: "Logs debugging information",
  parameters: z.object({
    message: z.string().describe("Debug message to log"),
  }),
  execute: (args, context) => {
    // Access operation metadata
    voltlogger.info(`Operation ID: ${context?.operationId}`);
    voltlogger.info(`User ID: ${context?.userId}`);
    voltlogger.info(`Conversation ID: ${context?.conversationId}`);

    // Access the original input
    // Safely stringify the original input for logging
    const originalInput = (() => {
      try {
        const json = JSON.stringify(context?.input, null, 2);
        if (json !== null) {return json;}
        if (context?.input === null) {return "";}
        return inspect(context?.input, { depth: null });
      } catch {
        return inspect(context?.input, { depth: null });
      }
    })();
    voltlogger.info(`Original input: ${originalInput}`);

    // Access custom context values
    const customValue = context?.context?.get("customKey");
    voltlogger.info(`Custom context value: ${String(customValue)}`);
    // Check if operation is still active
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    return `Logged: ${args.message}`;
  },
});
