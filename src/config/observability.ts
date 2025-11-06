import { VoltAgentObservability } from "@voltagent/core";
import { LibSQLObservabilityAdapter } from "@voltagent/libsql";
import { voltlogger } from "./logger.js";


export const voltObservability = new VoltAgentObservability({
  serviceName: "VoltMaster", // Optional service metadata
  serviceVersion: "1.0.0", // Optional service metadata
  instrumentationScopeName: "ai", // Optional instrumentation scope name
  storage: new LibSQLObservabilityAdapter({
      url: "file:./.voltagent/observability.db", // or ":memory:" for ephemeral
      // Local file (default): creates ./.voltagent/observability.db if not present
      // url: "file:./.voltagent/observability.db",
      // Remote Turso example:
      // url: "libsql://<your-db>.turso.io",
      // authToken: process.env.TURSO_AUTH_TOKEN,
      debug: true, // Enable to log SQL queries
      logger: voltlogger,
    }),
  voltOpsSync: {
    // Sampling strategies: "always" | "never" | "ratio" | "parent"
    sampling: { strategy: "ratio", ratio: 0.5 },
    // Batching controls
    maxQueueSize: 4096,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 4000,
    exportTimeoutMillis: 30000,
  },
});
