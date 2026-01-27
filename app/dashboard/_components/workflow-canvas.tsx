'use client'

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Canvas } from "@/components/ai-elements/canvas"
import { Node, NodeHeader, NodeTitle, NodeDescription, NodeContent } from "@/components/ai-elements/node"
import { Edge } from "@/components/ai-elements/edge"
import { Connection } from "@/components/ai-elements/connection"
import { Panel } from "@/components/ai-elements/panel"
import { Controls } from "@/components/ai-elements/controls"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { Node as FlowNode, Edge as FlowEdge } from "@xyflow/react"

const VOLTAGENT_API_URL =
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_VOLTAGENT_URL) ||
    process.env.NEXT_PUBLIC_VOLTAGENT_URL ||
    'http://localhost:3141'

interface WorkflowStep {
    id: string
    name: string
    type: string
    purpose?: string
}

interface WorkflowCanvasProps {
    workflowId: string
    events?: any[]
}

const nodeTypes = {
    workflow: ({ data }: { data: any }) => (
        <Node handles={{ target: true, source: true }}>
            <NodeHeader>
                <div className="flex items-center justify-between w-full">
                    <NodeTitle>{data.label}</NodeTitle>
                    {data.status && (
                        <Badge variant={data.status === "success" ? "default" : "secondary"}>
                            {data.status}
                        </Badge>
                    )}
                </div>
                {data.description && (
                    <NodeDescription>{data.description}</NodeDescription>
                )}
            </NodeHeader>
            {data.type && (
                <NodeContent>
                    <span className="text-xs text-muted-foreground">{data.type}</span>
                </NodeContent>
            )}
        </Node>
    ),
}

const edgeTypes = {
    default: Edge.Animated,
}

export function WorkflowCanvas({ workflowId, events = [] }: WorkflowCanvasProps) {
    const [workflow, setWorkflow] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWorkflow()
    }, [workflowId])

    const fetchWorkflow = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${VOLTAGENT_API_URL}/workflows/${workflowId}`)
            const workflow = await response.json()
            setWorkflow(workflow)
        } catch (error) {
            console.error("Failed to fetch workflow:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        )
    }

    if (!workflow) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">Failed to load workflow</p>
            </Card>
        )
    }

    const steps = workflow.steps || []
    const nodes: FlowNode[] = steps.map((step: WorkflowStep, index: number) => {
        const eventForStep = events.find((e) => e.from === step.id || e.from === step.name)
        const status = eventForStep?.status || "pending"

        return {
            id: step.id,
            type: "workflow",
            position: { x: 100 + index * 250, y: 100 },
            data: {
                label: step.name,
                status,
                description: step.purpose,
                type: step.type,
            },
        }
    })

    const edges: FlowEdge[] = steps.slice(0, -1).map((step: WorkflowStep, index: number) => ({
        id: `edge-${index}`,
        source: step.id,
        target: steps[index + 1].id,
        type: "default",
    }))

    return (
        <Card className="h-150">
            <Canvas
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={Connection}
                fitView
            >
                <Panel position="top-left">
                    <div className="text-sm font-medium">{workflow.name}</div>
                </Panel>
                <Controls />
            </Canvas>
        </Card>
    )
}
