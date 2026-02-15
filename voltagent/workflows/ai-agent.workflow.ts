import { createWorkflowChain } from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'
import { deepAgent } from '../agents/plan.agent.js'
import { assistantAgent } from '../agents/assistant.agent.js'
import { scrapperAgent } from '../agents/scrapper.agent.js'
import { dataAnalyzerAgent } from '../agents/data-analyzer.agent.js'
import { factCheckerAgent } from '../agents/fact-checker.agent.js'
import { synthesizerAgent } from '../agents/synthesizer.agent.js'
import { writerAgent } from '../agents/writer.agent.js'

/**
 * Advanced Planner-Orchestrated Workflow
 * Uses PlanAgent (deepAgent) as the meta-orchestrator for comprehensive research.
 */
export const comprehensiveResearchDirectorWorkflow = createWorkflowChain({
    id: 'comprehensive-research-director',
    name: 'Comprehensive Research Director Workflow',
    purpose:
        'Director-orchestrated comprehensive research using specialized agents.',
    input: z.object({
        topic: z.string().min(1),
    }),
    result: z.object({
        finalReport: z.string(),
        usedAgents: z.array(z.string()),
    }),
})
    .andTap({
        id: 'log-start',
        inputSchema: z.object({
            topic: z.string(),
        }),
        execute: ({ data }) => {
            voltlogger.info(
                `=== [Director] Starting comprehensive research on: ${data.topic ?? 'Unknown topic'} ===`
            )
            return Promise.resolve()
        },
    })
    .andThen({
        id: 'propose-plan',
        execute: async ({ data, writer }) => {
            // Ask the Director agent for a high-level JSON plan and parse/validate it.
            const prompt =
                `You are the Director. Propose a high-level JSON plan for a comprehensive research workflow on the topic: "${data?.topic ?? ''}". ` +
                `Do NOT include markdown. Respond ONLY with a JSON object like: ` +
                `{"steps":["assistant","scrapper","dataAnalyzer","factChecker","synthesizer","writer"]}.`

            const res = await deepAgent.streamText(prompt)
            if (res.fullStream) {
                await writer.pipeFrom(res.fullStream, {
                    prefix: 'deepagent-',
                    agentId: 'deepAgent',
                })
            }
            const raw = (await res.text).trim()

            // Attempt to extract JSON object from the response, tolerant to extra text.
            let jsonText = raw
            const start = raw.indexOf('{')
            const end = raw.lastIndexOf('}')
            if (start !== -1 && end !== -1 && end > start) {
                jsonText = raw.slice(start, end + 1)
            }

            let parsed: unknown = undefined
            try {
                parsed = JSON.parse(jsonText) as unknown
            } catch (err) {
                voltlogger.warn(
                    `[PlanAgent] Failed to parse plan JSON: ${String(err)}. Response was: ${raw}`
                )
                parsed = { steps: [] }
            }

            const schema = z.object({
                steps: z.array(
                    z.enum([
                        'assistant',
                        'scrapper',
                        'dataAnalyzer',
                        'factChecker',
                        'synthesizer',
                        'writer',
                    ])
                ),
            })

            const validated = schema.safeParse(parsed)
            if (!validated.success || !validated.data.steps.length) {
                voltlogger.warn(
                    `[Director] Invalid or empty plan from director; falling back to default pipeline.`
                )
                return {
                    steps: [
                        'assistant',
                        'scrapper',
                        'dataAnalyzer',
                        'factChecker',
                        'synthesizer',
                        'writer',
                    ],
                }
            }

            return validated.data
        },
    })
    .andThen({
        id: 'execute-plan',
        execute: async ({ data, getStepData, writer }) => {
            // Fallback to canonical pipeline if plan missing/invalid
            const steps =
                data.steps && data.steps.length > 0
                    ? data.steps
                    : [
                          'assistant',
                          'scrapper',
                          'dataAnalyzer',
                          'factChecker',
                          'synthesizer',
                          'writer',
                      ]

            const usedAgents: string[] = []
            const topic =
                (getStepData('log-start')?.input as { topic?: string })
                    ?.topic ?? 'Unknown topic'
            let contextText = `Topic: ${topic}\n`

            for (const step of steps) {
                switch (step) {
                    case 'assistant': {
                        const res = await assistantAgent.streamText(
                            `Generate 5 diverse, high-quality research queries for: ${topic}. ` +
                                `Return plain text without markdown.`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'assistant-',
                                agentId: 'assistant',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Assistant Queries]\n${result}\n`
                        usedAgents.push('assistant')
                        break
                    }
                    case 'scrapper': {
                        const res = await scrapperAgent.streamText(
                            `Using these queries, conceptually gather and summarize key information from high-quality web sources about "${topic}". ` +
                                `You may use your tools if available. Input:\n${contextText}`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'scrapper-',
                                agentId: 'scrapper',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Scrapper Data]\n${result}\n`
                        usedAgents.push('scrapper')
                        break
                    }
                    case 'dataAnalyzer': {
                        const res = await dataAnalyzerAgent.streamText(
                            `Analyze the following collected research data. Extract key themes, trends, metrics, and contradictions.\n${contextText}`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'dataAnalyzer-',
                                agentId: 'dataAnalyzer',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Data Analysis]\n${result}\n`
                        usedAgents.push('dataAnalyzer')
                        break
                    }
                    case 'factChecker': {
                        const res = await factCheckerAgent.streamText(
                            `Fact-check the key claims from this analysis. Flag weak or unsupported claims and highlight verified ones.\n${contextText}`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'factChecker-',
                                agentId: 'factChecker',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Fact Check]\n${result}\n`
                        usedAgents.push('factChecker')
                        break
                    }
                    case 'synthesizer': {
                        const res = await synthesizerAgent.streamText(
                            `Synthesize the verified insights into a coherent structured outline for a comprehensive report on "${topic}".\n${contextText}`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'synthesizer-',
                                agentId: 'synthesizer',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Synthesis]\n${result}\n`
                        usedAgents.push('synthesizer')
                        break
                    }
                    case 'writer': {
                        const res = await writerAgent.streamText(
                            `Using all prior context, write a polished, fully-referenced comprehensive research report on "${topic}". ` +
                                `Include clear sections, deep analysis, and inline citation markers [#]. ` +
                                `End with a "References" section listing all sources used. Context:\n${contextText}`
                        )
                        if (res.fullStream) {
                            await writer.pipeFrom(res.fullStream, {
                                prefix: 'writer-',
                                agentId: 'writer',
                            })
                        }
                        const result = await res.text
                        contextText += `\n[Final Report]\n${result}\n`
                        usedAgents.push('writer')
                        break
                    }
                    default:
                        // Ignore unknown steps defensively
                        break
                }
            }

            // The final report is the last section produced by the writer if present; otherwise fall back to contextText.
            const finalReportMarker = '[Final Report]'
            const finalReportIndex = contextText.lastIndexOf(finalReportMarker)
            const finalReport =
                finalReportIndex !== -1
                    ? contextText
                          .slice(finalReportIndex + finalReportMarker.length)
                          .trim()
                    : contextText.trim()

            voltlogger.info(
                `=== [PlanAgent] Completed comprehensive research on: ${topic} using agents: ${usedAgents.join(
                    ', '
                )} ===`
            )

            return {
                finalReport,
                usedAgents,
            }
        },
    })
