import { createWorkflowChain } from '@voltagent/core'
import { z } from 'zod'
import { assistantAgent } from '../agents/assistant.agent.js'
import { writerAgent } from '../agents/writer.agent.js'

export const researchAssistantWorkflow = createWorkflowChain({
    id: 'research-assistant',
    name: 'Research Assistant Workflow',
    purpose: 'A simple workflow to assist with research on a given topic.',
    input: z.object({ topic: z.string() }),
    result: z.object({ text: z.string() }),
})
    .andThen({
        id: 'research',
        execute: async ({ data, writer }) => {
            const { topic } = data
            const response = await assistantAgent.streamText(
                `
          I'm writing a research report on ${topic} and need help coming up with diverse search queries.
Please generate a list of 3 search queries that would be useful for writing a research report on ${topic}. These queries can be in various formats, from simple keywords to more complex phrases. Do not add any formatting or numbering to the queries. `
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'assistant-',
                    agentId: 'assistant',
                })
            }
            const result = await response.text
            return { text: result, input: topic }
        },
    })
    .andThen({
        id: 'writing',
        execute: async ({ data, getStepData, writer }) => {
            const { text } = data
            const stepData = getStepData('research')
            const response = await writerAgent.streamText(
                `
        Input Data: ${text}
        Write a two paragraph research report about ${stepData?.input} based on the provided information. Include as many sources as possible. Provide citations in the text using footnote notation ([#]). First provide the report, followed by a single "References" section that lists all the URLs used, in the format [#] <url>.
      `
            )
            if (response.fullStream) {
                await writer.pipeFrom(response.fullStream, {
                    prefix: 'writer-',
                    agentId: 'writer',
                })
            }
            const result = await response.text
            return { text: result }
        },
    })
