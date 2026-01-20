
import { createPinoLogger } from "@voltagent/logger";

// UPGRADE: Now we have BOTH local tr
export const voltlogger = createPinoLogger({
    name: "Voltlogger",
    level: "trace",
    pretty: true,
    format: "pretty",
    bufferSize: 1500,
    pinoOptions: {
    // Any Pino-specific option can go here
    serializers: {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
