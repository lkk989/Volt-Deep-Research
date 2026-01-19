import { createPinoLogger } from "@voltagent/logger";

// UPGRADE: Now we have BOTH local tr
export const voltlogger = createPinoLogger({
    name: "Voltlogger",
    level: "trace",
    pretty: true,
    bufferSize: 1500,
    pinoOptions: {
    // Any Pino-specific option can go here
  },
});
