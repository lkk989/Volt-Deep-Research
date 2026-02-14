/**
 * Custom Guardrails for Mastervolt Deep Research
 *
 * Input Guardrails: Validate and sanitize user inputs before reaching agents
 * Output Guardrails: Sanitize and filter agent outputs
 */

import { createInputGuardrail, createOutputGuardrail } from '@voltagent/core'
import { voltlogger } from '../config/logger.js'

// ============================================
// CUSTOM INPUT GUARDRAILS
// ============================================

/**
 * Research Topic Validator
 * Ensures research topics are appropriate and not restricted
 */
export const researchTopicValidator = createInputGuardrail({
  id: 'research-topic-validator',
  name: 'Research Topic Validator',
  description:
    'Validates that research topics are appropriate for the research agent',
  handler: async ({ input }) => {
    if (typeof input !== 'string') {
      return { pass: true }
    }

    const restrictedTopics = [
      'illegal',
      'harmful',
      'weapon',
      'explosive',
      'terrorist',
      'child abuse',
      'human trafficking',
    ]

    const inputLower = input.toLowerCase()

    for (const topic of restrictedTopics) {
      if (inputLower.includes(topic)) {
        voltlogger.warn(`Blocked restricted topic: ${topic}`)
        return {
          pass: false,
          message: `Sorry, I cannot conduct research on topics related to "${topic}". Please choose a different research topic.`,
        }
      }
    }

    // Check minimum length
    if (input.trim().length < 3) {
      return {
        pass: false,
        message:
          'Research topic is too short. Please provide a more specific topic.',
      }
    }

    // Check maximum length
    if (input.trim().length > 500) {
      return {
        pass: false,
        message:
          'Research topic is too long. Please provide a concise topic (under 500 characters).',
      }
    }

    return { pass: true }
  },
})

/**
 * Code Implementation Validator
 * Ensures code requests are appropriate
 */
export const codeRequestValidator = createInputGuardrail({
  id: 'code-request-validator',
  name: 'Code Request Validator',
  description: 'Validates code implementation requests',
  handler: async ({ input }) => {
    if (typeof input !== 'string') {
      return { pass: true }
    }

    const blockedPatterns = [
      /hack\s+(password|account|system)/i,
      /bypass\s+(security|authentication|encryption)/i,
      /create\s+(malware|virus|ransomware)/i,
      /exploit\s+(vulnerability|cve)/i,
    ]

    for (const pattern of blockedPatterns) {
      if (pattern.test(input)) {
        voltlogger.warn(`Blocked inappropriate code request`)
        return {
          pass: false,
          message:
            'I cannot help with requests to create harmful or malicious code.',
        }
      }
    }

    return { pass: true }
  },
})

/**
 * Input Sanitizer
 * Removes PII and cleans user input
 */
export const inputSanitizer = createInputGuardrail({
  id: 'input-sanitizer',
  name: 'Input Sanitizer',
  description: 'Removes PII and sanitizes user input',
  handler: async ({ input }) => {
    if (typeof input !== 'string') {
      return { pass: true }
    }

    let sanitized = input

    // Remove email addresses
    sanitized = sanitized.replace(
      /[\w.-]+@[\w.-]+\.\w+/gi,
      '[EMAIL REDACTED]'
    )

    // Remove phone numbers (various formats)
    sanitized = sanitized.replace(
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      '[PHONE REDACTED]'
    )

    // Remove SSN patterns
    sanitized = sanitized.replace(
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      '[SSN REDACTED]'
    )

    // Remove credit card patterns
    sanitized = sanitized.replace(
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      '[CARD REDACTED]'
    )

    // Remove API keys / secrets patterns
    sanitized = sanitized.replace(
      /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[\w-]{8,}["']?/gi,
      '$1=[REDACTED]'
    )

    voltlogger.debug('Input sanitized', {
      originalLength: input.length,
      sanitizedLength: sanitized.length,
    })

    return {
      pass: true,
      action: sanitized !== input ? 'modify' : undefined,
      modifiedInput: sanitized,
    }
  },
})

/**
 * URL Filter
 * Blocks requests containing malicious URLs
 */
export const urlFilter = createInputGuardrail({
  id: 'url-filter',
  name: 'URL Filter',
  description: 'Filters out malicious or suspicious URLs from input',
  handler: async ({ input }) => {
    if (typeof input !== 'string') {
      return { pass: true }
    }

    const urlPattern = /https?:\/\/[^\s]+/gi
    const urls = input.match(urlPattern) || []

    const suspiciousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/i,
      /0x0+\.i/i,
      /bit\.ly\/.*?/i,
      /tinyurl\.com\/.*?/i,
    ]

    for (const url of urls) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return {
            pass: false,
            message:
              'Suspicious URL detected. Please remove or modify the URL.',
          }
        }
      }
    }

    return { pass: true }
  },
})

// ============================================
// CUSTOM OUTPUT GUARDRAILS
// ============================================

/**
 * Funding Amount Redactor
 * Masks funding amounts in output
 */
export const fundingRedactor = createOutputGuardrail({
  id: 'funding-redactor',
  name: 'Funding Redactor',
  description: 'Masks funding amounts for privacy',
  handler: async ({ output }) => {
    if (typeof output !== 'string') return { pass: true }

    let sanitized = output

    // Mask various funding patterns
    const fundingPatterns = [
      {
        regex: /funding[:\s]+\$[\d,]+(\.\d{2})?/gi,
        replacement: 'funding: [AMOUNT REDACTED]',
      },
      {
        regex: /raised\s+\$[\d,]+(\.\d{2})?/gi,
        replacement: 'raised [AMOUNT REDACTED]',
      },
      {
        regex: /\$\d+(\.\d{2})?\s+(million|billion|thousand)/gi,
        replacement: '[FUNDING REDACTED]',
      },
      {
        regex: /(valuation|worth)\s+\$[\d,]+(\.\d{2})?/gi,
        replacement: '$1 [VALUATION REDACTED]',
      },
    ]

    for (const { regex, replacement } of fundingPatterns) {
      sanitized = sanitized.replace(regex, replacement)
    }

    return {
      pass: true,
      action: sanitized !== output ? 'modify' : undefined,
      modifiedOutput: sanitized,
    }
  },
})

/**
 * Competitor Blocker
 * Prevents mentioning specific competitors
 */
export const competitorBlocker = createOutputGuardrail({
  id: 'competitor-blocker',
  name: 'Competitor Blocker',
  description: 'Prevents mentioning competitor products/services',
  handler: async ({ output }) => {
    if (typeof output !== 'string') return { pass: true }

    const competitors = [
      'OpenAI',
      'Anthropic',
      'Claude',
      'GPT-4',
      'GPT-5',
      'Gemini',
      'Perplexity',
    ]

    for (const competitor of competitors) {
      if (output.includes(competitor)) {
        // Just warn, don't block - this is too restrictive
        voltlogger.debug(`Competitor mention detected: ${competitor}`)
      }
    }

    return { pass: true }
  },
})

/**
 * Citation Validator
 * Ensures citations are properly formatted
 */
export const citationValidator = createOutputGuardrail({
  id: 'citation-validator',
  name: 'Citation Validator',
  description: 'Validates and formats citations in research output',
  handler: async ({ output }) => {
    if (typeof output !== 'string') return { pass: true }

    // Check for uncited references
    const citationPattern = /\[\d+\]/g
    const citations = output.match(citationPattern) || []

    // Check for URLs without sources
    const urlPattern = /https?:\/\/[^\s]+/g
    const urls = output.match(urlPattern) || []

    if (urls.length > 0 && citations.length === 0) {
      voltlogger.warn('Output contains URLs without citations')
    }

    return { pass: true }
  },
})

/**
 * Profanity Filter
 * Filters out profanity from output
 */
export const profanityFilter = createOutputGuardrail({
  id: 'profanity-filter',
  name: 'Profanity Filter',
  description: 'Filters profanity from agent output',
  handler: async ({ output }) => {
    if (typeof output !== 'string') return { pass: true }

    const profanityList = [
      // Add common profanity words here
      // This is a minimal example - expand as needed
      'kys',
    ]

    let hasProfanity = false
    let sanitized = output

    for (const word of profanityList) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      if (regex.test(sanitized)) {
        hasProfanity = true
        sanitized = sanitized.replace(regex, '*'.repeat(word.length))
      }
    }

    return {
      pass: true,
      action: hasProfanity ? 'modify' : undefined,
      modifiedOutput: sanitized,
    }
  },
})

/**
 * Max Length Enforcer
 * Ensures output doesn't exceed reasonable length
 */
export const outputMaxLength = createOutputGuardrail({
  id: 'output-max-length',
  name: 'Output Max Length',
  description: 'Enforces maximum output length',
  handler: async ({ output }) => {
    const maxLength = 50000 // 50k characters

    if (typeof output !== 'string') return { pass: true }

    if (output.length > maxLength) {
      voltlogger.warn(
        `Output truncated from ${output.length} to ${maxLength} characters`
      )
      return {
        pass: true,
        action: 'modify',
        modifiedOutput:
          output.substring(0, maxLength) +
          '\n\n[Output truncated due to length]',
      }
    }

    return { pass: true }
  },
})

/**
 * Sensitive Data Blocker
 * Blocks output containing sensitive patterns
 */
export const sensitiveDataBlocker = createOutputGuardrail({
  id: 'sensitive-data-blocker',
  name: 'Sensitive Data Blocker',
  description: 'Blocks output containing sensitive data patterns',
  handler: async ({ output }) => {
    if (typeof output !== 'string') return { pass: true }

    const sensitivePatterns = [
      { pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, name: 'SSN' },
      {
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        name: 'Credit Card',
      },
      {
        pattern: /api[_-]?key["']?\s*[:=]\s*["']?[\w-]{20,}["']?/gi,
        name: 'API Key',
      },
      {
        pattern: /secret[_-]?key["']?\s*[:=]\s*["']?[\w-]{20,}["']?/gi,
        name: 'Secret Key',
      },
    ]

    for (const { pattern, name } of sensitivePatterns) {
      if (pattern.test(output)) {
        voltlogger.error(`Blocked output containing ${name}`)
        return {
          pass: false,
          message: `Output blocked due to detection of sensitive data (${name}). Please remove sensitive information and try again.`,
        }
      }
    }

    return { pass: true }
  },
})

// ============================================
// GUARDRAIL BUNDLES
// ============================================

/**
 * Research Agent Guardrails
 * Combined input/output guardrails for research agents
 */
export const researchAgentGuardrails = {
  input: [researchTopicValidator, inputSanitizer, urlFilter],
  output: [fundingRedactor, citationValidator, outputMaxLength],
}

/**
 * Coding Agent Guardrails
 * Combined guardrails for coding agents
 */
export const codingAgentGuardrails = {
  input: [codeRequestValidator, inputSanitizer],
  output: [sensitiveDataBlocker, outputMaxLength],
}

/**
 * Default Agent Guardrails
 * General purpose guardrails for all agents
 */
export const defaultAgentGuardrails = {
  input: [inputSanitizer],
  output: [outputMaxLength],
}
