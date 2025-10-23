import { createPinoLogger } from "@voltagent/logger";
// UPGRADE: Now we have BOTH local filesystem AND remote AI models!

export const voltlogger = createPinoLogger({
    name: "Voltlogger",
    level: "debug",
    prettyPrint: true,
});
