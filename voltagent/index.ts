import { registerCopilotKitRoutes } from "@voltagent/ag-ui";
import { VoltAgent, VoltOpsClient } from "@voltagent/core";

import { voltlogger } from "./config/logger.js";
import { assistantAgent } from "./agents/assistant.agent.js";
import { writerAgent } from "./agents/writer.agent.js";
import { directorAgent } from "./agents/director.agent.js";
import { dataAnalyzerAgent } from "./agents/data-analyzer.agent.js";
import { factCheckerAgent } from "./agents/fact-checker.agent.js";
import { synthesizerAgent } from "./agents/synthesizer.agent.js";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { honoServer } from "@voltagent/server-hono";
import { mcpServer } from "./config/mcpserver.js";
import { scrapperAgent } from "./agents/scrapper.agent.js";
import { codingAgent } from "./agents/coding.agent.js";
import { codeReviewerAgent } from "./agents/code-reviewer.agent.js";
import { a2aServer } from "./a2a/server.js";
import { voltObservability } from "./config/observability.js";
import { comprehensiveResearchWorkflow } from "./workflows/comprehensive-research.workflow.js";
import { comprehensiveResearchDirectorWorkflow } from "./workflows/ai-agent.workflow.js";
import { dataPatternAnalyzerWorkflow } from "./workflows/data-pattern-analyzer.workflow.js";
import { factCheckSynthesisWorkflow } from "./workflows/fact-check-synthesis.workflow.js";
import { researchAssistantWorkflow } from "./workflows/research-assistant.workflow.js";
import { judgeAgent, supportAgent } from "./agents/judge.agent.js";
import { dataScientistAgent } from "./agents/data-scientist.agent.js";
import { researchCoordinatorAgent } from "./agents/research-coordinator.agent.js";
import { deepAgent } from "./agents/plan.agent.js";
//import { VoltAgentExporter } from "@voltagent/vercel-ai-exporter";

voltlogger.info("Volt Initilizing");

const voltOpsClient = new VoltOpsClient({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY,
  secretKey: process.env.VOLTAGENT_SECRET_KEY,
  prompts: true,
  promptCache: {
    enabled: true,
    maxSize: 1000,
    ttl: 3600000, // 1 hour
  }
});

 // Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  autoDetectResources: true,
});
sdk.start();

// Register with VoltOps
export const voltAgent = new VoltAgent({
  agents: {
    "assistant": assistantAgent,
    "support-agent": supportAgent,
    "satisfaction-judge": judgeAgent,
    "research-coordinator": researchCoordinatorAgent,
    "writer": writerAgent,
    "director": directorAgent,
    "data-analyzer": dataAnalyzerAgent,
    "data-scientist": dataScientistAgent,
    "fact-checker": factCheckerAgent,
    "synthesizer": synthesizerAgent,
    "scrapper": scrapperAgent,
    "coding-agent": codingAgent,
    "code-reviewer": codeReviewerAgent,
    "deep-research-agent": deepAgent,
  },
  workflows: {
    "research-assistant-demo": researchAssistantWorkflow,
    "comprehensive-research": comprehensiveResearchWorkflow,
    "comprehensive-research-director": comprehensiveResearchDirectorWorkflow,
    "data-pattern-analyzer": dataPatternAnalyzerWorkflow,
    "fact-check-synthesis": factCheckSynthesisWorkflow,
  },
  server: honoServer({
    port: 3141,
    enableSwaggerUI: true,
  }),
  logger: voltlogger,
  enableSwaggerUI: true, // Enable Swagger UI for API documentation
  observability: voltObservability,
  voltOpsClient, // enables automatic forwarding
  mcpServers: {mcpServer},
  a2aServers: {a2aServer},
});

