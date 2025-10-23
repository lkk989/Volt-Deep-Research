import { createTool } from "@voltagent/core";
import z from "zod";
import { voltlogger } from "../config/logger.js";

export const debugTool = createTool({
  name: "log_debug_info",
  description: "Logs debugging information",
  parameters: z.object({
    message: z.string().describe("Debug message to log"),
  }),
  execute: async (args, context) => {
    // Access operation metadata
    voltlogger.info(`Operation ID: ${context?.operationId}`);
    voltlogger.info(`User ID: ${context?.userId}`);
    voltlogger.info(`Conversation ID: ${context?.conversationId}`);

    // Access the original input
    voltlogger.info(`Original input: ${context?.input}`);

    // Access custom context values
    const customValue = context?.context.get("customKey");
    voltlogger.info(`Custom context value: ${customValue}`);
    // Check if operation is still active
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    return `Logged: ${args.message}`;
  },
});
