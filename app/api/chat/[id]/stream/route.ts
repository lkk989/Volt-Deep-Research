import { getResumableStreamAdapter } from "@/lib/resumable-stream";
import { deepAgent } from "@/voltagent/agents/plan.agent";
import { voltlogger } from "@/voltagent/config/logger.js";
import { safeStringify } from "@voltagent/internal/utils";
import { createResumableChatSession } from "@voltagent/resumable-streams";

const jsonError = (status: number, message: string) =>
  new Response(safeStringify({ error: message, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return jsonError(400, "conversationId is required");
  }

  const userIdParam = new URL(request.url).searchParams.get("userId");
  if (userIdParam === null || userIdParam.trim().length === 0) {
    return jsonError(400, "userId is required");
  }
  const userId = userIdParam.trim();
  const agentId: string = deepAgent.id;
  const resumableStream = await getResumableStreamAdapter();
  const session = createResumableChatSession({
    adapter: resumableStream,
    conversationId: id,
    userId,
    agentId,
  });

  try {
    return await session.resumeResponse();
  } catch (error) {
    voltlogger.error("[API] Failed to resume stream", { error });
    return new Response(null, { status: 204 });
  }
}
