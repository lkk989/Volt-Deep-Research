import { VoltAgentObservability } from "@voltagent/core";
import { LibSQLObservabilityAdapter } from "@voltagent/libsql";
import { voltlogger } from "./logger.js";
import { createLangfuseSpanProcessor } from "@voltagent/langfuse-exporter";

export const voltObservability = new VoltAgentObservability({
  serviceName: "VoltMaster", // Optional service metadata
  serviceVersion: "0.1.5", // Optional service metadata
  instrumentationScopeName: "ai", // Optional instrumentation scope name
  logger: voltlogger, // Optional logger
  resourceAttributes: {
    "deployment.environment": "production", // Optional resource attributes
    "host.name": "volt-master-host",
  },
  spanFilters: {
    enabled: false, // Enable or disable span filtering
    instrumentationScopeNames: ["ai"],
    serviceNames: ["VoltMaster"],
  },
  storage: new LibSQLObservabilityAdapter({
      url: process.env.TURSO_URL ?? "file:./.voltagent/observability.db", // or ":memory:" for ephemeral
      authToken: process.env.TURSO_AUTH_TOKEN!,
      tablePrefix: 'voltmaster_observability',
      // url: "file:./.voltagent/observability.db",
      // Remote Turso example:
      // url: "libsql://<your-db>.turso.io",
      // authToken: process.env.TURSO_AUTH_TOKEN,
      maxSpansPerQuery: 1000, // Optional limit for spans per query
      debug: false, // Enable to log SQL queries
      logger: voltlogger,
    }),
  voltOpsSync: {
    // Sampling strategies: "always" | "never" | "ratio" | "parent"
    sampling: { strategy: "ratio", ratio: 0.7 },
    // Batching controls
    maxQueueSize: 4096,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 4000,
    exportTimeoutMillis: 30000,
  },
  spanProcessors: [
    createLangfuseSpanProcessor({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL, // Optional for self-hosted
    }),
  ],
});
