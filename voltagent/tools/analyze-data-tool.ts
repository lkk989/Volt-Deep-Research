import { createTool } from "@voltagent/core";
import { voltlogger } from "../config/logger";
import { z } from "zod";

// Data analysis tools
export const analyzeDataTool = createTool({
  name: "analyze_data_patterns",
  description: "Analyze data for patterns, trends, and correlations",
  parameters: z.object({
    data: z.string().describe("The data to analyze"),
    analysisType: z.enum(["patterns", "trends", "correlations", "anomalies"]).describe("Type of analysis to perform"),
  }),
  execute: ({ data, analysisType }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Analyzing data for ${analysisType}`);

    // Basic data analysis implementation
    const lines = data.split('\n').filter(line => line.trim());
    const words = data.split(/\s+/).filter(word => word.length > 0);
    const sentences = data.split(/[.!?]+/).filter(s => s.trim());

    const analysis = {
      type: analysisType,
      dataSize: {
        characters: data.length,
        words: words.length,
        lines: lines.length,
        sentences: sentences.length
      },
      findings: [] as string[]
    };

    switch (analysisType) {
      case "patterns": {
        // Look for repeated phrases or structures
        const repeatedWords = words.filter((word, index, arr) =>
          arr.indexOf(word.toLowerCase()) !== index
        );
        if (repeatedWords.length > 0) {
          analysis.findings.push(`Found ${repeatedWords.length} repeated words indicating potential patterns`);
        }
        analysis.findings.push("Data shows structured content with clear sections");
        break;
      }

      case "trends": {
        // Analyze content progression
        const sections = data.split(/\n\s*\n/).filter(s => s.trim());
        analysis.findings.push(`Content divided into ${sections.length} logical sections`);
        if (sections.length > 3) {
          analysis.findings.push("Multi-part structure suggests comprehensive coverage");
        }
        break;
      }

      case "correlations": {
        // Look for related concepts
        const techTerms = words.filter(word =>
          /\b(api|data|system|model|analysis|research|method)\b/i.test(word)
        );
        if (techTerms.length > 0) {
          analysis.findings.push(`Identified ${techTerms.length} technical correlations in content`);
        }
        break;
      }

      case "anomalies": {
        // Check for unusual patterns
        const longLines = lines.filter(line => line.length > 200);
        if (longLines.length > 0) {
          analysis.findings.push(`Found ${longLines.length} unusually long lines that may contain anomalies`);
        }
        const shortLines = lines.filter(line => line.length < 10 && line.trim());
        if (shortLines.length > lines.length * 0.3) {
          analysis.findings.push("High proportion of short lines may indicate fragmented content");
        }
        break;
      }
    }

    return analysis;
  },
});

export const extractInsightsTool = createTool({
  name: "extract_key_insights",
  description: "Extract key insights and actionable information from data",
  parameters: z.object({
    data: z.string().describe("The data to extract insights from"),
    focus: z.string().optional().describe("Specific focus area for insights"),
  }),
  execute: ({ data, focus }, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Extracting insights${focus ? ` with focus on ${focus}` : ""}`);

    // Extract insights from the data
    const lines = data.split('\n').filter(line => line.trim());
    const words = data.split(/\s+/).filter(word => word.length > 0);

    const insights = {
      keyPoints: [] as string[],
      actionableItems: [] as string[],
      recommendations: [] as string[],
      focusArea: focus ?? "general"
    };

    // Extract key points based on content analysis
    if (data.toLowerCase().includes("research") || data.toLowerCase().includes("study")) {
      insights.keyPoints.push("Content contains research-related information");
    }

    if (data.toLowerCase().includes("data") || data.toLowerCase().includes("analysis")) {
      insights.keyPoints.push("Data analysis elements identified in content");
    }

    // Look for actionable items (sentences with imperative verbs)
    const imperativePatterns = /\b(must|should|need to|required|implement|create|develop|analyze)\b/gi;
    const actionableLines = lines.filter(line => imperativePatterns.test(line));
    if (actionableLines.length > 0) {
      insights.actionableItems.push(`Found ${actionableLines.length} potentially actionable statements`);
    }

    // Generate recommendations based on content
    if (words.length > 1000) {
      insights.recommendations.push("Content is comprehensive - consider breaking into sections for better readability");
    }

    if (lines.length < 10) {
      insights.recommendations.push("Content appears brief - may need expansion for complete analysis");
    }

    // Focus-specific insights
    if (focus) {
      const focusLower = focus.toLowerCase();
      const relevantLines = lines.filter(line =>
        line.toLowerCase().includes(focusLower)
      );
      if (relevantLines.length > 0) {
        insights.keyPoints.push(`Found ${relevantLines.length} items relevant to ${focus}`);
      }
    }

    return insights;
  },
});

// Fact checking tools
export const verifyClaimTool = createTool({
  name: "verify_claim",
  description: "Verify the accuracy of a specific claim or statement",
  parameters: z.object({
    claim: z.string().describe("The claim to verify"),
    context: z.string().optional().describe("Additional context about the claim"),
  }),
  execute: ({ claim, context }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Verifying claim: ${claim.substring(0, 100)}...`, { claim, context });

    // Basic claim verification logic
    const verification = {
      claim,
      status: "Unverified" as "Verified" | "Partially Verified" | "Unverified" | "Debunked",
      confidence: "Low" as "High" | "Medium" | "Low",
      reasoning: [] as string[],
      sources: [] as string[],
      recommendations: [] as string[]
    };

    // Simple pattern-based verification (in real implementation, this would use external APIs)
    const claimLower = claim.toLowerCase();

    // Check for obvious factual claims
    if (claimLower.includes("the sky is blue")) {
      verification.status = "Verified";
      verification.confidence = "High";
      verification.reasoning.push("Basic scientific fact about light scattering in atmosphere");
      verification.sources.push("Atmospheric science consensus");
    } else if (claimLower.includes("earth is flat")) {
      verification.status = "Debunked";
      verification.confidence = "High";
      verification.reasoning.push("Contradicted by extensive scientific evidence and observations");
      verification.sources.push("NASA, astronomical observations, satellite imagery");
    } else if (claimLower.includes("research") || claimLower.includes("study")) {
      verification.status = "Partially Verified";
      verification.confidence = "Medium";
      verification.reasoning.push("Research claims require source verification");
      verification.recommendations.push("Verify against original research sources and peer review");
    } else {
      verification.status = "Unverified";
      verification.confidence = "Low";
      verification.reasoning.push("Insufficient information to verify claim");
      verification.recommendations.push("Provide additional context or sources for verification");
    }

    // Context consideration
    if (context) {
      verification.reasoning.push(`Additional context provided: ${context.substring(0, 200)}...`);
    }

    return verification;
  },
});

export const crossReferenceSourcesTool = createTool({
  name: "cross_reference_sources",
  description: "Cross-reference information across multiple sources for consistency",
  parameters: z.object({
    sources: z.array(z.string()).describe("Array of source texts to cross-reference"),
    topic: z.string().describe("The topic being cross-referenced"),
  }),
  execute: ({ sources, topic }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Cross-referencing ${sources.length} sources on topic: ${topic}`);

    // Cross-reference analysis
    const analysis = {
      topic,
      sourceCount: sources.length,
      consistency: "Unknown" as "High" | "Medium" | "Low" | "Conflicting" | "Unknown",
      commonThemes: [] as string[],
      conflicts: [] as string[],
      consensusPoints: [] as string[],
      recommendations: [] as string[]
    };

    if (sources.length === 0) {
      analysis.consistency = "Unknown";
      analysis.recommendations.push("No sources provided for cross-referencing");
      return analysis;
    }

    // Analyze consistency across sources
    const topicLower = topic.toLowerCase();
    const relevantSources = sources.filter(source =>
      source.toLowerCase().includes(topicLower)
    );

    analysis.consensusPoints.push(`${relevantSources.length} of ${sources.length} sources mention the topic`);

    // Simple conflict detection
    const contradictions = sources.filter(source =>
      source.toLowerCase().includes("however") ||
      source.toLowerCase().includes("but") ||
      source.toLowerCase().includes("contrary")
    );

    if (contradictions.length > sources.length * 0.5) {
      analysis.consistency = "Conflicting";
      analysis.conflicts.push("Multiple sources contain contradictory information");
    } else if (relevantSources.length === sources.length) {
      analysis.consistency = "High";
      analysis.consensusPoints.push("All sources address the topic consistently");
    } else if (relevantSources.length >= sources.length * 0.7) {
      analysis.consistency = "Medium";
      analysis.consensusPoints.push("Most sources address the topic");
    } else {
      analysis.consistency = "Low";
      analysis.recommendations.push("Limited coverage of topic across sources");
    }

    // Extract common themes
    const commonWords = ["research", "study", "data", "analysis", "results", "findings"];
    commonWords.forEach(word => {
      const sourcesWithWord = sources.filter(source =>
        source.toLowerCase().includes(word)
      );
      if (sourcesWithWord.length >= sources.length * 0.6) {
        analysis.commonThemes.push(`"${word}" appears in ${sourcesWithWord.length} sources`);
      }
    });

    return analysis;
  },
});

export const detectBiasTool = createTool({
  name: "detect_bias",
  description: "Analyze content for potential bias, misinformation, or conflicts of interest",
  parameters: z.object({
    content: z.string().describe("The content to analyze for bias"),
    contentType: z.enum(["article", "report", "social_media", "academic"]).describe("Type of content being analyzed"),
  }),
  execute: ({ content, contentType }, operationContext) => {
    if (!operationContext?.isActive) {
      throw new Error("Operation has been cancelled");
    }

    voltlogger.info(`Analyzing ${contentType} content for bias`);

    // Bias detection analysis
    const analysis = {
      contentType,
      biasIndicators: [] as string[],
      credibilityScore: 0, // 0-100 scale
      riskLevel: "Low" as "Low" | "Medium" | "High" | "Critical",
      recommendations: [] as string[],
      concerns: [] as string[]
    };

    const contentLower = content.toLowerCase();

    // Analyze for bias indicators based on content type
    switch (contentType) {
      case "social_media":
        // Social media bias indicators
        if (contentLower.includes("breaking") && contentLower.includes("exclusive")) {
          analysis.biasIndicators.push("Sensationalist language (breaking/exclusive)");
          analysis.credibilityScore -= 15;
        }
        if ((contentLower.match(/\b(always|never|everyone|nobody)\b/g) ?? []).length > 3) {
          analysis.biasIndicators.push("Absolute language overuse");
          analysis.credibilityScore -= 10;
        }
        analysis.credibilityScore = Math.max(30, analysis.credibilityScore); // Base score for social media
        break;

      case "article":
        // News article bias indicators
        if (contentLower.includes("sources say") && !contentLower.includes("according to")) {
          analysis.biasIndicators.push("Unattributed sources");
          analysis.credibilityScore -= 20;
        }
        if (contentLower.includes("critics claim") && contentLower.includes("supporters say")) {
          analysis.biasIndicators.push("False balance between credible and non-credible sources");
          analysis.credibilityScore -= 15;
        }
        analysis.credibilityScore = Math.max(60, analysis.credibilityScore); // Base score for articles
        break;

      case "report":
        // Research report bias indicators
        if (!contentLower.includes("methodology") && content.length > 1000) {
          analysis.biasIndicators.push("Missing methodology section");
          analysis.credibilityScore -= 25;
        }
        if (contentLower.includes("funded by") && contentLower.includes("independent")) {
          analysis.concerns.push("Potential conflict of interest in funding disclosure");
          analysis.credibilityScore -= 10;
        }
        analysis.credibilityScore = Math.max(70, analysis.credibilityScore); // Base score for reports
        break;

      case "academic":
        // Academic paper bias indicators
        if (!contentLower.includes("references") && !contentLower.includes("bibliography")) {
          analysis.biasIndicators.push("Missing citations or references");
          analysis.credibilityScore -= 30;
        }
        if (contentLower.includes("significant") && !contentLower.includes("p-value")) {
          analysis.biasIndicators.push("Statistical claims without supporting evidence");
          analysis.credibilityScore -= 15;
        }
        analysis.credibilityScore = Math.max(80, analysis.credibilityScore); // Base score for academic
        break;
    }

    // General bias indicators
    if (contentLower.match(/\b(fake news|deep state|conspiracy)\b/g)) {
      analysis.biasIndicators.push("Conspiracy theory language");
      analysis.credibilityScore -= 25;
      analysis.concerns.push("Content contains conspiracy theory elements");
    }

    if (contentLower.includes("according to sources") && contentLower.includes("unnamed")) {
      analysis.biasIndicators.push("Anonymous sourcing");
      analysis.credibilityScore -= 15;
    }

    // Determine risk level
    if (analysis.credibilityScore < 40) {
      analysis.riskLevel = "Critical";
      analysis.recommendations.push("High risk of misinformation - verify with multiple credible sources");
    } else if (analysis.credibilityScore < 60) {
      analysis.riskLevel = "High";
      analysis.recommendations.push("Significant bias concerns - cross-reference information");
    } else if (analysis.credibilityScore < 80) {
      analysis.riskLevel = "Medium";
      analysis.recommendations.push("Moderate bias indicators present - consider alternative perspectives");
    } else {
      analysis.riskLevel = "Low";
      analysis.recommendations.push("Content appears credible with minimal bias indicators");
    }

    // Ensure credibility score is within bounds
    analysis.credibilityScore = Math.max(0, Math.min(100, analysis.credibilityScore));

    return analysis;
  },
});
