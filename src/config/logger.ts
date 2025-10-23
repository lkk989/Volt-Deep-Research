import { createPinoLogger } from "@voltagent/logger";

// UPGRADE: Now we have BOTH local tr
export const voltlogger = createPinoLogger({
    name: "Voltlogger",
    level: "trace",
    pinoOptions: {
    // Any Pino-specific option can go here
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
    },
    hooks: {
      logMethod(args, method) {
        // Custom hook logic
        method.apply(this, args);
      },
    },
  },
});
