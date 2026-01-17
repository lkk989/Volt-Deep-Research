import { registerCopilotKitRoutes } from "@voltagent/ag-ui";
import { VoltAgent, VoltOpsClient, createWorkflowChain } from "@voltagent/core";
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
import { z } from "zod";

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
import { judgeAgent, supportAgent } from "./agents/judge.agent.js";
//import { VoltAgentExporter } from "@voltagent/vercel-ai-exporter";

voltlogger.info("Volt Initilizing");

const voltOpsClient = new VoltOpsClient({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY,
  secretKey: process.env.VOLTAGENT_SECRET_KEY,
});

 // Define the demo workflow's shape: its inputs and final output
const workflow = createWorkflowChain({
  id: "research-assistant",
  name: "Research Assistant Workflow",
  // A detailed description for VoltOps or team clarity
  purpose: "A simple workflow to assist with research on a given topic.",
  input: z.object({ topic: z.string() }),
  result: z.object({ text: z.string() }),
})
  .andThen({
    id: "research",
    execute: async ({ data }) => {
      const { topic } = data;
      const result = await assistantAgent.generateText(
          `
          I'm writing a research report on ${topic} and need help coming up with diverse search queries.
Please generate a list of 3 search queries that would be useful for writing a research report on ${topic}. These queries can be in various formats, from simple keywords to more complex phrases. Do not add any formatting or numbering to the queries. `,
          {  },
        );
        return { text: result.text, input: topic };
      },
    })
    .andThen({
      id: "writing",
      execute: async ({ data, getStepData }) => {
        const { text } = data;
        const stepData = getStepData("research");
        const result = await writerAgent.generateText(
          `
        Input Data: ${text}
        Write a two paragraph research report about ${stepData?.input} based on the provided information. Include as many sources as possible. Provide citations in the text using footnote notation ([#]). First provide the report, followed by a single "References" section that lists all the URLs used, in the format [#] <url>.
      `,
      );
      return { text: result.text };
    },
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
//  traceExporter: VoltAgentExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// Register with VoltOps
new VoltAgent({
  agents: {
    assistant: assistantAgent,
    supportAgent,
    judgeAgent,
    writer: writerAgent,
    director: directorAgent,
    dataAnalyzer: dataAnalyzerAgent,
    factChecker: factCheckerAgent,
    synthesizer: synthesizerAgent,
    scrapper: scrapperAgent,
    coding: codingAgent,
    codeReviewer: codeReviewerAgent,
  },
  workflows: {
    "research-assistant-demo": workflow,
    "comprehensive-research": comprehensiveResearchWorkflow,
    "comprehensive-research-director": comprehensiveResearchDirectorWorkflow,
    "data-pattern-analyzer": dataPatternAnalyzerWorkflow,
    "fact-check-synthesis": factCheckSynthesisWorkflow,
  },
  server: honoServer({
    configureApp: (app) =>
      registerCopilotKitRoutes({
        app,
        // Expose specific agent IDs; omit to expose all registered agents.
        resourceIds: ["assistantAgent", "judgeAgent", "supportAgent",  "writerAgent", "directorAgent", "dataAnalyzerAgent", "factCheckerAgent", "synthesizerAgent", "scrapperAgent", "codingAgent", "codeReviewerAgent"],
        // Optional: pass an agents map directly instead of resourceIds.
        // agents: { MathAgent: mathAgent, StoryAgent: storyAgent },
      }),
  }),
  logger: voltlogger,
  enableSwaggerUI: true, // Enable Swagger UI for API documentation
  observability: voltObservability,
  voltOpsClient, // enables automatic forwarding
  mcpServers: {mcpServer},
  a2aServers: {a2aServer},

});
