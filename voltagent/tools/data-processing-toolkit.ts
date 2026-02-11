import {
    createTool,
    createToolkit,
    type Toolkit,
    type Tool,
    type ToolHookOnStartArgs,
    type ToolHookOnEndArgs,
    type ToolExecuteOptions,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

// ============================================================================
// Data Models
// ============================================================================

export interface NormalizedData {
    original: unknown
    normalized: Record<string, unknown>
    schema: Record<string, string>
    validationErrors: Array<{ path: string; error: string }>
    timestamp: string
}

export interface DataAggregation {
    groupBy: string
    groups: Array<{
        key: string
        count: number
        sum?: number
        average?: number
        min?: number
        max?: number
    }>
    statistics: {
        totalRecords: number
        groupCount: number
        computedAt: string
    }
}

export type DataFormat = 'json' | 'csv' | 'xml' | 'yaml' | 'unknown'

export interface FormatDetectionResult {
    format: DataFormat
    confidence: number
    indicators: string[]
    timestamp: string
}

export interface SchemaValidationResult {
    valid: boolean
    errors: Array<{
        path: string
        message: string
        expected?: string
        received?: string
    }>
    warnings: Array<{
        path: string
        message: string
    }>
    timestamp: string
}

export interface CleanedData {
    original: unknown[]
    cleaned: unknown[]
    removedCount: number
    modifiedCount: number
    changes: Array<{
        index: number
        field: string
        action: 'removed' | 'filled' | 'trimmed' | 'converted'
        oldValue?: unknown
        newValue?: unknown
    }>
    timestamp: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Flattens a nested object into a single-level object with dot notation keys
 */
export function flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
    result: Record<string, unknown> = {}
): Record<string, unknown> {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = prefix ? `${prefix}.${key}` : key
            const value = obj[key]

            if (
                value !== null &&
                typeof value === 'object' &&
                !Array.isArray(value)
            ) {
                const nested = value as Record<string, unknown>
                // Preserve empty objects by storing a special marker
                if (Object.keys(nested).length === 0) {
                    result[newKey] = {}
                } else {
                    flattenObject(nested, newKey, result)
                }
            } else {
                result[newKey] = value
            }
        }
    }
    return result
}

/**
 * Unflattens a dot-notation object back to nested structure
 */
export function unflattenObject(
    obj: Record<string, unknown>
): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const keys = key.split('.')
            let current = result

            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i]
                if (!(k in current)) {
                    current[k] = {}
                }
                current = current[k] as Record<string, unknown>
            }

            const value = obj[key]
            // Handle empty objects stored during flattening
            if (
                value !== null &&
                typeof value === 'object' &&
                !Array.isArray(value) &&
                Object.keys(value as Record<string, unknown>).length === 0
            ) {
                current[keys[keys.length - 1]] = {}
            } else {
                current[keys[keys.length - 1]] = value
            }
        }
    }

    return result
}

/**
 * Infers the type of a value for schema generation
 */
function inferType(value: unknown): string {
    if (value === null) {
        return 'null'
    }
    if (value === undefined) {
        return 'undefined'
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'array<unknown>'
        }
        const itemTypes = [...new Set(value.map(inferType))]
        return `array<${itemTypes.join(' | ')}>`
    }
    if (typeof value === 'object') {
        return 'object'
    }
    return typeof value
}

/**
 * Detects the format of a data string
 */
export function detectDataFormat(data: string): FormatDetectionResult {
    const trimmed = data.trim()
    const indicators: string[] = []
    let format: DataFormat = 'unknown'
    let confidence = 0

    // Check for JSON
    if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
        try {
            JSON.parse(trimmed)
            format = 'json'
            confidence = 1.0
            indicators.push('Valid JSON structure', 'Parseable by JSON.parse')
        } catch {
            indicators.push('JSON-like structure but invalid syntax')
            confidence = 0.3
        }
    }

    // Check for XML
    if (
        format === 'unknown' &&
        (trimmed.startsWith('<?xml') || trimmed.startsWith('<'))
    ) {
        const hasClosingTags = /<\/\w+>/.test(trimmed)
        const hasXmlDeclaration = trimmed.startsWith('<?xml')
        if (hasClosingTags || hasXmlDeclaration) {
            format = 'xml'
            confidence = hasXmlDeclaration ? 1.0 : 0.8
            indicators.push('XML-like structure')
            if (hasXmlDeclaration) {
                indicators.push('XML declaration present')
            }
            if (hasClosingTags) {
                indicators.push('Closing tags found')
            }
        }
    }

    // Check for CSV
    if (format === 'unknown') {
        const lines = trimmed.split('\n')
        if (lines.length > 1) {
            const firstLineCommas = (lines[0].match(/,/g) ?? []).length
            const secondLineCommas = (lines[1].match(/,/g) ?? []).length
            if (firstLineCommas > 0 && firstLineCommas === secondLineCommas) {
                format = 'csv'
                confidence = 0.8
                indicators.push(
                    'Consistent comma-separated structure',
                    `${firstLineCommas + 1} columns detected`
                )
            }
        }
    }

    // Check for YAML
    if (format === 'unknown') {
        const hasYamlIndicators =
            /^[\w-]+:\s*.+$/m.test(trimmed) || trimmed.includes('---')
        if (hasYamlIndicators) {
            format = 'yaml'
            confidence = 0.6
            indicators.push('YAML-like key-value structure')
        }
    }

    return {
        format,
        confidence,
        indicators,
        timestamp: new Date().toISOString(),
    }
}

/**
 * Converts data between formats
 */
export function convertFormat(
    data: unknown,
    fromFormat: DataFormat,
    toFormat: DataFormat
): { data: unknown; success: boolean; error?: string } {
    try {
        // First, ensure we have a JavaScript object
        let jsObject: unknown

        if (fromFormat === 'json' && typeof data === 'string') {
            jsObject = JSON.parse(data)
        } else if (fromFormat === 'csv' && typeof data === 'string') {
            // Simple CSV parsing
            const lines = data.trim().split('\n')
            const headers = lines[0].split(',').map((h) => h.trim())
            jsObject = lines.slice(1).map((line) => {
                const values = line.split(',')
                const obj: Record<string, string> = {}
                headers.forEach((header, i) => {
                    obj[header] = values[i]?.trim() || ''
                })
                return obj
            })
        } else {
            jsObject = data
        }

        // Convert to target format
        let result: unknown

        if (toFormat === 'json') {
            result =
                typeof jsObject === 'string'
                    ? jsObject
                    : JSON.stringify(jsObject, null, 2)
        } else if (toFormat === 'csv') {
            if (Array.isArray(jsObject) && jsObject.length > 0) {
                const headers = Object.keys(
                    jsObject[0] as Record<string, unknown>
                )
                const rows = jsObject.map((item) => {
                    const record = item as Record<string, unknown>
                    return headers
                        .map((h) => {
                            const value = record[h] ?? ''
                            if (typeof value === 'object' && value !== null) {
                                return JSON.stringify(value)
                            }
                            if (typeof value === 'string') {
                                return value
                            }
                            if (
                                typeof value === 'number' ||
                                typeof value === 'boolean'
                            ) {
                                return value.toString()
                            }
                            return '' // fallback for undefined, null, symbols, etc.
                        })
                        .join(',')
                })
                result = [headers.join(','), ...rows].join('\n')
            } else {
                result = ''
            }
        } else {
            result = jsObject
        }

        return { data: result, success: true }
    } catch (error) {
        return {
            data: null,
            success: false,
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

// ============================================================================
// Tools
// ============================================================================

/**
 * Normalizes nested data structures by flattening them
 */
export const normalizeDataTool = createTool({
    name: 'normalize_data',
    description:
        'Flattens and normalizes nested data structures into a consistent format with dot notation keys.',
    tags: ['data', 'normalization', 'flatten'],
    parameters: z.object({
        data: z
            .record(z.string(), z.any())
            .describe('The nested data object to normalize'),
        preserveArrays: z
            .boolean()
            .default(true)
            .describe('Whether to preserve arrays as-is or flatten them'),
        generateSchema: z
            .boolean()
            .default(true)
            .describe('Whether to generate a schema of the normalized data'),
    }),
    outputSchema: z.object({
        original: z.unknown(),
        normalized: z.record(z.string(), z.unknown()),
        schema: z.record(z.string(), z.string()),
        validationErrors: z.array(
            z.object({ path: z.string(), error: z.string() })
        ),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { data: Record<string, unknown> }
            voltlogger.info('normalize_data: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                keyCount: Object.keys(params.data).length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('normalize_data: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('normalize_data: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info('Normalizing data structure', {
                operationId: context?.operationId,
            })

            const normalized = flattenObject(args.data)
            const schema: Record<string, string> = {}

            if (args.generateSchema) {
                for (const key in normalized) {
                    schema[key] = inferType(normalized[key])
                }
            }

            const result: NormalizedData = {
                original: args.data,
                normalized,
                schema,
                validationErrors: [],
                timestamp: new Date().toISOString(),
            }

            voltlogger.info('Data normalization complete', {
                operationId: context?.operationId,
            })
            return result
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Data normalization failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to normalize data: ${errorMessage}`)
        }
    },
})

/**
 * Auto-detects the format of data (JSON, CSV, XML, YAML)
 */
export const detectFormatTool = createTool({
    name: 'detect_format',
    description:
        'Auto-detects the format of data string (JSON, CSV, XML, YAML) with confidence scoring.',
    tags: ['data', 'format', 'detection'],
    parameters: z.object({
        data: z
            .string()
            .describe('The data string to analyze for format detection'),
    }),
    outputSchema: z.object({
        format: z.enum(['json', 'csv', 'xml', 'yaml', 'unknown']),
        confidence: z.number(),
        indicators: z.array(z.string()),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { data: string }
            voltlogger.info('detect_format: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                dataLength: params.data.length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('detect_format: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('detect_format: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info('Detecting data format', {
                operationId: context?.operationId,
            })
            const result = detectDataFormat(args.data)
            voltlogger.info(`Format detected: ${result.format}`, {
                operationId: context?.operationId,
            })
            return result
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Format detection failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to detect format: ${errorMessage}`)
        }
    },
})

/**
 * Converts data between different formats
 */
export const convertFormatTool = createTool({
    name: 'convert_format',
    description:
        'Converts data between different formats (JSON, CSV, XML) with validation.',
    tags: ['data', 'format', 'conversion'],
    parameters: z.object({
        data: z
            .union([
                z.string(),
                z.array(z.any()),
                z.record(z.string(), z.any()),
            ])
            .describe('The data to convert'),
        fromFormat: z
            .enum(['json', 'csv', 'xml', 'yaml', 'unknown'])
            .describe('The source format'),
        toFormat: z
            .enum(['json', 'csv', 'xml', 'yaml', 'unknown'])
            .describe('The target format'),
        validate: z
            .boolean()
            .default(true)
            .describe('Whether to validate the conversion result'),
    }),
    outputSchema: z.object({
        data: z.unknown().optional(),
        fromFormat: z.enum(['json', 'csv', 'xml', 'yaml', 'unknown']),
        toFormat: z.enum(['json', 'csv', 'xml', 'yaml', 'unknown']),
        success: z.boolean(),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { fromFormat: string; toFormat: string }
            voltlogger.info('convert_format: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                from: params.fromFormat,
                to: params.toFormat,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('convert_format: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('convert_format: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info(
                `Converting from ${args.fromFormat} to ${args.toFormat}`,
                { operationId: context?.operationId }
            )
            const result = convertFormat(
                args.data,
                args.fromFormat,
                args.toFormat
            )

            if (!result.success) {
                throw new Error(result.error || 'Conversion failed')
            }

            voltlogger.info('Format conversion complete', {
                operationId: context?.operationId,
            })
            return {
                data: result.data,
                fromFormat: args.fromFormat,
                toFormat: args.toFormat,
                success: true,
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Format conversion failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to convert format: ${errorMessage}`)
        }
    },
})

/**
 * Validates data against a schema with detailed error reporting
 */
export const validateSchemaTool = createTool({
    name: 'validate_schema',
    description:
        'Validates data against a schema definition with detailed error reporting.',
    tags: ['data', 'validation', 'schema'],
    parameters: z.object({
        data: z.any().describe('The data to validate'),
        schema: z
            .record(
                z.string(),
                z.object({
                    type: z
                        .enum([
                            'string',
                            'number',
                            'boolean',
                            'array',
                            'object',
                            'null',
                            'any',
                        ])
                        .describe('Expected type'),
                    required: z
                        .boolean()
                        .default(false)
                        .describe('Whether the field is required'),
                    minLength: z
                        .number()
                        .optional()
                        .describe('Minimum length for strings/arrays'),
                    maxLength: z
                        .number()
                        .optional()
                        .describe('Maximum length for strings/arrays'),
                    min: z
                        .number()
                        .optional()
                        .describe('Minimum value for numbers'),
                    max: z
                        .number()
                        .optional()
                        .describe('Maximum value for numbers'),
                    pattern: z
                        .string()
                        .optional()
                        .describe('Regex pattern for strings'),
                })
            )
            .describe('Schema definition with field rules'),
        strict: z
            .boolean()
            .default(false)
            .describe('Whether to fail on unknown fields'),
    }),
    outputSchema: z.object({
        valid: z.boolean(),
        errors: z.array(
            z.object({
                path: z.string(),
                message: z.string(),
                expected: z.string().optional(),
                received: z.string().optional(),
            })
        ),
        warnings: z.array(
            z.object({
                path: z.string(),
                message: z.string(),
            })
        ),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { schema: Record<string, unknown> }
            voltlogger.info('validate_schema: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                fieldCount: Object.keys(params.schema).length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('validate_schema: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('validate_schema: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info('Validating data against schema', {
                operationId: context?.operationId,
            })

            const errors: SchemaValidationResult['errors'] = []
            const warnings: SchemaValidationResult['warnings'] = []
            const dataObj = args.data as Record<string, unknown>

            for (const [field, rules] of Object.entries(args.schema)) {
                const value = dataObj[field]

                if (rules.required && (value === undefined || value === null)) {
                    errors.push({
                        path: field,
                        message: 'Required field is missing',
                        expected: rules.type,
                        received: 'undefined',
                    })
                    continue
                }

                if (value === undefined || value === null) {
                    continue
                }

                const actualType = Array.isArray(value) ? 'array' : typeof value
                if (rules.type !== 'any' && actualType !== rules.type) {
                    errors.push({
                        path: field,
                        message: 'Type mismatch',
                        expected: rules.type,
                        received: actualType,
                    })
                }

                if (rules.type === 'string' && typeof value === 'string') {
                    if (
                        rules.minLength !== undefined &&
                        value.length < rules.minLength
                    ) {
                        errors.push({
                            path: field,
                            message: `String too short (min: ${rules.minLength})`,
                            expected: `length >= ${rules.minLength}`,
                            received: `length ${value.length}`,
                        })
                    }
                    if (
                        rules.maxLength !== undefined &&
                        value.length > rules.maxLength
                    ) {
                        errors.push({
                            path: field,
                            message: `String too long (max: ${rules.maxLength})`,
                            expected: `length <= ${rules.maxLength}`,
                            received: `length ${value.length}`,
                        })
                    }
                    if (rules.pattern) {
                        const regex = new RegExp(rules.pattern)
                        if (!regex.test(value)) {
                            errors.push({
                                path: field,
                                message: 'String does not match pattern',
                                expected: rules.pattern,
                                received: value,
                            })
                        }
                    }
                }

                if (rules.type === 'number' && typeof value === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        errors.push({
                            path: field,
                            message: `Number too small (min: ${rules.min})`,
                            expected: `>= ${rules.min}`,
                            received: String(value),
                        })
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        errors.push({
                            path: field,
                            message: `Number too large (max: ${rules.max})`,
                            expected: `<= ${rules.max}`,
                            received: String(value),
                        })
                    }
                }

                if (rules.type === 'array' && Array.isArray(value)) {
                    if (
                        rules.minLength !== undefined &&
                        value.length < rules.minLength
                    ) {
                        errors.push({
                            path: field,
                            message: `Array too short (min: ${rules.minLength})`,
                            expected: `length >= ${rules.minLength}`,
                            received: `length ${value.length}`,
                        })
                    }
                    if (
                        rules.maxLength !== undefined &&
                        value.length > rules.maxLength
                    ) {
                        errors.push({
                            path: field,
                            message: `Array too long (max: ${rules.maxLength})`,
                            expected: `length <= ${rules.maxLength}`,
                            received: `length ${value.length}`,
                        })
                    }
                }
            }

            if (args.strict) {
                for (const key of Object.keys(dataObj)) {
                    if (!(key in args.schema)) {
                        warnings.push({
                            path: key,
                            message: 'Unknown field not in schema',
                        })
                    }
                }
            }

            const result: SchemaValidationResult = {
                valid: errors.length === 0,
                errors,
                warnings,
                timestamp: new Date().toISOString(),
            }
            voltlogger.info(
                `Schema validation: ${result.valid ? 'valid' : 'invalid'}`,
                { operationId: context?.operationId }
            )
            return result
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Schema validation failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to validate schema: ${errorMessage}`)
        }
    },
})

/**
 * Aggregates data by grouping and computing statistics
 */
export const aggregateDataTool = createTool({
    name: 'aggregate_data',
    description:
        'Groups data by a specified field and computes statistics (count, sum, average, min, max).',
    tags: ['data', 'aggregation', 'stats'],
    parameters: z.object({
        data: z
            .array(z.record(z.string(), z.any()))
            .describe('Array of data objects to aggregate'),
        groupBy: z.string().describe('Field name to group by'),
        aggregateField: z
            .string()
            .optional()
            .describe('Numeric field to compute statistics on'),
        computeStats: z
            .array(z.enum(['count', 'sum', 'average', 'min', 'max']))
            .default(['count'])
            .describe('Statistics to compute'),
    }),
    outputSchema: z.object({
        groupBy: z.string(),
        groups: z.array(
            z.object({
                key: z.string(),
                count: z.number(),
                sum: z.number().optional(),
                average: z.number().optional(),
                min: z.number().optional(),
                max: z.number().optional(),
            })
        ),
        statistics: z.object({
            totalRecords: z.number(),
            groupCount: z.number(),
            computedAt: z.iso.datetime(),
        }),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { data: unknown[]; groupBy: string }
            voltlogger.info('aggregate_data: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                recordCount: params.data.length,
                groupBy: params.groupBy,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('aggregate_data: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('aggregate_data: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info(`Aggregating data by ${args.groupBy}`, {
                operationId: context?.operationId,
            })

            const groupedData = new Map<string, unknown[]>()
            for (const item of args.data) {
                const key = String(item[args.groupBy] ?? 'undefined')
                if (!groupedData.has(key)) {
                    groupedData.set(key, [])
                }
                groupedData.get(key)!.push(item)
            }

            const groups: DataAggregation['groups'] = []
            for (const [key, items] of groupedData) {
                const group: DataAggregation['groups'][0] = {
                    key,
                    count: items.length,
                }

                if (args.aggregateField) {
                    const values = items
                        .map(
                            (item) =>
                                (item as Record<string, unknown>)[
                                    args.aggregateField!
                                ]
                        )
                        .filter((v): v is number => typeof v === 'number')

                    if (values.length > 0) {
                        if (args.computeStats.includes('sum')) {
                            group.sum = values.reduce((a, b) => a + b, 0)
                        }
                        if (args.computeStats.includes('average')) {
                            group.average =
                                values.reduce((a, b) => a + b, 0) /
                                values.length
                        }
                        if (args.computeStats.includes('min')) {
                            group.min = Math.min(...values)
                        }
                        if (args.computeStats.includes('max')) {
                            group.max = Math.max(...values)
                        }
                    }
                }
                groups.push(group)
            }

            const result: DataAggregation = {
                groupBy: args.groupBy,
                groups,
                statistics: {
                    totalRecords: args.data.length,
                    groupCount: groups.length,
                    computedAt: new Date().toISOString(),
                },
            }

            voltlogger.info(`Aggregation complete: ${groups.length} groups`, {
                operationId: context?.operationId,
            })
            return result
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Data aggregation failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to aggregate data: ${errorMessage}`)
        }
    },
})

/**
 * Cleans data by handling missing values and inconsistencies
 */
export const cleanDataTool = createTool({
    name: 'clean_data',
    description:
        'Cleans data by handling missing values, trimming strings, removing duplicates, and fixing inconsistencies.',
    tags: ['data', 'cleaning', 'processing'],
    parameters: z.object({
        data: z
            .array(z.record(z.string(), z.any()))
            .describe('Array of data objects to clean'),
        removeNulls: z
            .boolean()
            .default(true)
            .describe('Remove records with null/undefined values'),
        trimStrings: z
            .boolean()
            .default(true)
            .describe('Trim whitespace from string values'),
        fillMissing: z
            .record(z.string(), z.any())
            .optional()
            .describe('Default values to fill for missing fields'),
        removeDuplicates: z
            .boolean()
            .default(false)
            .describe('Remove duplicate records'),
        duplicateKey: z
            .string()
            .optional()
            .describe('Field to use for duplicate detection'),
    }),
    outputSchema: z.object({
        original: z.array(z.unknown()),
        cleaned: z.array(z.unknown()),
        removedCount: z.number(),
        modifiedCount: z.number(),
        changes: z.array(
            z.object({
                index: z.number(),
                field: z.string(),
                action: z.enum(['removed', 'filled', 'trimmed', 'converted']),
                oldValue: z.unknown().optional(),
                newValue: z.unknown().optional(),
            })
        ),
        timestamp: z.iso.datetime(),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            const params = args as { data: unknown[] }
            voltlogger.info('clean_data: start', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                recordCount: params.data.length,
            })
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error('clean_data: error', {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error:
                        error instanceof Error ? error.message : 'Tool error',
                })
                return undefined
            }
            voltlogger.info('clean_data: end', {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            })
            return undefined
        },
    },
    execute: (args, context?: ToolExecuteOptions) => {
        if (context && context.isActive !== true) {
            throw new Error('Operation has been cancelled')
        }

        try {
            voltlogger.info('Cleaning data', {
                operationId: context?.operationId,
            })

            const changes: CleanedData['changes'] = []
            let cleaned = [...args.data]
            const seenKeys = new Set<string>()

            cleaned = cleaned.map((item, index) => {
                const newItem = { ...item }

                if (args.trimStrings) {
                    for (const key in newItem) {
                        if (typeof newItem[key] === 'string') {
                            const trimmed = newItem[key].trim()
                            if (trimmed !== newItem[key]) {
                                changes.push({
                                    index,
                                    field: key,
                                    action: 'trimmed',
                                    oldValue: newItem[key],
                                    newValue: trimmed,
                                })
                                newItem[key] = trimmed
                            }
                        }
                    }
                }

                if (args.fillMissing) {
                    for (const [key, defaultValue] of Object.entries(
                        args.fillMissing
                    )) {
                        if (
                            newItem[key] === undefined ||
                            newItem[key] === null ||
                            newItem[key] === ''
                        ) {
                            changes.push({
                                index,
                                field: key,
                                action: 'filled',
                                oldValue: newItem[key],
                                newValue: defaultValue,
                            })
                            // Type-safe assignment: only assign if defaultValue is a valid JSON-serializable type
                            if (
                                defaultValue === null ||
                                typeof defaultValue === 'string' ||
                                typeof defaultValue === 'number' ||
                                typeof defaultValue === 'boolean' ||
                                Array.isArray(defaultValue) ||
                                (typeof defaultValue === 'object' &&
                                    defaultValue !== null)
                            ) {
                                // Explicit type assertion since we've validated the type above
                                newItem[key] = defaultValue as
                                    | string
                                    | number
                                    | boolean
                                    | null
                                    | unknown[]
                                    | Record<string, unknown>
                            }
                        }
                    }
                }

                return newItem
            })

            if (args.removeNulls) {
                const beforeCount = cleaned.length
                cleaned = cleaned.filter((item, index) => {
                    const hasNull = Object.values(item).some(
                        (v) => v === null || v === undefined
                    )
                    if (hasNull) {
                        changes.push({
                            index,
                            field: '*',
                            action: 'removed',
                        })
                    }
                    return !hasNull
                })
                voltlogger.debug(
                    `Removed ${beforeCount - cleaned.length} records with null values`
                )
            }

            if (args.removeDuplicates) {
                const beforeCount = cleaned.length
                cleaned = cleaned.filter((item, index) => {
                    const key = args.duplicateKey
                        ? String(item[args.duplicateKey])
                        : JSON.stringify(item)
                    if (seenKeys.has(key)) {
                        changes.push({
                            index,
                            field: args.duplicateKey ?? '*',
                            action: 'removed',
                        })
                        return false
                    }
                    seenKeys.add(key)
                    return true
                })
                voltlogger.debug(
                    `Removed ${beforeCount - cleaned.length} duplicate records`
                )
            }

            const result: CleanedData = {
                original: args.data,
                cleaned,
                removedCount: args.data.length - cleaned.length,
                modifiedCount: changes.filter((c) => c.action !== 'removed')
                    .length,
                changes,
                timestamp: new Date().toISOString(),
            }

            voltlogger.info(
                `Data cleaning complete: ${result.removedCount} removed, ${result.modifiedCount} modified`,
                { operationId: context?.operationId }
            )
            return result
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            voltlogger.error(`Data cleaning failed: ${errorMessage}`, {
                operationId: context?.operationId,
            })
            throw new Error(`Failed to clean data: ${errorMessage}`)
        }
    },
})

// ============================================================================
// Toolkit Export
// ============================================================================

export const dataProcessingToolkit: Toolkit = createToolkit({
    name: 'data_processing_toolkit',
    description:
        'Comprehensive data processing toolkit for transforming, validating, and normalizing various data formats.',
    instructions: `
Use these data processing tools to transform and validate data:

1. **normalize_data**: Flatten nested JSON structures into single-level objects with dot notation keys.
2. **detect_format**: Auto-detect data format (JSON, CSV, XML, YAML) with confidence scoring.
3. **convert_format**: Convert data between different formats with validation.
4. **validate_schema**: Validate data against a schema with detailed error reporting.
5. **aggregate_data**: Group data and compute statistics (count, sum, average, min, max).
6. **clean_data**: Clean data by handling missing values, trimming strings, removing duplicates.

Tips:
- Always detect format before converting unknown data
- Use schema validation to ensure data integrity before processing
- Normalize nested data before aggregation for consistent results
- Clean data before analysis to ensure accurate statistics
  `,
    addInstructions: true,
    tools: [
        normalizeDataTool,
        detectFormatTool,
        convertFormatTool,
        validateSchemaTool,
        aggregateDataTool,
        cleanDataTool,
    ] as unknown as Tool[],
})

// Export individual tools for direct use
export {
    aggregateDataTool as aggregate_data,
    cleanDataTool as clean_data,
    convertFormatTool as convert_format,
    detectFormatTool as detect_format,
    normalizeDataTool as normalize_data,
    validateSchemaTool as validate_schema,
}
