import type { TaskRecord, TaskStore } from "@voltagent/a2a-server";
import { SupabaseMemoryAdapter } from "@voltagent/supabase";

export class SupaTaskStore implements TaskStore {
  private adapter = new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  });

  async load({ agentId, taskId }: { agentId: string; taskId: string }): Promise<TaskRecord | null> {
    const raw = await (this.adapter as unknown as { get: (key: string) => Promise<string | null> }).get(`${agentId}::${taskId}`);
    return raw !== null && raw !== '' ? (JSON.parse(raw) as TaskRecord) : null;
  }

  async save({ agentId, data }: { agentId: string; data: TaskRecord }): Promise<void> {
    await (this.adapter as unknown as { set: (key: string, value: string) => Promise<void> }).set(`${agentId}::${data.id}`, JSON.stringify(data));
  }
}
