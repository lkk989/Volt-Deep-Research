import { z } from 'zod';
import { AiSdkEmbeddingAdapter, Memory, NodeFilesystemBackend, PlanAgent, PlanAgentTodoStatus } from "@voltagent/core";
import { voltlogger } from "../config/logger.js";
import { google } from "@ai-sdk/google"
import { LibSQLMemoryAdapter, LibSQLVectorAdapter } from "@voltagent/libsql"
import { voltObservability } from '../config/observability.js';
import { assistantAgent } from './assistant.agent.js';
import { writerAgent } from './writer.agent.js';
import { dataAnalyzerAgent } from './data-analyzer.agent.js';
import { factCheckerAgent } from './fact-checker.agent.js';
import { synthesizerAgent } from './synthesizer.agent.js';
import { scrapperAgent } from './scrapper.agent.js';
import { thinkOnlyToolkit } from '../tools/reasoning-tool.js';
import { sharedMemory } from '../config/libsql.js';

const researchInstructions = [
  "You are an expert researcher. Your job is to conduct thorough research and then write a polished report.",
  "",
  "You have access to an internet search tool as your primary means of gathering information.",
  "",
  "## internet_search",
  "Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.",
].join("\n");

export const deepAgent = new PlanAgent({
    name: "deep-research-agent",
    purpose: "Conduct in-depth research on complex topics and produce comprehensive reports.",
    systemPrompt: researchInstructions,
    model: "github-copilot/gpt-5-mini",
    tools: [],
    toolkits: [thinkOnlyToolkit],
    memory: sharedMemory,
    maxSteps: 100,
    logger: voltlogger,
    maxOutputTokens: 64000,
    observability: voltObservability,
    subagents: [assistantAgent, writerAgent, dataAnalyzerAgent, factCheckerAgent, synthesizerAgent, scrapperAgent],
    generalPurposeAgent: true,
    task: {
        systemPrompt: "You are a meticulous research agent. Your task is to break down the main research objective into manageable subtasks, delegate these to specialized sub-agents, and then compile their findings into a coherent final report.",
        taskDescription: "Conduct comprehensive research on the assigned topic and produce a detailed report.",
        maxSteps: 50,
    },
    summarization: {
        triggerTokens: 120000,
        keepMessages: 6,
        maxOutputTokens: 8000,
        systemPrompt: "Summarize the following conversation briefly, focusing on key points and decisions made.",
        enabled: true,
        model: "github-copilot/gpt-5-mini",
    },
    filesystem: {
        backend: new NodeFilesystemBackend({
            rootDir: process.cwd(),
            virtualMode: true,
            maxFileSizeMb: 25,
        }),
    systemPrompt: "You are an expert at managing and organizing files for research purposes. Use the filesystem to store, retrieve, and organize research data effectively.",
    customToolDescriptions: {
        lsInfo: "Use this to get information about a file or directory without listing its contents. Helpful for understanding file types and metadata.",
        read: "Use this to read the contents of a file. Only use this for text-based files.",
        readRaw: "Use this to read the raw contents of a file, including binary files. Be cautious when using this to avoid overwhelming amounts of data.",
        write: "Use this to write content to a file. Ensure the content is well-organized and relevant to the research topic.",
        edit: "Use this to edit the contents of an existing file. Make sure to maintain the integrity of the data while making necessary updates.",
        grepRaw: "Use this to search for a specific string or pattern within files, returning raw matching lines. Useful for finding specific data points in large files.",
        globInfo: "Use this to search for files matching a specific pattern. This is useful for finding related research documents.",
    },
    toolTokenLimitBeforeEvict: 40000,
    },
    toolResultEviction: {
        enabled: true,
        tokenLimit: 20000,
    },
});
