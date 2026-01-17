import { createTool, createToolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"
import { XMLParser, XMLBuilder } from "fast-xml-parser"
import ConvertCsvToJson from "convert-csv-to-json"

export const csvToJsonTool = createTool({
  name: "csv_to_json",
  description: "Convert CSV data to JSON format. Supports custom delimiters and field mapping.",
  parameters: z.object({
    csvData: z.string().describe("The CSV data as a string"),
    delimiter: z.string().default(",").describe("CSV delimiter character (comma, semicolon, tab, etc.)"),
    fieldDelimiter: z.string().optional().describe("Field delimiter if different from main delimiter"),
    skipHeader: z.boolean().default(false).describe("Skip the first row if it contains headers"),
    headers: z.array(z.string()).optional().describe("Custom headers to use instead of first row"),
    trim: z.boolean().default(true).describe("Trim whitespace from fields"),
  }),
  execute: (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Converting CSV to JSON (${args.csvData.length} characters)`)

    try {
      let result: Array<Record<string, unknown>>

      if (args.delimiter === ",") {
        // Use convert-csv-to-json for comma-separated
        const raw = ConvertCsvToJson.csvStringToJson(args.csvData) as unknown
        if (!Array.isArray(raw)) {
          throw new Error("CSV parsing did not return an array")
        }

        result = raw.map((item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            const obj: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
              obj[k] = v
            }
            return obj
          }
          return {}
        })
      } else {
        // For other delimiters, split manually
        const lines = args.csvData.trim().split("\n")
        const dataLines = args.skipHeader ? lines.slice(1) : lines
        const headers = args.headers ?? (args.skipHeader ? [] : lines[0]?.split(args.delimiter).map(h => h.trim()))

        result = dataLines.map(line => {
          const values = line.split(args.delimiter)
          const obj: Record<string, unknown> = {}

          headers.forEach((header, index) => {
            let value = values[index] || ""
            if (args.trim) {
              value = value.trim()
            }
            obj[header] = value
          })

          return obj
        })
      }

      voltlogger.info(`Converted ${result.length} rows`)

      return {
        data: result,
        rowCount: result.length,
        headers: args.headers ?? (result[0] ? Object.keys(result[0]) : []),
        delimiter: args.delimiter,
      }
    } catch (error) {
      voltlogger.error(`CSV to JSON conversion failed: ${String(error)}`)
      throw new Error(`Failed to convert CSV to JSON: ${String(error)}`)
    }
  },
})

export const jsonToCsvTool = createTool({
  name: "json_to_csv",
  description: "Convert JSON data to CSV format. Supports custom delimiters and field selection.",
  parameters: z.object({
    jsonData: z.array(z.record(z.string(), z.unknown())).describe("Array of JSON objects to convert"),
    delimiter: z.string().default(",").describe("CSV delimiter character"),
    headers: z.array(z.string()).optional().describe("Custom headers (uses object keys if not provided)"),
    includeHeaders: z.boolean().default(true).describe("Include headers in output"),
  }),
  execute: (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Converting JSON to CSV (${args.jsonData.length} objects)`)

    try {
      if (args.jsonData.length === 0) {
        return {
          csv: args.includeHeaders && args.headers ? args.headers.join(args.delimiter) : "",
          rowCount: 0,
          headers: args.headers ?? [],
        }
      }

      // Determine headers
      const headers = args.headers ?? Object.keys(args.jsonData[0])

      // Create CSV rows
      const rows = args.jsonData.map(obj => {
        return headers.map(header => {
          const rawValue: unknown = obj[header]
          // Convert values to safe strings for CSV output (avoid '[object Object]')
          let stringValue: string
          stringValue = safeStringify(rawValue)

          // Escape delimiters and quotes in values
          if (stringValue.includes(args.delimiter) || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(args.delimiter)
      })

      // Add headers if requested
      if (args.includeHeaders && headers.length > 0) {
        const headerRow = headers.join(args.delimiter)
        rows.unshift(headerRow)
      }

      const csvOutput = rows.join("\n")

      voltlogger.info(`Converted ${args.jsonData.length} objects to CSV`)

      return {
        csv: csvOutput,
        rowCount: args.jsonData.length,
        headers,
        delimiter: args.delimiter,
      }
    } catch (error) {
      voltlogger.error(`JSON to CSV conversion failed: ${String(error)}`)
      throw new Error(`Failed to convert JSON to CSV: ${String(error)}`)
    }
  },
})

export const xmlParseTool = createTool({
  name: "xml_parse",
  description: "Parse XML data into JavaScript objects. Supports various XML formats and parsing options.",
  parameters: z.object({
    xmlData: z.string().describe("The XML data as a string"),
    ignoreAttributes: z.boolean().default(false).describe("Ignore XML attributes"),
    attributeNamePrefix: z.string().default("@_").describe("Prefix for attribute names"),
    textNodeName: z.string().default("#text").describe("Name for text nodes"),
    ignoreNameSpace: z.boolean().default(false).describe("Ignore XML namespaces"),
    allowBooleanAttributes: z.boolean().default(false).describe("Allow boolean attributes"),
    parseNodeValue: z.boolean().default(true).describe("Parse node values"),
    parseAttributeValue: z.boolean().default(true).describe("Parse attribute values"),
  }),
  execute: (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Parsing XML (${args.xmlData.length} characters)`)

    try {
      const parser = new XMLParser({
        ignoreAttributes: args.ignoreAttributes,
        attributeNamePrefix: args.attributeNamePrefix,
        textNodeName: args.textNodeName,
        allowBooleanAttributes: args.allowBooleanAttributes,
        parseAttributeValue: args.parseAttributeValue,
      })

      const result: unknown = parser.parse(args.xmlData)

      voltlogger.info(`Successfully parsed XML`)

      return {
        data: result,
        options: {
          ignoreAttributes: args.ignoreAttributes,
          attributeNamePrefix: args.attributeNamePrefix,
          textNodeName: args.textNodeName,
        },
      }
    } catch (error) {
      voltlogger.error(`XML parsing failed: ${String(error)}`)
      throw new Error(`Failed to parse XML: ${String(error)}`)
    }
  },
})

export const xmlBuildTool = createTool({
  name: "xml_build",
  description: "Convert JavaScript objects to XML format. Supports custom formatting options.",
  parameters: z.object({
    jsonData: z.record(z.string(), z.any()).describe("JavaScript object to convert to XML"),
    format: z.boolean().default(true).describe("Pretty format the XML output"),
    indentBy: z.string().default("  ").describe("Indentation string for pretty formatting"),
    suppressEmptyNode: z.boolean().default(false).describe("Suppress empty nodes"),
    suppressBooleanAttributes: z.boolean().default(false).describe("Suppress boolean attributes"),
    ignoreAttributes: z.boolean().default(false).describe("Ignore attributes during building"),
    attributeNamePrefix: z.string().default("@_").describe("Prefix for attribute names"),
  }),
  execute: (args, context) => {
    if (!context?.isActive) {
      throw new Error("Operation has been cancelled")
    }

    voltlogger.info(`Building XML from object`)

    try {
      const builder = new XMLBuilder({
        format: args.format,
        indentBy: args.indentBy,
        suppressEmptyNode: args.suppressEmptyNode,
        suppressBooleanAttributes: args.suppressBooleanAttributes,
        ignoreAttributes: args.ignoreAttributes,
        attributeNamePrefix: args.attributeNamePrefix,
      })

      const xmlOutput = builder.build(args.jsonData)

      voltlogger.info(`Successfully built XML`)

      return {
        xml: xmlOutput,
        options: {
          format: args.format,
          indentBy: args.indentBy,
        },
      }
    } catch (error) {
      voltlogger.error(`XML building failed: ${String(error)}`)
      throw new Error(`Failed to build XML: ${String(error)}`)
    }
  },
})

export const dataConversionToolkit = createToolkit({
  name: "data_conversion_toolkit",
  description: "Tools for converting between different data formats including CSV, JSON, and XML.",
  instructions: `Use these tools to convert between CSV, JSON, and XML formats. The CSV tools support custom delimiters and headers. XML tools use fast-xml-parser for efficient parsing and building. Always validate your data before conversion.`,
  addInstructions: true,
  tools: [csvToJsonTool, jsonToCsvTool, xmlParseTool, xmlBuildTool],
})

// Extracted to module scope to avoid recreating per-iteration and to avoid shadowing outer `obj`
// Avoid default '[object Object]' from String(obj): use robust JSON stringify with circular handling
const safeStringify = (value: unknown): string => {
  const seen = new WeakSet<object>()
  try {
    return JSON.stringify(value, (_k: string, v: unknown) => {
      if (v && typeof v === "object") {
        const objVal = v // Avoid shadowing outer `obj` (ESLint no-shadow)
        if (seen.has(objVal)) {return "[Circular]"}
        seen.add(objVal)
      }
      if (typeof v === "function" || typeof v === "symbol") {return String(v)}
      return v
    }) ?? String(value)
  } catch {
    try {
      const seen2 = new WeakSet<object>()
      return JSON.stringify(value, (_k, v: unknown) => {
        if (v && typeof v === "object") {
          const objVal = v // Avoid shadowing outer `obj`
          if (seen2.has(objVal)) {return "[Circular]"}
          seen2.add(objVal)
        }
        return v
      }) ?? String(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
}
