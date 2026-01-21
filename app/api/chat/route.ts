import { getResumableStreamAdapter } from "@/lib/resumable-stream";
import { deepAgent } from "@/voltagent/agents/plan.agent";
import { voltlogger } from "@/voltagent/config/logger.js";
import { setWaitUntil } from "@voltagent/core";
import { safeStringify } from "@voltagent/internal/utils";
import { createResumableChatSession } from "@voltagent/resumable-streams";
import type { UIMessage } from "ai";
import { after } from "next/server";

const jsonError = (status: number, message: string) =>
  new Response(safeStringify({ error: message, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const messages = Array.isArray(body.messages) ? (body.messages as UIMessage[]) : [];
    const message = body.message as UIMessage | string | undefined;
    const input = body.input as UIMessage[] | string | undefined;
    const options = (isRecord(body.options)) ? body.options : undefined;
    const conversationIdParam = getString(options, "conversationId");
    const userIdParam = getString(options, "userId");
    const conversationId = conversationIdParam.trim();
    const userId = userIdParam.trim();
    const parsedInput = resolveInput(input, message, messages);

    if (conversationId.length === 0) {
      return jsonError(400, "options.conversationId is required");
    }

    if (userId.length === 0) {
      return jsonError(400, "options.userId is required");
    }

    if (isEmptyInput(parsedInput)) {
      return jsonError(400, "Message input is required");
    }

    // Enable non-blocking OTel export for Vercel/serverless
    // This ensures spans are flushed in the background without blocking the response
    setWaitUntil(after);

    const agentId = deepAgent.id;
    const resumableStream = await getResumableStreamAdapter();
    const session = createResumableChatSession({
      adapter: resumableStream,
      conversationId,
      userId,
      agentId,
    });

    try {
      await session.clearActiveStream();
    } catch (error) {
      voltlogger.error("[API] Failed to clear active resumable stream", { error });
    }

    // Stream text from the supervisor agent with proper context
    // The agent accepts UIMessage[] directly
    const result = await deepAgent.streamText(parsedInput, {
      userId,
      conversationId,
    });

    return result.toUIMessageStreamResponse({
      consumeSseStream: session.consumeSseStream,
      onFinish: session.onFinish,
    });
  } catch (error) {
    console.error("[API] Chat error:", error);
    return jsonError(500, "Internal server error");
  }
}

function isEmptyInput(input: unknown) {
  if (input === null) {
    return true;
  }

  if (typeof input === "string") {
    return input.trim().length === 0;
  }

  return Array.isArray(input) && input.length === 0;
}
