import { buildScorer } from '@voltagent/core'

interface PreparedResearch {
  output: string
  sections: number
  wordCount: number
  hasReferences: boolean
}

interface AnalyzedResearch {
  structure: boolean
  length: boolean
  sourced: boolean
  sections: number
  words: number
}

export const researchComprehensiveScorer = buildScorer({
  id: 'research-comprehensiveness',
  label: 'Research Comprehensiveness',
  description: 'Evaluates depth and breadth of research output',
})
  .prepare(({ payload }) => {
    const output = String(payload.output)
    const sections = output.split(/\n#+\s/).length
    const wordCount = output.split(/\s+/).length
    const hasReferences = output.toLowerCase().includes('reference') ||
      output.toLowerCase().includes('source') ||
      output.toLowerCase().includes('citation')
    return { output, sections, wordCount, hasReferences }
  })
  .analyze(({ results }) => {
    const prepared = results.prepare as PreparedResearch
    const minSections = 3
    const minWords = 500
    const hasSufficientStructure = prepared.sections >= minSections
    const hasSufficientLength = prepared.wordCount >= minWords
    const properlySourced = prepared.hasReferences

    return {
      structure: hasSufficientStructure,
      length: hasSufficientLength,
      sourced: properlySourced,
      sections: prepared.sections,
      words: prepared.wordCount
    }
  })
  .score(({ results }) => {
    const analysis = results.analyze as AnalyzedResearch
    let score = 0
    if (analysis.structure) {
      score += 0.4
    }
    if (analysis.length) {
      score += 0.3
    }
    if (analysis.sourced) {
      score += 0.3
    }

    return {
      score: Math.min(1, score),
      metadata: {
        sections: analysis.sections,
        wordCount: analysis.words,
        hasReferences: analysis.sourced
      }
    }
  })
  .reason(({ results }) => {
    const analysis = results.analyze as AnalyzedResearch
    const reasons = []
    if (analysis.structure) {
      reasons.push(`Research has ${analysis.sections} sections`)
    }
    if (analysis.length) {
      reasons.push(`Output is ${analysis.words} words (sufficient length)`)
    }
    if (analysis.sourced) {
      reasons.push('Includes references/sources')
    }

    return {
      reason: reasons.length > 0
        ? `Research is comprehensive: ${reasons.join(', ')}`
        : 'Research lacks depth or structure'
    }
  })
  .build()

interface PreparedData {
  output: string
  expected: string
}

interface AnalyzedData {
  matched: number
  total: number
  accuracy: number
}

export const dataAccuracyScorer = buildScorer({
  id: 'data-accuracy',
  label: 'Data Accuracy',
  description: 'Validates data extraction and analysis'
})
  .prepare(({ payload }) => {
    const output = String(payload.output)
    const expected = String(payload.expected)
    return { output, expected }
  })
  .analyze(({ results }) => {
    const prepared = results.prepare as PreparedData
    const outputLines = prepared.output.split('\n')
    const expectedPatterns = prepared.expected.split('\n')

    const matchedLines = outputLines.filter(line =>
      expectedPatterns.some(pattern => line.toLowerCase().includes(pattern.toLowerCase()))
    ).length

    const accuracy = expectedPatterns.length > 0
      ? matchedLines / expectedPatterns.length
      : 0

    return {
      matched: matchedLines,
      total: expectedPatterns.length,
      accuracy: Math.min(1, accuracy)
    }
  })
  .score(({ results }) => {
    const analysis = results.analyze as AnalyzedData
    return {
      score: analysis.accuracy,
      metadata: {
        matched: analysis.matched,
        total: analysis.total
      }
    }
  })
  .reason(({ results }) => {
    const analysis = results.analyze as AnalyzedData
    const percent = Math.round(analysis.accuracy * 100)
    return {
      reason: `Data accuracy: ${analysis.matched}/${analysis.total} patterns matched (${percent}%)`
    }
  })
  .build()

interface PreparedSynthesis {
  output: string
  hasTransitionPhrases: boolean
  hasConnections: boolean
  hasSummary: boolean
}

interface AnalyzedSynthesis {
  transitions: boolean
  connections: boolean
  summary: boolean
  qualityScore: number
}

export const synthesisQualityScorer = buildScorer({
  id: 'synthesis-quality',
  label: 'Synthesis Quality',
  description: 'Evaluates quality of information synthesis'
})
  .prepare(({ payload }) => {
    const output = String(payload.output)
    return {
      output,
      hasTransitionPhrases: /\b(however|therefore|furthermore|in addition|conversely|notably|significantly)\b/i.test(output),
      hasConnections: /\b(relates to|connects to|builds on|extends|supports|contradicts)\b/i.test(output),
      hasSummary: /\b(in summary|in conclusion|overall|finally|synthesizing)\b/i.test(output)
    }
  })
  .analyze(({ results }) => {
    const prepared = results.prepare as PreparedSynthesis
    const qualityScore = [
      prepared.hasTransitionPhrases ? 1 : 0,
      prepared.hasConnections ? 1 : 0,
      prepared.hasSummary ? 1 : 0
    ].reduce((a, b) => a + b, 0) / 3

    return {
      transitions: prepared.hasTransitionPhrases,
      connections: prepared.hasConnections,
      summary: prepared.hasSummary,
      qualityScore
    }
  })
  .score(({ results }) => {
    const analysis = results.analyze as AnalyzedSynthesis
    return {
      score: analysis.qualityScore,
      metadata: {
        hasTransitions: analysis.transitions,
        hasConnections: analysis.connections,
        hasSummary: analysis.summary
      }
    }
  })
  .reason(({ results }) => {
    const analysis = results.analyze as AnalyzedSynthesis
    const components = []
    if (analysis.transitions) {
      components.push('clear transitions')
    }
    if (analysis.connections) {
      components.push('logical connections')
    }
    if (analysis.summary) {
      components.push('synthesis summary')
    }

    return {
      reason: components.length > 0
        ? `Good synthesis quality: includes ${components.join(', ')}`
        : 'Synthesis lacks quality indicators'
    }
  })
  .build()

interface PreparedFact {
  output: string
  expected: Record<string, unknown>
  claimCount: number
}

interface AnalyzedFact {
  claimDensity: number
  claimCount: number
}

export const factCheckingScorer = buildScorer({
  id: 'fact-checking',
  label: 'Fact Checking',
  description: 'Verifies factual claims in output'
})
  .prepare(({ payload }) => {
    const output = String(payload.output)
    const expected = payload.expected as Record<string, unknown> || {}

    return {
      output,
      expected,
      claimCount: (output.match(/\b(is|are|was|were|states|shows|indicates)\b/gi) || []).length
    }
  })
  .analyze(({ results }) => {
    const prepared = results.prepare as PreparedFact
    const expectedClaims = Object.keys(prepared.expected).length
    const foundClaims = prepared.claimCount > 0 ? prepared.claimCount : 1

    return {
      claimDensity: Math.min(1, expectedClaims / foundClaims),
      claimCount: prepared.claimCount
    }
  })
  .score(({ results }) => {
    const analysis = results.analyze as AnalyzedFact
    return {
      score: analysis.claimDensity,
      metadata: {
        claimCount: analysis.claimCount
      }
    }
  })
  .reason(({ results }) => {
    const analysis = results.analyze as AnalyzedFact
    const confidence = Math.round(analysis.claimDensity * 100)
    return {
      reason: `Fact-checked ${analysis.claimCount} claims (confidence: ${confidence}%)`
    }
  })
  .build()

interface PreparedStructure {
  output: string
  hasTitle: boolean
  headingCount: number
  hasList: boolean
  hasCodeBlocks: boolean
  hasMarkdown: boolean
}

interface AnalyzedStructure {
  structureScore: number
  elements: number
}

export const reportStructureScorer = buildScorer({
  id: 'report-structure',
  label: 'Report Structure',
  description: 'Validates report formatting and organization'
})
  .prepare(({ payload }) => {
    const output = String(payload.output)
    const hasTitle = /^#+\s.+/m.test(output)
    const hasHeadings = (output.match(/^#+\s/gm) ?? []).length
    const hasList = /^[-*+]\s/m.test(output)
    const hasCodeBlocks = /```[\s\S]*?```/.test(output)
    const hasMarkdown = /[*_~`[\]()#]/g.test(output)

    return {
      output,
      hasTitle,
      headingCount: hasHeadings,
      hasList,
      hasCodeBlocks,
      hasMarkdown
    }
  })
  .analyze(({ results }) => {
    const prepared = results.prepare as PreparedStructure
    const structureElements = [
      prepared.hasTitle ? 1 : 0,
      prepared.headingCount >= 3 ? 1 : 0,
      prepared.hasList ? 1 : 0,
      prepared.hasMarkdown ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    return {
      structureScore: Math.min(1, structureElements / 4),
      elements: structureElements
    }
  })
  .score(({ results }) => {
    const analysis = results.analyze as AnalyzedStructure
    return {
      score: analysis.structureScore,
      metadata: {
        structuralElements: analysis.elements
      }
    }
  })
  .reason(({ results }) => {
    const analysis = results.analyze as AnalyzedStructure
    return {
      reason: `Report has ${analysis.elements}/4 structural quality elements`
    }
  })
  .build()
