import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import { assistantAgent } from "../agents/assistant.agent.js";
import { writerAgent } from "../agents/writer.agent.js";

export const researchAssistantWorkflow = createWorkflowChain({
    id: "research-assistant",
    name: "Research Assistant Workflow",
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
Please generate a list of 3 search queries that would be useful for writing a research report on ${topic}. These queries can be in various formats, from simple keywords to more complex phrases. Do not add any formatting or numbering to the queries. `
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
      `
            );
            return { text: result.text };
        },
    });
