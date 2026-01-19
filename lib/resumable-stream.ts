import type { ResumableStreamAdapter } from "@voltagent/core";
import {
  createResumableStreamAdapter,
  createResumableStreamRedisStore,
  createResumableStreamGenericStore,
  createResumableStreamMemoryStore,
  createMemoryResumableStreamActiveStore,
  resolveResumableStreamAdapter,
  resolveResumableStreamDeps,
  createResumableChatHandlers,
  createResumableChatSession,
} from "@voltagent/resumable-streams";
import { after } from "next/server";

let adapterPromise: Promise<ResumableStreamAdapter> | undefined;

export function getResumableStreamAdapter() {
  adapterPromise ??= (async () => {
      const streamStore = await createResumableStreamRedisStore({ waitUntil: after });
      return createResumableStreamAdapter({ streamStore });
    })();

  return adapterPromise;
}
export const resumableStreamAdapterPromise = getResumableStreamAdapter();
