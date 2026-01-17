import { createPinoLogger } from "@voltagent/logger";

// UPGRADE: Now we have BOTH local tr
export const voltlogger = createPinoLogger({
    name: "Voltlogger",
    level: "trace",
    pinoOptions: {
    // Any Pino-specific option can go here
    transport: {
      targets: [
        // Console output with our default configuration
        {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-MM-dd HH:mm:ss.l o",
            ignore: "pid,hostname,env,component",
            messageFormat:
              "{msg}{if userId} | user={userId}{end}{if conversationId} | conv={conversationId}{end}{if executionId} | exec={executionId}{end}",
            errorLikeObjectKeys: ["err", "error", "exception"],
            errorProps: "",
            singleLine: true, // Set to false for debug/trace levels
            messageKey: "msg",
          },
        },
        // File output
        {
          target: "pino/file",
          options: {
            destination: "./app.log",
            mkdir: true, // Create directory if it doesn't exist
          },
        },
      ],
    },
    serializers: {
      req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
    },
    hooks: {
      logMethod(args, method) {
        // Custom hook logic
        method.apply(this, args);
      },
    },
  },
});
