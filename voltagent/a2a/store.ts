import type { TaskRecord, TaskStore } from "@voltagent/a2a-server";
import { SupabaseMemoryAdapter } from "@voltagent/supabase";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";


export class LibTaskStore implements TaskStore {
  private adapter = new LibSQLMemoryAdapter({
    url: process.env.TURSO_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    tablePrefix: "voltagent_tasks",
    maxRetries: 3,
    retryDelayMs: 100,
  });

  async load({ agentId, taskId }: { agentId: string; taskId: string }): Promise<TaskRecord | null> {
    const raw = await (this.adapter as unknown as { get: (key: string) => Promise<string | null> }).get(`${agentId}::${taskId}`);
    return raw !== null && raw !== '' ? (JSON.parse(raw) as TaskRecord) : null;
  }

  async save({ agentId, data }: { agentId: string; data: TaskRecord }): Promise<void> {
    await (this.adapter as unknown as { set: (key: string, value: string) => Promise<void> }).set(`${agentId}::${data.id}`, JSON.stringify(data));
  }
}
