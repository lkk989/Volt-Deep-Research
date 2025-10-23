import { A2AServer } from "@voltagent/a2a-server";
import VoltAgent from "@voltagent/core";

export const a2aServer = new A2AServer({
  name: "support-agent",
  version: "0.1.0",
  description: "VoltAgent A2A example",
});

export const voltAgent = new VoltAgent({
  agents: { assistant },
  a2aServers: { a2aServer },
  server: honoServer({ port: 3141 }),
});

a2aServer.initialize({
  agentRegistry: voltAgent.agentRegistry,
  taskStore: redisTaskStore,
});
