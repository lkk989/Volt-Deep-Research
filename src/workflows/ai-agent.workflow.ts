import { createWorkflowChain } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"
import { directorAgent } from "../agents/director.agent.js"
import { assistantAgent } from "../agents/assistant.agent.js"
import { scrapperAgent } from "../agents/scrapper.agent.js"
import { dataAnalyzerAgent } from "../agents/data-analyzer.agent.js"
import { factCheckerAgent } from "../agents/fact-checker.agent.js"
import { synthesizerAgent } from "../agents/synthesizer.agent.js"
import { writerAgent } from "../agents/writer.agent.js"

/**
 * Advanced Director-Orchestrated Workflow
 * Uses directorAgent as a meta-orchestrator for comprehensive research.
 */
export const comprehensiveResearchDirectorWorkflow = createWorkflowChain({
    id: "comprehensive-research-director",
    name: "Comprehensive Research Director Workflow",
    purpose: "Director-orchestrated comprehensive research using specialized agents.",
    input: z.object({
        topic: z.string().min(1),
    }),
    result: z.object({
        finalReport: z.string(),
        usedAgents: z.array(z.string()),
    }),
})
    .andTap({
        id: "log-start",
        execute: (context) => {
            const data = context.data as { topic?: string }
            voltlogger.info(`=== [Director] Starting comprehensive research on: ${data.topic ?? "Unknown topic"} ===`)
        },
    })
    .andAgent(
        ({ data }) => {
            return `You are the Director. Propose a high-level JSON plan for a comprehensive research workflow on the topic: "${data.topic}". ` +
                `Do NOT include markdown. Respond ONLY with a JSON object like: ` +
                `{"steps":["assistant","scrapper","dataAnalyzer","factChecker","synthesizer","writer"]}.`
        },
        directorAgent,
        {
            schema: z.object({
                steps: z.array(
                    z.enum([
                        "assistant",
                        "scrapper",
                        "dataAnalyzer",
                        "factChecker",
                        "synthesizer",
                        "writer",
                    ])
                ),
            }),
        }
    )
    .andThen({
        id: "execute-plan",
        execute: async ({ data, getStepData }) => {
            const plan = getStepData("step-2")?.output
            // Fallback to canonical pipeline if plan missing/invalid
            const steps =
                plan?.steps && plan.steps.length > 0
                    ? plan.steps
                    : ["assistant", "scrapper", "dataAnalyzer", "factChecker", "synthesizer", "writer"]

            const usedAgents: string[] = []
            const topic = (getStepData("log-start")?.input as { topic?: string })?.topic ?? (data as any)?.topic ?? "Unknown topic"
            let contextText = `Topic: ${topic}\n`

            for (const step of steps) {
                switch (step) {
                    case "assistant": {
                        const result = await assistantAgent.generateText(
                            `Generate 5 diverse, high-quality research queries for: ${topic}. ` +
                            `Return plain text without markdown.`
                        )
                        contextText += `\n[Assistant Queries]\n${result.text}\n`
                        usedAgents.push("assistant")
                        break
                    }
                    case "scrapper": {
                        const result = await scrapperAgent.generateText(
                            `Using these queries, conceptually gather and summarize key information from high-quality web sources about "${topic}". ` +
                            `You may use your tools if available. Input:\n${contextText}`
                        )
                        contextText += `\n[Scrapper Data]\n${result.text}\n`
                        usedAgents.push("scrapper")
                        break
                    }
                    case "dataAnalyzer": {
                        const result = await dataAnalyzerAgent.generateText(
                            `Analyze the following collected research data. Extract key themes, trends, metrics, and contradictions.\n${contextText}`
                        )
                        contextText += `\n[Data Analysis]\n${result.text}\n`
                        usedAgents.push("dataAnalyzer")
                        break
                    }
                    case "factChecker": {
                        const result = await factCheckerAgent.generateText(
                            `Fact-check the key claims from this analysis. Flag weak or unsupported claims and highlight verified ones.\n${contextText}`
                        )
                        contextText += `\n[Fact Check]\n${result.text}\n`
                        usedAgents.push("factChecker")
                        break
                    }
                    case "synthesizer": {
                        const result = await synthesizerAgent.generateText(
                            `Synthesize the verified insights into a coherent structured outline for a comprehensive report on "${topic}".\n${contextText}`
                        )
                        contextText += `\n[Synthesis]\n${result.text}\n`
                        usedAgents.push("synthesizer")
                        break
                    }
                    case "writer": {
                        const result = await writerAgent.generateText(
                            `Using all prior context, write a polished, fully-referenced comprehensive research report on "${topic}". ` +
                            `Include clear sections, deep analysis, and inline citation markers [#]. ` +
                            `End with a "References" section listing all sources used. Context:\n${contextText}`
                        )
                        contextText += `\n[Final Report]\n${result.text}\n`
                        usedAgents.push("writer")
                        break
                    }
                    default:
                        // Ignore unknown steps defensively
                        break
                }
            }

            // The final report is the last section produced by the writer if present; otherwise fall back to contextText.
            const finalReportMarker = "[Final Report]"
            const finalReportIndex = contextText.lastIndexOf(finalReportMarker)
            const finalReport =
                finalReportIndex !== -1
                    ? contextText.slice(finalReportIndex + finalReportMarker.length).trim()
                    : contextText.trim()

            voltlogger.info(
                `=== [Director] Completed comprehensive research on: ${topic} using agents: ${usedAgents.join(
                    ", "
                )} ===`
            )

            return {
                finalReport,
                usedAgents,
            }
        },
    })
