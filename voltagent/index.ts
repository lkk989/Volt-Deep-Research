import {
  VoltAgent,
  VoltOpsClient,
  createTriggers,
} from "@voltagent/core";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  createResumableStreamAdapter,
  createResumableStreamVoltOpsStore,
} from "@voltagent/resumable-streams";
import { honoServer } from "@voltagent/server-hono";
import { a2aServer } from "./a2a/server.js";
import { assistantAgent } from "./agents/assistant.agent.js";
import { codeReviewerAgent } from "./agents/code-reviewer.agent";
import { codingAgent } from "./agents/coding.agent.js";
import { dataAnalyzerAgent } from "./agents/data-analyzer.agent.js";
import { dataScientistAgent } from "./agents/data-scientist.agent.js";
import { directorAgent } from "./agents/director.agent.js";
import { factCheckerAgent } from "./agents/fact-checker.agent.js";
import { judgeAgent, supportAgent } from "./agents/judge.agent.js";
import { deepAgent } from "./agents/plan.agent.js";
import { researchCoordinatorAgent } from "./agents/research-coordinator.agent.js";
import { scrapperAgent } from "./agents/scrapper.agent.js";
import { synthesizerAgent } from "./agents/synthesizer.agent.js";
import { writerAgent } from "./agents/writer.agent.js";
import { sharedMemory } from "./config/libsql.js";
import { voltlogger } from "./config/logger.js";
import { mcpServer } from "./config/mcpserver.js";
import { voltObservability } from "./config/observability.js";
import { comprehensiveResearchDirectorWorkflow } from "./workflows/ai-agent.workflow.js";
import { comprehensiveResearchWorkflow } from "./workflows/comprehensive-research.workflow.js";
import { dataPatternAnalyzerWorkflow } from "./workflows/data-pattern-analyzer.workflow.js";
import { factCheckSynthesisWorkflow } from "./workflows/fact-check-synthesis.workflow.js";
import { researchAssistantWorkflow } from "./workflows/research-assistant.workflow.js";
import { sharedWorkspaceRuntime } from "./workspaces/index.js";
import { researchPlanAgent } from "./agents/research-plan.agent.js";
import { newsPlanAgent } from "./agents/news-plan.agent.js";
import { contentCuratorAgent } from "./agents/content-curator.agent.js";
import { LibTaskStore } from "./a2a/store.js";
//import { VoltAgentExporter } from "@voltagent/vercel-ai-exporter";

voltlogger.info("Volt Initilizing");

await sharedWorkspaceRuntime.init();

const registeredAgents = {
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
  "research-orchestrator": researchPlanAgent,
  "news-orchestrator": newsPlanAgent,
  "content-curator": contentCuratorAgent,
} as const;

const registeredWorkflows = {
  "research-assistant-demo": researchAssistantWorkflow,
  "comprehensive-research": comprehensiveResearchWorkflow,
  "comprehensive-research-director": comprehensiveResearchDirectorWorkflow,
  "data-pattern-analyzer": dataPatternAnalyzerWorkflow,
  "fact-check-synthesis": factCheckSynthesisWorkflow,
} as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
}

const streamStore = await createResumableStreamVoltOpsStore();
const resumableStreamAdapter = await createResumableStreamAdapter({ streamStore });

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
  agents: registeredAgents,
  workflows: registeredWorkflows,
  server: honoServer({
    port: 3141,
    enableSwaggerUI: true,
    resumableStream: { adapter: resumableStreamAdapter },
    // Configure app with custom memory endpoints
    configureApp: (app) => {
      voltlogger.info("Registering custom memory endpoints...");

      // ============================================================================
      // CUSTOM ENDPOINTS - Simple examples
      // ============================================================================

      /**
       * List all conversations for a user
       * Example: GET /api/conversations?userId=user-123
       */
      app.get("/api/conversations", async (c) => {
        try {
          const userId = c.req.query("userId");

          if (typeof userId !== "string" || userId.trim().length === 0) {
            return c.json(
              {
                success: false,
                error: "userId query parameter is required",
              },
              400,
            );
          }

          // Get conversations from memory adapter
          const conversations = await sharedMemory.queryConversations({
            userId,
            orderBy: "updated_at",
            orderDirection: "DESC",
          });

          return c.json({
            success: true,
            data: conversations,
          });
        } catch (error: unknown) {
          voltlogger.error("Error fetching conversations", { error });
          return c.json(
            {
              success: false,
              error: getErrorMessage(error),
            },
            500,
          );
        }
      });

      /**
       * Get messages for a specific conversation
       * Example: GET /api/conversations/:conversationId/messages?userId=user-123
       */
      app.get("/api/conversations/:conversationId/messages", async (c) => {
        try {
          const conversationId = c.req.param("conversationId");
          const userId = c.req.query("userId");

          if (typeof userId !== "string" || userId.trim().length === 0) {
            return c.json(
              {
                success: false,
                error: "userId query parameter is required",
              },
              400,
            );
          }

          // Get messages from memory adapter
          const messages = await sharedMemory.getMessages(userId, conversationId);

          return c.json({
            success: true,
            data: messages,
          });
        } catch (error: unknown) {
          voltlogger.error("Error fetching messages", { error });
          return c.json(
            {
              success: false,
              error: getErrorMessage(error),
            },
            500,
          );
        }
      });

      voltlogger.info("Custom memory endpoints registered successfully");
    },
  }),
  logger: voltlogger,
  enableSwaggerUI: true, // Enable Swagger UI for API documentation
  observability: voltObservability,
  voltOpsClient, // enables automatic forwarding
  mcpServers: { mcpServer },
  a2aServers: { a2aServer },
  triggers: createTriggers((on) => {
    // Airtable integration
    //  on.airtable.recordCreated(({ payload, agents }) => {
    //    console.log("New Airtable record:", payload);
    //  });
    // GitHub integration
    on.github.create(({ payload, agents }) => {
      voltlogger.info("New GitHub issue", { agents, payload });
    });
    on.github.any(({ payload, agents }) => {
      voltlogger.info("GitHub event received", { agents, payload });
    });
    on.github.fork(({ payload, agents }) => {
      voltlogger.info("GitHub fork event received", { agents, payload });
    });
    // Cron integration
    on.cron.schedule(({ payload, agents }) => {
      voltlogger.info("Hourly cron triggered", { agents, payload });
    });
    // Other GitHub events can be added similarly using on.github.<event_name>
    //github.pull_request, "github.pull_request_review", "github.pull_request_review_comment", "github.push", "github.watch"
    //"github.status", "github.repository", "github.pull_request_review_comment", "github.commit_comment", "github.check_run"
    // Gmail integration
    //    on.gmail.newEmail(({ payload, agents }) => {
    //      console.log("Gmail email received:", payload);
    //      console.log("Gmail email received by agents:", agents);
    //    });

    // Google Drive integration
    //    on.googleDrive.fileChanged(({ payload, agents }) => {
    //      console.log("Google Drive file changed:", payload);
    //      console.log("Google Drive file changed handled by agents:", agents);
    //    });
    //    on.googleDrive.folderChanged(({ payload, agents }) => {
    //      console.log("Google Drive file created:", payload);
    //      console.log("Google Drive file created handled by agents:", agents);
    //    });

    // Google Calendar integration
    //    on.googleCalendar.eventCreated(({ payload, agents }) => {
    //      console.log("Google Calendar event created:", payload);
    //      console.log("Google Calendar event created handled by agents:", agents);
    //    });

    // Webhook integration
    //    on.webhook.received(({ payload }) => {
    //     console.log("Webhook received:", payload);
    //    });
  }),
});

a2aServer.initialize({
  // Provide an agent registry object with the methods A2A expects
  agentRegistry: {
    getAgent: (id: string) => voltAgent.getAgent(id),
    getAllAgents: () => voltAgent.getAgents(),
  },
    taskStore: new LibTaskStore(),
});
