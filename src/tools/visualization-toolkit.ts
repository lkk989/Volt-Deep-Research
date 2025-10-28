import { createTool, createToolkit } from "@voltagent/core"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"
import { XMLParser } from "fast-xml-parser"
// convert-csv-to-json is handled manually for better control
import svgjson from "svgjson"
import excalidrawToSvg from "excalidraw-to-svg"

// Types for visualization data
interface ChartData {
    labels: string[]
    datasets: Array<{
        label: string
        data: number[]
        backgroundColor?: string[]
        borderColor?: string[]
    }>
}

interface TableData {
    headers: string[]
    rows: Array<Record<string, string | number>>
}

interface SVGData {
    width: number
    height: number
    elements: Array<{
        type: string
        attributes: Record<string, string | number>
        content?: string
    }>
}

export const csvToJsonTool = createTool({
    name: "convert_csv_to_json",
    description: "Convert CSV data to JSON format for visualization and analysis",
    parameters: z.object({
        csvData: z.string().describe("CSV data as a string"),
        delimiter: z.string().default(",").describe("CSV delimiter (default: comma)"),
        includeHeaders: z.boolean().default(true).describe("Whether the first row contains headers"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info("Converting CSV to JSON")

        try {
            // Write CSV data to temporary processing
            const lines = args.csvData.trim().split('\n')
            if (lines.length === 0) {
                throw new Error("CSV data is empty")
            }

            let jsonData: Array<Record<string, string>>

            if (args.includeHeaders) {
                const headers = lines[0].split(args.delimiter).map(h => h.trim())
                jsonData = lines.slice(1).map(line => {
                    const values = line.split(args.delimiter).map(v => v.trim())
                    const row: Record<string, string> = {}
                    headers.forEach((header, index) => {
                        row[header] = values[index] || ""
                    })
                    return row
                })
            } else {
                jsonData = lines.map(line => {
                    const values = line.split(args.delimiter).map(v => v.trim())
                    const row: Record<string, string> = {}
                    values.forEach((value, colIndex) => {
                        row[`column_${colIndex}`] = value
                    })
                    return row
                })
            }

            const tableData: TableData = {
                headers: args.includeHeaders
                    ? lines[0].split(args.delimiter).map(h => h.trim())
                    : jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
                rows: jsonData.map(row => {
                    const processedRow: Record<string, string | number> = {}
                    Object.entries(row).forEach(([key, value]) => {
                        // Try to convert to number if possible
                        const numValue = parseFloat(value)
                        processedRow[key] = isNaN(numValue) ? value : numValue
                    })
                    return processedRow
                })
            }

            voltlogger.info(`Converted CSV with ${jsonData.length} rows and ${tableData.headers.length} columns`)

            return {
                jsonData,
                tableData,
                rowCount: jsonData.length,
                columnCount: tableData.headers.length,
                headers: tableData.headers,
            }
        } catch (error) {
            voltlogger.error(`CSV conversion failed: ${error}`)
            throw new Error(`Failed to convert CSV to JSON: ${error}`)
        }
    },
})

export const xmlToJsonTool = createTool({
    name: "convert_xml_to_json",
    description: "Convert XML data to JSON format using fast-xml-parser",
    parameters: z.object({
        xmlData: z.string().describe("XML data as a string"),
        ignoreAttributes: z.boolean().default(false).describe("Whether to ignore XML attributes"),
        attributeNamePrefix: z.string().default("@_").describe("Prefix for attribute names"),
        parseAttributeValue: z.boolean().default(true).describe("Whether to parse attribute values"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info("Converting XML to JSON")

        try {
            const parser = new XMLParser({
                ignoreAttributes: args.ignoreAttributes,
                attributeNamePrefix: args.attributeNamePrefix,
                parseAttributeValue: args.parseAttributeValue,
                parseTagValue: true,
                trimValues: true,
            })

            const jsonData = parser.parse(args.xmlData)

            // Extract structure information
            const getStructureInfo = (obj: unknown, depth = 0): unknown => {
                if (typeof obj !== 'object' || obj === null) {
                    return { type: typeof obj, value: obj }
                }

                if (Array.isArray(obj)) {
                    return {
                        type: 'array',
                        length: obj.length,
                        items: obj.length > 0 ? getStructureInfo(obj[0], depth + 1) : null
                    }
                }

                const keys = Object.keys(obj)
                return {
                    type: 'object',
                    keys: keys.length,
                    properties: depth < 2 ? keys.reduce((acc, key) => {
                        acc[key] = getStructureInfo((obj as Record<string, unknown>)[key], depth + 1)
                        return acc
                    }, {} as Record<string, unknown>) : { truncated: true }
                }
            }

            const structure = getStructureInfo(jsonData)

            voltlogger.info("Successfully converted XML to JSON")

            return {
                jsonData,
                structure,
                rootKeys: typeof jsonData === 'object' && jsonData !== null ? Object.keys(jsonData) : [],
                dataType: Array.isArray(jsonData) ? 'array' : typeof jsonData,
            }
        } catch (error) {
            voltlogger.error(`XML conversion failed: ${error}`)
            throw new Error(`Failed to convert XML to JSON: ${error}`)
        }
    },
})

export const jsonToSvgTool = createTool({
    name: "create_svg_from_json",
    description: "Create SVG visualization from JSON data - the main visualization tool",
    parameters: z.object({
        jsonData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).describe("Array of JSON objects to visualize"),
        chartType: z.enum(["bar", "line", "pie", "scatter", "area"]).default("bar").describe("Type of chart to create"),
        width: z.number().default(800).describe("SVG width in pixels"),
        height: z.number().default(600).describe("SVG height in pixels"),
        labelField: z.string().describe("Field name to use as labels"),
        valueField: z.string().describe("Field name to use as values"),
        title: z.string().optional().describe("Chart title"),
        colors: z.array(z.string()).optional().describe("Custom color palette"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info(`Creating ${args.chartType} SVG chart`)

        try {
            if (args.jsonData.length === 0) {
                throw new Error("JSON data is empty")
            }

            // Extract data for visualization
            const labels = args.jsonData.map(row => String(row[args.labelField] || ""))
            const values = args.jsonData.map(row => {
                const value = row[args.valueField]
                return typeof value === 'number' ? value : parseFloat(String(value)) || 0
            })

            const maxValue = Math.max(...values)
            const minValue = Math.min(...values)
            const padding = 60
            const chartWidth = args.width - (padding * 2)
            const chartHeight = args.height - (padding * 2)

            // Default colors
            const defaultColors = [
                "#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6",
                "#1abc9c", "#34495e", "#e67e22", "#95a5a6", "#d35400"
            ]
            const colors = args.colors || defaultColors

            let svgContent = ""

            // Create SVG based on chart type
            switch (args.chartType) {
                case "bar": {
                    const barWidth = chartWidth / labels.length * 0.8
                    const barSpacing = chartWidth / labels.length * 0.2

                    values.forEach((value, index) => {
                        const barHeight = (value / maxValue) * chartHeight
                        const x = padding + (index * (barWidth + barSpacing))
                        const y = args.height - padding - barHeight
                        const color = colors[index % colors.length]

                        svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="#333" stroke-width="1"/>`
                        svgContent += `<text x="${x + barWidth / 2}" y="${args.height - padding + 20}" text-anchor="middle" font-size="12" fill="#333">${labels[index]}</text>`
                        svgContent += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#333">${value}</text>`
                    })
                    break
                }

                case "line": {
                    const points = values.map((value, index) => {
                        const x = padding + (index / (values.length - 1)) * chartWidth
                        const y = args.height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight
                        return `${x},${y}`
                    }).join(" ")

                    svgContent += `<polyline points="${points}" fill="none" stroke="${colors[0]}" stroke-width="2"/>`

                    values.forEach((value, index) => {
                        const x = padding + (index / (values.length - 1)) * chartWidth
                        const y = args.height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight
                        svgContent += `<circle cx="${x}" cy="${y}" r="4" fill="${colors[0]}" stroke="#fff" stroke-width="2"/>`
                        svgContent += `<text x="${x}" y="${args.height - padding + 20}" text-anchor="middle" font-size="12" fill="#333">${labels[index]}</text>`
                    })
                    break
                }

                case "pie": {
                    const centerX = args.width / 2
                    const centerY = args.height / 2
                    const radius = Math.min(chartWidth, chartHeight) / 2 * 0.8
                    const total = values.reduce((sum, val) => sum + val, 0)

                    let currentAngle = 0
                    values.forEach((value, index) => {
                        const angle = (value / total) * 2 * Math.PI
                        const x1 = centerX + Math.cos(currentAngle) * radius
                        const y1 = centerY + Math.sin(currentAngle) * radius
                        const x2 = centerX + Math.cos(currentAngle + angle) * radius
                        const y2 = centerY + Math.sin(currentAngle + angle) * radius

                        const largeArcFlag = angle > Math.PI ? 1 : 0
                        const color = colors[index % colors.length]

                        svgContent += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fff" stroke-width="2"/>`

                        // Add label
                        const labelAngle = currentAngle + angle / 2
                        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
                        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)
                        svgContent += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" fill="#fff" font-weight="bold">${labels[index]}</text>`

                        currentAngle += angle
                    })
                    break
                }

                case "scatter": {
                    values.forEach((value, index) => {
                        const x = padding + (index / (values.length - 1)) * chartWidth
                        const y = args.height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight
                        const color = colors[index % colors.length]

                        svgContent += `<circle cx="${x}" cy="${y}" r="6" fill="${color}" stroke="#333" stroke-width="1"/>`
                        svgContent += `<text x="${x}" y="${args.height - padding + 20}" text-anchor="middle" font-size="12" fill="#333">${labels[index]}</text>`
                    })
                    break
                }
            }

            // Add axes and title
            const axesContent = `
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${args.height - padding}" stroke="#333" stroke-width="2"/>
        <line x1="${padding}" y1="${args.height - padding}" x2="${args.width - padding}" y2="${args.height - padding}" stroke="#333" stroke-width="2"/>
      `

            const titleContent = args.title ?
                `<text x="${args.width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">${args.title}</text>` : ""

            const fullSvg = `<svg width="${args.width}" height="${args.height}" xmlns="http://www.w3.org/2000/svg">
        ${titleContent}
        ${axesContent}
        ${svgContent}
      </svg>`

            voltlogger.info(`Created ${args.chartType} SVG with ${values.length} data points`)

            return {
                svg: fullSvg,
                chartType: args.chartType,
                dataPoints: values.length,
                dimensions: { width: args.width, height: args.height },
                dataRange: { min: minValue, max: maxValue },
            }
        } catch (error) {
            voltlogger.error(`SVG creation failed: ${error}`)
            throw new Error(`Failed to create SVG: ${error}`)
        }
    },
})

export const svgToJsonTool = createTool({
    name: "convert_svg_to_json",
    description: "Convert SVG data to JSON format for analysis and manipulation",
    parameters: z.object({
        svgData: z.string().describe("SVG data as a string"),
        extractPaths: z.boolean().default(true).describe("Whether to extract path elements"),
        extractStyles: z.boolean().default(true).describe("Whether to extract style information"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info("Converting SVG to JSON")

        try {
            // Use svgjson to convert SVG to JSON
            const jsonResult = svgjson.svg2json(args.svgData)

            // Extract SVG dimensions and basic info
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "@_",
            })

            const parsedSvg = parser.parse(args.svgData)
            const svgRoot = parsedSvg.svg || parsedSvg

            const svgData: SVGData = {
                width: parseInt(String(svgRoot["@_width"] || "0"), 10) || 0,
                height: parseInt(String(svgRoot["@_height"] || "0"), 10) || 0,
                elements: []
            }

            // Extract elements if requested
            if (args.extractPaths && jsonResult) {
                const extractElements = (obj: unknown): void => {
                    if (typeof obj !== 'object' || obj === null) {
                        return
                    }

                    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
                        if (key.startsWith('@_')) {
                            // This is an attribute
                            return
                        }

                        if (typeof value === 'object' && value !== null) {
                            const element = {
                                type: key,
                                attributes: {} as Record<string, string | number>,
                                content: undefined as string | undefined
                            }

                            // Extract attributes
                            Object.entries(value as Record<string, unknown>).forEach(([attrKey, attrValue]) => {
                                if (attrKey.startsWith('@_')) {
                                    element.attributes[attrKey.substring(2)] = attrValue as string | number
                                } else if (typeof attrValue === 'string') {
                                    element.content = attrValue
                                }
                            })

                            svgData.elements.push(element)

                            // Recursively process nested elements
                            extractElements(value)
                        }
                    })
                }

                extractElements(svgRoot)
            }

            voltlogger.info(`Converted SVG with ${svgData.elements.length} elements`)

            return {
                jsonData: jsonResult,
                svgData,
                elementCount: svgData.elements.length,
                dimensions: {
                    width: svgData.width,
                    height: svgData.height
                },
                hasStyles: args.extractStyles && svgData.elements.some(el => el.attributes.style),
            }
        } catch (error) {
            voltlogger.error(`SVG conversion failed: ${error}`)
            throw new Error(`Failed to convert SVG to JSON: ${error}`)
        }
    },
})

export const excalidrawToSvgTool = createTool({
    name: "convert_excalidraw_to_svg",
    description: "Convert Excalidraw drawing data to SVG format",
    parameters: z.object({
        excalidrawData: z.object({
            elements: z.array(z.any()).describe("Excalidraw elements array"),
            appState: z.object({
                viewBackgroundColor: z.string().optional(),
            }).passthrough().optional().describe("Excalidraw app state"),
            files: z.record(z.string(), z.any()).optional().describe("Excalidraw files"),
        }).describe("Excalidraw drawing data"),
        exportPadding: z.number().default(10).describe("Padding around the exported SVG"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info("Converting Excalidraw data to SVG")

        try {
            const svg = await excalidrawToSvg(args.excalidrawData, {
                exportPadding: args.exportPadding,
            })

            voltlogger.info(`Successfully converted Excalidraw with ${args.excalidrawData.elements.length} elements to SVG`)

            return {
                svg,
                elementCount: args.excalidrawData.elements.length,
                hasFiles: args.excalidrawData.files ? Object.keys(args.excalidrawData.files).length > 0 : false,
            }
        } catch (error) {
            voltlogger.error(`Excalidraw to SVG conversion failed: ${error}`)
            throw new Error(`Failed to convert Excalidraw to SVG: ${error}`)
        }
    },
})

export const createCustomSvgTool = createTool({
    name: "create_custom_svg",
    description: "Create custom SVG graphics with shapes, text, and styling",
    parameters: z.object({
        width: z.number().default(400).describe("SVG width in pixels"),
        height: z.number().default(300).describe("SVG height in pixels"),
        backgroundColor: z.string().optional().describe("Background color"),
        elements: z.array(z.object({
            type: z.enum(["rect", "circle", "line", "text", "path"]).describe("Element type"),
            attributes: z.record(z.string(), z.union([z.string(), z.number()])).describe("Element attributes"),
            content: z.string().optional().describe("Text content for text elements"),
        })).describe("Array of SVG elements to create"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info(`Creating custom SVG with ${args.elements.length} elements`)

        try {
            let svgContent = ""

            // Add background if specified
            if (args.backgroundColor) {
                svgContent += `<rect width="100%" height="100%" fill="${args.backgroundColor}"/>`
            }

            // Create each element
            args.elements.forEach(element => {
                const attrs = Object.entries(element.attributes)
                    .map(([key, value]) => `${key}="${value}"`)
                    .join(" ")

                switch (element.type) {
                    case "rect":
                        svgContent += `<rect ${attrs}/>`
                        break
                    case "circle":
                        svgContent += `<circle ${attrs}/>`
                        break
                    case "line":
                        svgContent += `<line ${attrs}/>`
                        break
                    case "text":
                        svgContent += `<text ${attrs}>${element.content || ""}</text>`
                        break
                    case "path":
                        svgContent += `<path ${attrs}/>`
                        break
                }
            })

            const fullSvg = `<svg width="${args.width}" height="${args.height}" xmlns="http://www.w3.org/2000/svg">
        ${svgContent}
      </svg>`

            voltlogger.info(`Created custom SVG with ${args.elements.length} elements`)

            return {
                svg: fullSvg,
                elementCount: args.elements.length,
                dimensions: { width: args.width, height: args.height },
            }
        } catch (error) {
            voltlogger.error(`Custom SVG creation failed: ${error}`)
            throw new Error(`Failed to create custom SVG: ${error}`)
        }
    },
})

export const createChartDataTool = createTool({
    name: "create_chart_data",
    description: "Create chart-ready data structure from JSON data for visualization",
    parameters: z.object({
        jsonData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).describe("Array of JSON objects"),
        labelField: z.string().describe("Field name to use as labels"),
        valueFields: z.array(z.string()).describe("Field names to use as data values"),
        chartType: z.enum(["bar", "line", "pie", "scatter"]).default("bar").describe("Type of chart to create data for"),
    }),
    execute: async (args, context) => {
        if (!context?.isActive) {
            throw new Error("Operation has been cancelled")
        }

        voltlogger.info(`Creating ${args.chartType} chart data`)

        try {
            if (args.jsonData.length === 0) {
                throw new Error("JSON data is empty")
            }

            // Extract labels
            const labels = args.jsonData.map(row => String(row[args.labelField] || ""))

            // Create datasets for each value field
            const datasets = args.valueFields.map((field, index) => {
                const data = args.jsonData.map(row => {
                    const value = row[field]
                    return typeof value === 'number' ? value : parseFloat(String(value)) || 0
                })

                // Generate colors based on chart type and field index
                const colors = args.chartType === 'pie'
                    ? data.map((_, i) => `hsl(${(i * 360) / data.length}, 70%, 50%)`)
                    : [`hsl(${index * 60}, 70%, 50%)`]

                return {
                    label: field,
                    data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('50%', '40%')),
                }
            })

            const chartData: ChartData = {
                labels,
                datasets
            }

            // Calculate statistics
            const totalDataPoints = datasets.reduce((sum, dataset) => sum + dataset.data.length, 0)
            const dataRanges = datasets.map(dataset => ({
                field: dataset.label,
                min: Math.min(...dataset.data),
                max: Math.max(...dataset.data),
                avg: dataset.data.reduce((sum, val) => sum + val, 0) / dataset.data.length
            }))

            voltlogger.info(`Created chart data with ${labels.length} labels and ${datasets.length} datasets`)

            return {
                chartData,
                chartType: args.chartType,
                labelCount: labels.length,
                datasetCount: datasets.length,
                totalDataPoints,
                dataRanges,
                isValid: labels.length > 0 && datasets.length > 0,
            }
        } catch (error) {
            voltlogger.error(`Chart data creation failed: ${error}`)
            throw new Error(`Failed to create chart data: ${error}`)
        }
    },
})

export const visualizationToolkit = createToolkit({
    name: "visualization_toolkit",
    description: "Comprehensive visualization toolkit for creating SVG charts and graphics from data.",
    instructions: `Use these tools to create visualizations and work with data formats:

**SVG Creation Tools (Primary):**
1. **create_svg_from_json**: Create SVG charts (bar, line, pie, scatter, area) from JSON data - the main visualization tool
2. **create_custom_svg**: Create custom SVG graphics with shapes, text, and styling
3. **convert_excalidraw_to_svg**: Convert Excalidraw drawing data to SVG format

**Data Conversion Tools:**
4. **convert_csv_to_json**: Convert CSV data to JSON format for visualization
5. **convert_xml_to_json**: Convert XML to JSON using fast-xml-parser
6. **convert_svg_to_json**: Convert existing SVG to JSON for analysis
7. **create_chart_data**: Transform JSON data into chart-ready format

The primary purpose is to CREATE visualizations as SVG from your data. Use create_svg_from_json for standard charts and create_custom_svg for custom graphics.`,
    addInstructions: true,
    tools: [jsonToSvgTool, createCustomSvgTool, excalidrawToSvgTool, csvToJsonTool, xmlToJsonTool, svgToJsonTool, createChartDataTool],
})
