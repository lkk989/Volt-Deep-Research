import { A2AServer } from "@voltagent/a2a-server";
import VoltAgent from "@voltagent/core";
import { assistantAgent } from "../agents/assistant.agent.js";
import honoServer from "@voltagent/server-hono";

export const a2aServer = new A2AServer({
  id: "support-agent",
  name: "support-agent",
  version: "0.1.0",
  description: "VoltAgent A2A example",
});

export const voltAgent = new VoltAgent({
  agents: { assistantAgent },
  a2aServers: { a2aServer },
  server: honoServer({ port: 3144 }),
});

a2aServer.initialize({
 // Provide an agent registry object with the methods A2A expects
 agentRegistry: {
     getAgent: (id: string) => voltAgent.getAgent(id),
     getAllAgents: () => voltAgent.getAgents(),
 },
 //  taskStore: redisTaskStore,
});
