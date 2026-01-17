import { createTool, createToolkit, type Toolkit } from "@voltagent/core"
import { randomUUID } from "crypto"
import { z } from "zod"
import { voltlogger } from "../config/logger.js"

// --- Interfaces ---

export interface GraphNode {
  id: string
  label: string
  type: string
  properties: Record<string, unknown>
  createdAt: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relationship: string
  properties: Record<string, unknown>
  weight: number
  createdAt: string
}

export interface KnowledgeGraph {
  id: string
  name: string
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  adjacencyList: Map<string, Set<string>>
  createdAt: string
  updatedAt: string
}

export interface GraphStorage {
  get(id: string): Promise<KnowledgeGraph | undefined>
  save(graph: KnowledgeGraph): Promise<void>
  delete(id: string): Promise<void>
  list(): Promise<string[]>
}

export interface EntityInput {
  id: string
  label: string
  type: string
  properties?: Record<string, unknown>
}

// --- Implementations ---

export class InMemoryGraphStorage implements GraphStorage {
  private graphs = new Map<string, KnowledgeGraph>()

  // eslint-disable-next-line @typescript-eslint/require-await
  async get(id: string): Promise<KnowledgeGraph | undefined> {
    return this.graphs.get(id)
  }

  async save(graph: KnowledgeGraph): Promise<void> {
    this.graphs.set(graph.id, graph)
  }

  async delete(id: string): Promise<void> {
    this.graphs.delete(id)
  }

  async list(): Promise<string[]> {
    return Array.from(this.graphs.keys())
  }
}

export class KnowledgeGraphService {
  constructor(private storage: GraphStorage = new InMemoryGraphStorage()) { }

  private createGraphId(): string {
    return `graph_${randomUUID()}`
  }

  private createEdgeId(): string {
    return `edge_${randomUUID()}`
  }

  async createGraph(args: { name: string; entities?: EntityInput[] }, context?: any) {
    voltlogger.info(`Creating knowledge graph: ${args.name}`, { operationId: context?.operationId })

    const graphId = this.createGraphId()
    const now = new Date().toISOString()

    const graph: KnowledgeGraph = {
      id: graphId,
      name: args.name,
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      createdAt: now,
      updatedAt: now,
    }

    if (args.entities) {
      for (const entity of args.entities) {
        const node: GraphNode = {
          id: entity.id,
          label: entity.label,
          type: entity.type,
          properties: entity.properties ?? {},
          createdAt: now,
        }
        graph.nodes.set(entity.id, node)
        graph.adjacencyList.set(entity.id, new Set())
      }
    }

    await this.storage.save(graph)

    voltlogger.info(`Created graph ${graphId} with ${graph.nodes.size} nodes`, { operationId: context?.operationId })

    return {
      graphId,
      name: args.name,
      nodeCount: graph.nodes.size,
      edgeCount: 0,
      createdAt: now,
    }
  }

  async addRelationship(args: {
    graphId: string
    source: EntityInput
    target: EntityInput
    relationship: string
    properties?: Record<string, unknown>
    weight: number
    bidirectional: boolean
  }, context?: any) {
    const graph = await this.storage.get(args.graphId)
    if (!graph) {
      throw new Error(`Graph not found: ${args.graphId}`)
    }

    voltlogger.info(`Adding relationship: ${args.source.id} -[${args.relationship}]-> ${args.target.id}`, { operationId: context?.operationId })

    const now = new Date().toISOString()

    // Add source node if not exists
    if (!graph.nodes.has(args.source.id)) {
      graph.nodes.set(args.source.id, {
        id: args.source.id,
        label: args.source.label,
        type: args.source.type,
        properties: args.source.properties ?? {},
        createdAt: now,
      })
      graph.adjacencyList.set(args.source.id, new Set())
    }

    // Add target node if not exists
    if (!graph.nodes.has(args.target.id)) {
      graph.nodes.set(args.target.id, {
        id: args.target.id,
        label: args.target.label,
        type: args.target.type,
        properties: args.target.properties ?? {},
        createdAt: now,
      })
      graph.adjacencyList.set(args.target.id, new Set())
    }

    // Create edge
    const edgeId = this.createEdgeId()
    const edge: GraphEdge = {
      id: edgeId,
      source: args.source.id,
      target: args.target.id,
      relationship: args.relationship,
      properties: args.properties ?? {},
      weight: args.weight,
      createdAt: now,
    }
    graph.edges.set(edgeId, edge)

    // Update adjacency list
    graph.adjacencyList.get(args.source.id)!.add(args.target.id)
    if (args.bidirectional) {
      graph.adjacencyList.get(args.target.id)!.add(args.source.id)
    }

    graph.updatedAt = now
    await this.storage.save(graph)

    return {
      success: true,
      edgeId,
      graphId: args.graphId,
      nodeCount: graph.nodes.size,
      edgeCount: graph.edges.size,
      timestamp: now,
    }
  }

  async queryGraph(args: {
    graphId: string
    queryType: "path" | "neighbors" | "cluster"
    startNode: string
    endNode?: string
    maxDepth: number
  }, context?: any) {
    const graph = await this.storage.get(args.graphId)
    if (!graph) {
      throw new Error(`Graph not found: ${args.graphId}`)
    }

    voltlogger.info(`Querying graph: ${args.queryType} from ${args.startNode}`, { })

    if (args.queryType === "path") {
      if (!args.endNode) {
        throw new Error("endNode is required for path queries")
      }
      const paths = this.findPath(graph, args.startNode, args.endNode, args.maxDepth)
      return {
        queryType: "path",
        startNode: args.startNode,
        endNode: args.endNode,
        pathCount: paths.length,
        paths: paths.map(p => p.map(n => ({ id: n.id, label: n.label, type: n.type }))),
        timestamp: new Date().toISOString(),
      }
    }

    if (args.queryType === "neighbors") {
      const neighbors = this.getNeighbors(graph, args.startNode, args.maxDepth)
      return {
        queryType: "neighbors",
        startNode: args.startNode,
        depth: args.maxDepth,
        neighborCount: neighbors.length,
        neighbors: neighbors.map(n => ({ id: n.id, label: n.label, type: n.type, properties: n.properties })),
        timestamp: new Date().toISOString(),
      }
    }

    // cluster query
    const communities = this.detectCommunities(graph)
    const cluster = communities.find(c => c.includes(args.startNode)) ?? []
    return {
      queryType: "cluster",
      startNode: args.startNode,
      clusterSize: cluster.length,
      clusterNodes: cluster.map(id => {
        const n = graph.nodes.get(id)!
        return { id: n.id, label: n.label, type: n.type }
      }),
      timestamp: new Date().toISOString(),
    }
  }

  async analyzeGraph(args: {
    graphId: string
    analysisType: "centrality" | "communities" | "anomalies" | "statistics"
  }, context?: any) {
    const graph = await this.storage.get(args.graphId)
    if (!graph) {
      throw new Error(`Graph not found: ${args.graphId}`)
    }

    voltlogger.info(`Analyzing graph: ${args.analysisType}`, )

    if (args.analysisType === "centrality") {
      const centrality = this.calculateCentrality(graph)
      const sorted = Array.from(centrality.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, score]) => {
          const node = graph.nodes.get(id)!
          return { id, label: node.label, type: node.type, centralityScore: score }
        })

      return {
        analysisType: "centrality",
        topNodes: sorted,
        totalNodes: graph.nodes.size,
        timestamp: new Date().toISOString(),
      }
    }

    if (args.analysisType === "communities") {
      const communities = this.detectCommunities(graph)
      return {
        analysisType: "communities",
        communityCount: communities.length,
        communities: communities.map((c, i) => ({
          id: i,
          size: c.length,
          members: c.slice(0, 10).map(id => {
            const n = graph.nodes.get(id)!
            return { id: n.id, label: n.label, type: n.type }
          }),
        })),
        timestamp: new Date().toISOString(),
      }
    }

    if (args.analysisType === "anomalies") {
      const isolated: GraphNode[] = []
      const hubs: Array<{ node: GraphNode; degree: number }> = []
      const avgDegree = graph.edges.size * 2 / Math.max(graph.nodes.size, 1)

      for (const [nodeId, node] of graph.nodes) {
        const degree = graph.adjacencyList.get(nodeId)?.size ?? 0
        if (degree === 0) {
          isolated.push(node)
        } else if (degree > avgDegree * 2) {
          hubs.push({ node, degree })
        }
      }

      return {
        analysisType: "anomalies",
        isolatedNodes: isolated.map(n => ({ id: n.id, label: n.label, type: n.type })),
        hubNodes: hubs.sort((a, b) => b.degree - a.degree).slice(0, 10).map(h => ({
          id: h.node.id,
          label: h.node.label,
          type: h.node.type,
          degree: h.degree,
        })),
        averageDegree: avgDegree,
        timestamp: new Date().toISOString(),
      }
    }

    // statistics
    const nodeTypes = new Map<string, number>()
    for (const [, node] of graph.nodes) {
      nodeTypes.set(node.type, (nodeTypes.get(node.type) ?? 0) + 1)
    }

    const relationshipTypes = new Map<string, number>()
    for (const [, edge] of graph.edges) {
      relationshipTypes.set(edge.relationship, (relationshipTypes.get(edge.relationship) ?? 0) + 1)
    }

    return {
      analysisType: "statistics",
      nodeCount: graph.nodes.size,
      edgeCount: graph.edges.size,
      nodeTypes: Object.fromEntries(nodeTypes),
      relationshipTypes: Object.fromEntries(relationshipTypes),
      density: graph.nodes.size > 1 ? (2 * graph.edges.size) / (graph.nodes.size * (graph.nodes.size - 1)) : 0,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
      timestamp: new Date().toISOString(),
    }
  }

  async exportGraph(args: {
    graphId: string
    format: "json" | "graphml" | "cypher"
  }, context?: any) {
    const graph = await this.storage.get(args.graphId)
    if (!graph) {
      throw new Error(`Graph not found: ${args.graphId}`)
    }

    voltlogger.info(`Exporting graph as ${args.format}`, )

    const nodes = Array.from(graph.nodes.values())
    const edges = Array.from(graph.edges.values())

    if (args.format === "json") {
      return {
        format: "json",
        data: JSON.stringify({
          id: graph.id,
          name: graph.name,
          nodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type, properties: n.properties })),
          edges: edges.map(e => ({ source: e.source, target: e.target, relationship: e.relationship, weight: e.weight, properties: e.properties })),
        }, null, 2),
        nodeCount: nodes.length,
        edgeCount: edges.length,
        timestamp: new Date().toISOString(),
      }
    }

    if (args.format === "graphml") {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n`
      xml += `  <key id="label" for="node" attr.name="label" attr.type="string"/>\n`
      xml += `  <key id="type" for="node" attr.name="type" attr.type="string"/>\n`
      xml += `  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>\n`
      xml += `  <graph id="${graph.id}" edgedefault="directed">\n`

      for (const node of nodes) {
        xml += `    <node id="${node.id}">\n`
        xml += `      <data key="label">${node.label}</data>\n`
        xml += `      <data key="type">${node.type}</data>\n`
        xml += `    </node>\n`
      }

      for (const edge of edges) {
        xml += `    <edge source="${edge.source}" target="${edge.target}">\n`
        xml += `      <data key="relationship">${edge.relationship}</data>\n`
        xml += `    </edge>\n`
      }

      xml += `  </graph>\n</graphml>`

      return { format: "graphml", data: xml, nodeCount: nodes.length, edgeCount: edges.length, timestamp: new Date().toISOString() }
    }

    // cypher
    const statements: string[] = []
    for (const node of nodes) {
      const props = JSON.stringify({ ...node.properties, label: node.label })
      statements.push(`CREATE (n:${node.type} ${props.replace(/"/g, "'")})`)
    }
    for (const edge of edges) {
      statements.push(`MATCH (a {id: '${edge.source}'}), (b {id: '${edge.target}'}) CREATE (a)-[:${edge.relationship}]->(b)`)
    }

    return { format: "cypher", data: statements.join(";\n"), statementCount: statements.length, timestamp: new Date().toISOString() }
  }

  async mergeGraphs(args: {
    graphIds: string[]
    newName?: string
    conflictResolution: "keep_first" | "keep_last" | "merge_properties"
  }, context?: any) {
    voltlogger.info(`Merging ${args.graphIds.length} graphs`, {  })

    const now = new Date().toISOString()
    const mergedId = this.createGraphId()
    const merged: KnowledgeGraph = {
      id: mergedId,
      name: args.newName ?? `Merged_${mergedId}`,
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      createdAt: now,
      updatedAt: now,
    }

    const conflicts: Array<{ nodeId: string; resolution: string }> = []

    for (const graphId of args.graphIds) {
      const graph = await this.storage.get(graphId)
      if (!graph) {
        throw new Error(`Graph not found: ${graphId}`)
      }

      // Merge nodes
      for (const [nodeId, node] of graph.nodes) {
        if (merged.nodes.has(nodeId)) {
          const existing = merged.nodes.get(nodeId)!
          if (args.conflictResolution === "keep_first") {
            conflicts.push({ nodeId, resolution: "kept_first" })
          } else if (args.conflictResolution === "keep_last") {
            merged.nodes.set(nodeId, { ...node })
            conflicts.push({ nodeId, resolution: "kept_last" })
          } else {
            // merge_properties
            merged.nodes.set(nodeId, {
              ...existing,
              properties: { ...existing.properties, ...node.properties },
            })
            conflicts.push({ nodeId, resolution: "merged_properties" })
          }
        } else {
          merged.nodes.set(nodeId, { ...node })
          merged.adjacencyList.set(nodeId, new Set())
        }
      }

      // Merge edges
      for (const [, edge] of graph.edges) {
        const newEdgeId = this.createEdgeId()
        merged.edges.set(newEdgeId, { ...edge, id: newEdgeId })
        if (merged.adjacencyList.has(edge.source)) {
          merged.adjacencyList.get(edge.source)!.add(edge.target)
        }
      }
    }

    await this.storage.save(merged)

    return {
      mergedGraphId: mergedId,
      name: merged.name,
      nodeCount: merged.nodes.size,
      edgeCount: merged.edges.size,
      conflictCount: conflicts.length,
      conflicts: conflicts.slice(0, 20),
      timestamp: now,
    }
  }

  // --- Internal Helpers ---

  private findPath(graph: KnowledgeGraph, startNodeId: string, endNodeId: string, maxDepth: number): GraphNode[][] {
    const paths: GraphNode[][] = []
    const queue: Array<{ id: string; path: string[] }> = [{ id: startNodeId, path: [startNodeId] }]

    while (queue.length > 0) {
      const { id, path } = queue.shift()!

      if (path.length > maxDepth + 1) { continue }

      if (id === endNodeId) {
        paths.push(path.map(nodeId => graph.nodes.get(nodeId)!))
        continue
      }

      const neighbors = graph.adjacencyList.get(id) ?? new Set()
      for (const neighborId of neighbors) {
        if (!path.includes(neighborId)) {
          queue.push({ id: neighborId, path: [...path, neighborId] })
        }
      }
    }

    return paths
  }

  private getNeighbors(graph: KnowledgeGraph, nodeId: string, depth: number): GraphNode[] {
    const visited = new Set<string>()
    const result = new Set<string>()
    const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }]

    while (queue.length > 0) {
      const { id, d } = queue.shift()!

      if (d > depth) { continue }
      if (visited.has(id)) { continue }
      visited.add(id)

      if (id !== nodeId) { result.add(id) }

      const neighbors = graph.adjacencyList.get(id) ?? new Set()
      for (const nid of neighbors) {
        if (!visited.has(nid)) {
          queue.push({ id: nid, d: d + 1 })
        }
      }
    }

    return Array.from(result).map(id => graph.nodes.get(id)!).filter(Boolean)
  }

  private calculateCentrality(graph: KnowledgeGraph): Map<string, number> {
    const centrality = new Map<string, number>()
    const nodeCount = graph.nodes.size

    for (const [nodeId] of graph.nodes) {
      const degree = graph.adjacencyList.get(nodeId)?.size ?? 0
      centrality.set(nodeId, nodeCount > 1 ? degree / (nodeCount - 1) : 0)
    }

    return centrality
  }

  private detectCommunities(graph: KnowledgeGraph): string[][] {
    const visited = new Set<string>()
    const communities: string[][] = []

    for (const [nodeId] of graph.nodes) {
      if (visited.has(nodeId)) { continue }

      const community: string[] = []
      const stack = [nodeId]

      while (stack.length > 0) {
        const current = stack.pop()!
        if (visited.has(current)) { continue }
        visited.add(current)
        community.push(current)

        const neighbors = graph.adjacencyList.get(current) ?? new Set()
        for (const nid of neighbors) {
          if (!visited.has(nid)) { stack.push(nid) }
        }
      }

      if (community.length > 0) { communities.push(community) }
    }

    return communities
  }

  getToolkit(): Toolkit {
    return createToolkit({
      name: "knowledge_graph_toolkit",
      description: "Build and query knowledge graphs. Create graphs, add entities and relationships, find paths, detect communities, and export in multiple formats.",
      instructions: `Use these tools to build knowledge graphs from research data:
1. create_graph - Start a new graph with optional initial entities
2. add_relationship - Add nodes and edges (creates nodes if they don't exist)
3. query_graph - Find paths between nodes, get neighbors, or find clusters
4. analyze_graph - Compute centrality, detect communities, find anomalies
5. export_graph - Export as JSON, GraphML, or Cypher statements
6. merge_graphs - Combine multiple graphs`,
      addInstructions: true,
      tools: [
        createTool({
          name: "create_graph",
          description: "Create a new knowledge graph with optional initial entities. Returns a graph ID for subsequent operations.",
          parameters: z.object({
            name: z.string().describe("Name for the knowledge graph"),
            entities: z.array(z.object({
              id: z.string(),
              label: z.string(),
              type: z.string(),
              properties: z.record(z.string(), z.any()).optional(),
            })).optional().describe("Initial entities to add to the graph"),
          }),
          execute: (args, context) => this.createGraph(args, context),
        }),
        createTool({
          name: "add_relationship",
          description: "Add entities and a relationship between them to an existing graph. Creates nodes if they don't exist.",
          parameters: z.object({
            graphId: z.string().describe("ID of the graph to modify"),
            source: z.object({
              id: z.string(),
              label: z.string(),
              type: z.string(),
              properties: z.record(z.string(), z.any()).optional(),
            }).describe("Source entity"),
            target: z.object({
              id: z.string(),
              label: z.string(),
              type: z.string(),
              properties: z.record(z.string(), z.any()).optional(),
            }).describe("Target entity"),
            relationship: z.string().describe("Type of relationship (e.g., 'works_for', 'located_in')"),
            properties: z.record(z.string(), z.any()).optional().describe("Additional properties for the edge"),
            weight: z.number().default(1).describe("Weight of the relationship"),
            bidirectional: z.boolean().default(false).describe("Whether the relationship goes both ways"),
          }),
          execute: (args, context) => this.addRelationship(args, context),
        }),
        createTool({
          name: "query_graph",
          description: "Query the graph for paths between nodes, neighbors, or clusters.",
          parameters: z.object({
            graphId: z.string().describe("ID of the graph to query"),
            queryType: z.enum(["path", "neighbors", "cluster"]).default("neighbors").describe("Type of query"),
            startNode: z.string().describe("Starting node ID"),
            endNode: z.string().optional().describe("End node ID (required for path queries)"),
            maxDepth: z.number().default(3).describe("Maximum depth for traversal"),
          }),
          execute: (args, context) => this.queryGraph(args, context),
        }),
        createTool({
          name: "analyze_graph",
          description: "Analyze graph structure - compute centrality, detect communities, or find anomalies.",
          parameters: z.object({
            graphId: z.string().describe("ID of the graph to analyze"),
            analysisType: z.enum(["centrality", "communities", "anomalies", "statistics"]).default("statistics"),
          }),
          execute: (args, context) => this.analyzeGraph(args, context),
        }),
        createTool({
          name: "export_graph",
          description: "Export graph data in various formats (JSON, GraphML, or Cypher statements).",
          parameters: z.object({
            graphId: z.string().describe("ID of the graph to export"),
            format: z.enum(["json", "graphml", "cypher"]).default("json"),
          }),
          execute: (args, context) => this.exportGraph(args, context),
        }),
        createTool({
          name: "merge_graphs",
          description: "Merge multiple graphs into a new graph, handling node conflicts.",
          parameters: z.object({
            graphIds: z.array(z.string()).min(2).describe("IDs of graphs to merge"),
            newName: z.string().optional().describe("Name for the merged graph"),
            conflictResolution: z.enum(["keep_first", "keep_last", "merge_properties"]).default("merge_properties"),
          }),
          execute: (args, context) => this.mergeGraphs(args, context),
        }),
      ],
    })
  }
}

// Export a default instance for backward compatibility or easy usage
export const knowledgeGraphService = new KnowledgeGraphService()
export const knowledgeGraphToolkit = knowledgeGraphService.getToolkit()
