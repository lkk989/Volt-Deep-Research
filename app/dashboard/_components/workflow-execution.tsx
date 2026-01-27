'use client'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Canvas } from "@/components/ai-elements/canvas"
import { Node, NodeHeader, NodeTitle, NodeContent } from "@/components/ai-elements/node"
import { Edge } from "@/components/ai-elements/edge"
import { Connection } from "@/components/ai-elements/connection"
import { Panel } from "@/components/ai-elements/panel"
import { Controls } from "@/components/ai-elements/controls"
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react"
import type { Node as FlowNode, Edge as FlowEdge } from "@xyflow/react"
import { useEffect, useState, useRef } from "react"

const VOLTAGENT_API_URL = process.env.NEXT_PUBLIC_VOLTAGENT_URL || 'http://localhost:3141'

interface WorkflowExecutionProps {
    workflowId: string
    input: any
    onClose?: () => void
    userId?: string
}

interface WorkflowStreamEvent {
    type: string
    executionId: string
    from: string
    input?: any
    output?: any
    status: "pending" | "running" | "success" | "error" | "suspended"
    timestamp: string
    stepIndex?: number
    stepType?: string
    metadata?: any
    error?: any
}

const nodeTypes = {
    workflow: ({ data }: { data: any }) => (
        <Node handles={{ target: true, source: true }}>
            <NodeHeader>
                <div className="flex items-center justify-between w-full">
                    <NodeTitle>{data.label}</NodeTitle>
                    {data.status && (
                        <Badge variant={data.status === "running" ? "secondary" : data.status === "success" ? "default" : "destructive"}>
                            {data.status}
                        </Badge>
                    )}
                </div>
            </NodeHeader>
            <NodeContent>
                <span className="text-xs text-muted-foreground">{data.type}</span>
            </NodeContent>
        </Node>
    ),
}

const edgeTypes = {
    default: Edge.Animated,
}

export function WorkflowExecution({
    workflowId,
    input,
    onClose,
    userId = "user-1"
}: WorkflowExecutionProps) {
    const [nodes, setNodes] = useState<FlowNode[]>([])
    const [edges, setEdges] = useState<FlowEdge[]>([])
    const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
    const [error, setError] = useState<string | null>(null)
    const [executionId, setExecutionId] = useState<string>("")
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        startExecution()
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [workflowId, input])

    const startExecution = async () => {
        try {
            setStatus('loading')
            abortControllerRef.current = new AbortController()
            
            const response = await fetch(
                `${VOLTAGENT_API_URL}/workflows/${workflowId}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input,
                        options: {
                            userId,
                            conversationId: `workflow-${workflowId}-${Date.now()}`,
                        }
                    }),
                    signal: abortControllerRef.current.signal,
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to start workflow: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    setStatus('idle')
                    break
                }

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event: WorkflowStreamEvent = JSON.parse(line.slice(6))
                            handleEvent(event)
                        } catch (e) {
                            console.error('Failed to parse event:', e)
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Execution error:', err)
                setStatus('error')
                setError(err.message)
            }
        }
    }

    const handleEvent = (event: WorkflowStreamEvent) => {
        if (!executionId && event.executionId) {
            setExecutionId(event.executionId)
        }

        if (event.type === 'workflow-error') {
            setStatus('error')
            setError(event.error?.message || 'Workflow error')
            return
        }

        if (event.type.startsWith('step-') || event.type === 'workflow-start') {
            updateVisualization(event)
        }
    }

    const updateVisualization = (event: WorkflowStreamEvent) => {
        setNodes(prev => {
            const existing = prev.find(n => n.id === event.from)

            const newNode: FlowNode = {
                id: event.from || `step-${prev.length}`,
                type: "workflow",
                position: {
                    x: existing ? existing.position.x : 100 + prev.length * 250,
                    y: existing ? existing.position.y : 100
                },
                data: {
                    label: event.from || event.stepType || 'Step',
                    status: event.status,
                    type: event.stepType || event.type,
                },
            }

            if (existing) {
                return prev.map(n => n.id === event.from ? newNode : n)
            }

            const updated = [...prev, newNode]
            
            // Create edge from previous node to this one
            if (updated.length > 1) {
                setEdges(prevEdges => {
                    const edgeExists = prevEdges.some(e => e.target === newNode.id)
                    if (!edgeExists) {
                        const sourceNode = updated[updated.length - 2]
                        return [...prevEdges, {
                            id: `edge-${prevEdges.length}`,
                            source: sourceNode.id,
                            target: newNode.id,
                            type: "default",
                        }]
                    }
                    return prevEdges
                })
            }

            return updated
        })
    }

    const isComplete = status === 'idle' && nodes.length > 0
    const isError = status === 'error'

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Badge
                        variant={isComplete ? "default" : isError ? "destructive" : "secondary"}
                        className="flex items-center gap-2"
                    >
                        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isComplete && <CheckCircle2 className="h-4 w-4" />}
                        {isError && <AlertCircle className="h-4 w-4" />}
                        {status === 'loading' ? 'Running' : isError ? 'Error' : 'Completed'}
                    </Badge>
                    {executionId && (
                        <span className="text-xs text-muted-foreground">
                            ID: {executionId.slice(0, 8)}...
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

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
                        <div className="text-sm font-medium">Workflow: {workflowId}</div>
                    </Panel>
                    <Controls />
                </Canvas>
            </Card>

            {error && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2">Error</h4>
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}
        </Card>
    )
}
