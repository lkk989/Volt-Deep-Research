import { VoltAgent, createWorkflowChain } from "@voltagent/core";
import { voltlogger } from "./config/logger.js";
import { assistantAgent } from "./agents/assistant.agent.js";
import { writerAgent } from "./agents/writer.agent.js";
import { directorAgent } from "./agents/director.agent.js";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { honoServer } from "@voltagent/server-hono";
import { z } from "zod";


voltlogger.info("Volt Initilizing");

// Define the workflow's shape: its inputs and final output
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
//  traceExporter: voltAgentExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// Register with VoltOps
new VoltAgent({
  agents: { assistant: assistantAgent, writer: writerAgent, director: directorAgent },
  workflows: { assistant: workflow, },
  server: honoServer(),
  logger: voltlogger,
  enableSwaggerUI: true, // Enable Swagger UI for API documentation
  // mcpServers: {},
  // a2aServers: {},
});
