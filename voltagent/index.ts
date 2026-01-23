import { VoltAgent, VoltOpsClient, createTriggers } from "@voltagent/core";

import {
  createResumableStreamAdapter,
  createResumableStreamVoltOpsStore,
} from "@voltagent/resumable-streams";
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
import { sharedMemory } from "./config/libsql.js";
//import { VoltAgentExporter } from "@voltagent/vercel-ai-exporter";

voltlogger.info("Volt Initilizing");


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

          if (!userId) {
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
        } catch (error: any) {
          voltlogger.error("Error fetching conversations:", error);
          return c.json(
            {
              success: false,
              error: error.message || "Internal server error",
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

          if (!userId) {
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
        } catch (error: any) {
          voltlogger.error("Error fetching messages:", error);
          return c.json(
            {
              success: false,
              error: error.message || "Internal server error",
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
  mcpServers: {mcpServer},
  a2aServers: {a2aServer},
  triggers: createTriggers((on) => {
    // Airtable integration
  //  on.airtable.recordCreated(({ payload, agents }) => {
  //    console.log("New Airtable record:", payload);
  //  });
    // GitHub integration
    on.github.create(({ payload, agents }) => {
      console.log("New GitHub issue:", payload);
      console.log("GitHub issue created by agents:", agents);
    });
    on.github.any(({ payload, agents }) => {
      console.log("GitHub event received:", payload);
      console.log("GitHub event received by agents:", agents);
    });
    on.github.fork(({ payload, agents }) => {
      console.log("GitHub fork event received:", payload);
      console.log("GitHub fork event received by agents:", agents);
    });
    // Cron integration
    on.cron.schedule(({ payload, agents }) => {
      console.log("Hourly cron triggered:", payload);
      console.log("Cron event handled by agents:", agents);
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
   // on.webhook.received(({ payload, agents }) => {
   //   console.log("Webhook received:", payload);
   // });
  }),
});

a2aServer.initialize({
 // Provide an agent registry object with the methods A2A expects
 agentRegistry: {
     getAgent: (id: string) => voltAgent.getAgent(id),
     getAllAgents: () => voltAgent.getAgents(),
 },
 //  taskStore: redisTaskStore,
});