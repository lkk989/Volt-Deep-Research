'use client'

import { memo, useMemo } from 'react'
import type {
    Edge as XYFlowEdge,
    EdgeTypes,
    Node as XYFlowNode,
    NodeProps as XYFlowNodeProps,
    NodeTypes,
} from '@xyflow/react'
import {
    ActivityIcon,
    BotIcon,
    CheckCircle2Icon,
    Clock3Icon,
    PauseCircleIcon,
    XCircleIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Canvas } from '@/components/ai-elements/canvas'
import { Connection } from '@/components/ai-elements/connection'
import { Controls } from '@/components/ai-elements/controls'
import { Edge } from '@/components/ai-elements/edge'
import {
    Node as WorkflowNodeCard,
    NodeAction,
    NodeContent,
    NodeDescription,
    NodeFooter,
    NodeHeader,
    NodeTitle,
} from '@/components/ai-elements/node'
import {
    OpenIn,
    OpenInChatGPT,
    OpenInClaude,
    OpenInContent,
    OpenInCursor,
    OpenInLabel,
    OpenInScira,
    OpenInSeparator,
    OpenInT3,
    OpenInTrigger,
} from '@/components/ai-elements/open-in-chat'
import { Panel } from '@/components/ai-elements/panel'
import { Toolbar } from '@/components/ai-elements/toolbar'
import type { VoltAgentWorkflowStep } from '@/lib/voltagent-client'

export type WorkflowNodeStatus =
    | 'pending'
    | 'running'
    | 'success'
    | 'error'
    | 'suspended'

export interface WorkflowVisualizationEvent {
    from?: string
    status?: WorkflowNodeStatus | 'completed'
    stepIndex?: number
    stepType?: string
    timestamp?: string
    type: string
}

interface WorkflowNodeData extends Record<string, unknown> {
    description?: string
    hasSource: boolean
    hasTarget: boolean
    label: string
    status: WorkflowNodeStatus
    stepIndex: number
    type: string
}

export interface WorkflowVisualizerProps {
    className?: string
    events?: WorkflowVisualizationEvent[]
    heightClassName?: string
    workflowId: string
    workflowName: string
    workflowPurpose?: string
    steps: VoltAgentWorkflowStep[]
}

type WorkflowGraphNode = XYFlowNode<WorkflowNodeData, 'workflowStep'>

const STATUS_ORDER: WorkflowNodeStatus[] = [
    'running',
    'error',
    'suspended',
    'success',
    'pending',
]

function normalizeEventStatus(
    event: WorkflowVisualizationEvent | undefined
): WorkflowNodeStatus {
    if (!event) {
        return 'pending'
    }

    if (event.status === 'completed') {
        return 'success'
    }

    if (event.status) {
        return event.status
    }

    if (event.type.includes('error')) {
        return 'error'
    }

    if (event.type.includes('suspend')) {
        return 'suspended'
    }

    if (event.type.includes('finish') || event.type.includes('complete')) {
        return 'success'
    }

    if (event.type.includes('start') || event.type.includes('run')) {
        return 'running'
    }

    return 'pending'
}

function getStepStatus(
    step: VoltAgentWorkflowStep,
    stepIndex: number,
    events: WorkflowVisualizationEvent[]
): WorkflowNodeStatus {
    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index]

        if (event.stepIndex === stepIndex || event.from === step.id || event.from === step.name) {
            return normalizeEventStatus(event)
        }
    }

    return 'pending'
}

function getStatusBadgeVariant(status: WorkflowNodeStatus) {
    switch (status) {
        case 'success':
            return 'default'
        case 'error':
            return 'destructive'
        default:
            return 'secondary'
    }
}

function getStatusIcon(status: WorkflowNodeStatus) {
    switch (status) {
        case 'running':
            return <ActivityIcon className="size-4 text-blue-500" />
        case 'success':
            return <CheckCircle2Icon className="size-4 text-green-500" />
        case 'error':
            return <XCircleIcon className="size-4 text-destructive" />
        case 'suspended':
            return <PauseCircleIcon className="size-4 text-amber-500" />
        default:
            return <Clock3Icon className="size-4 text-muted-foreground" />
    }
}

function getStatusLabel(status: WorkflowNodeStatus): string {
    switch (status) {
        case 'running':
            return 'Running'
        case 'success':
            return 'Completed'
        case 'error':
            return 'Error'
        case 'suspended':
            return 'Suspended'
        default:
            return 'Pending'
    }
}

function buildWorkflowQuery(
    workflowName: string,
    workflowPurpose: string | undefined,
    steps: VoltAgentWorkflowStep[]
): string {
    const stepSummary = steps
        .map((step, index) => `${index + 1}. ${step.name} (${step.type})`)
        .join('\n')

    return [
        `Explain this AI workflow: ${workflowName}`,
        workflowPurpose?.trim() ? `Purpose: ${workflowPurpose.trim()}` : undefined,
        stepSummary ? `Steps:\n${stepSummary}` : undefined,
    ]
        .filter((value): value is string => Boolean(value))
        .join('\n\n')
}

function WorkflowStepNode({
    data,
    selected,
}: XYFlowNodeProps<WorkflowGraphNode>) {
    return (
        <>
            <WorkflowNodeCard
                className={cn(
                    'w-80 shadow-sm transition-shadow',
                    selected && 'ring-2 ring-primary/30'
                )}
                handles={{
                    source: data.hasSource,
                    target: data.hasTarget,
                }}
            >
                <NodeHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(data.status)}
                                <NodeTitle className="text-sm">
                                    {data.stepIndex + 1}. {data.label}
                                </NodeTitle>
                            </div>
                            {data.description ? (
                                <NodeDescription className="line-clamp-3 text-xs">
                                    {data.description}
                                </NodeDescription>
                            ) : null}
                        </div>
                        <NodeAction>
                            <Badge variant={getStatusBadgeVariant(data.status)}>
                                {getStatusLabel(data.status)}
                            </Badge>
                        </NodeAction>
                    </div>
                </NodeHeader>
                <NodeContent className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <BotIcon className="size-3.5" />
                        <span className="font-medium uppercase tracking-wide">
                            {data.type}
                        </span>
                    </div>
                </NodeContent>
                <NodeFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Step {data.stepIndex + 1}</span>
                    <span>{getStatusLabel(data.status)}</span>
                </NodeFooter>
            </WorkflowNodeCard>

            <Toolbar isVisible={selected || data.status === 'running'}>
                <Badge variant={getStatusBadgeVariant(data.status)}>
                    {getStatusLabel(data.status)}
                </Badge>
            </Toolbar>
        </>
    )
}

const nodeTypes: NodeTypes = {
    workflowStep: WorkflowStepNode,
}

const edgeTypes: EdgeTypes = {
    animated: Edge.Animated,
}

export const WorkflowVisualizer = memo(function WorkflowVisualizer({
    className,
    events = [],
    heightClassName = 'h-[600px]',
    workflowId,
    workflowName,
    workflowPurpose,
    steps,
}: WorkflowVisualizerProps) {
    const graph = useMemo(() => {
        const nodes: WorkflowGraphNode[] = steps.map(
            (step, index) => ({
                id: step.id,
                type: 'workflowStep',
                position: { x: 80 + index * 320, y: 120 },
                data: {
                    description: step.purpose,
                    hasSource: index < steps.length - 1,
                    hasTarget: index > 0,
                    label: step.name,
                    status: getStepStatus(step, index, events),
                    stepIndex: index,
                    type: step.type,
                },
            })
        )

        const edges: XYFlowEdge[] = steps.slice(0, -1).map((step, index) => ({
            id: `${step.id}->${steps[index + 1].id}`,
            source: step.id,
            target: steps[index + 1].id,
            type: 'animated',
        }))

        return { edges, nodes }
    }, [events, steps])

    const workflowQuery = useMemo(
        () => buildWorkflowQuery(workflowName, workflowPurpose, steps),
        [steps, workflowName, workflowPurpose]
    )

    const statusCounts = useMemo(() => {
        return STATUS_ORDER.reduce<Record<WorkflowNodeStatus, number>>(
            (counts, status) => {
                counts[status] = graph.nodes.filter(
                    (node) => node.data.status === status
                ).length

                return counts
            },
            {
                error: 0,
                pending: 0,
                running: 0,
                success: 0,
                suspended: 0,
            }
        )
    }, [graph.nodes])

    return (
        <div className={cn('overflow-hidden rounded-xl border bg-card', heightClassName, className)}>
            <Canvas
                connectionLineComponent={Connection}
                defaultEdgeOptions={{
                    animated: true,
                    type: 'animated',
                }}
                edgeTypes={edgeTypes}
                fitView
                nodeTypes={nodeTypes}
                nodes={graph.nodes}
                edges={graph.edges}
            >
                <Panel position="top-left" className="max-w-sm p-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Workflow</Badge>
                            <span className="text-xs text-muted-foreground">
                                {workflowId}
                            </span>
                        </div>
                        <div className="text-sm font-semibold">{workflowName}</div>
                        {workflowPurpose ? (
                            <p className="text-xs text-muted-foreground">
                                {workflowPurpose}
                            </p>
                        ) : null}
                    </div>
                </Panel>

                <Panel position="top-right" className="p-2">
                    <OpenIn query={workflowQuery}>
                        <OpenInTrigger>
                            <Button size="sm" type="button" variant="outline">
                                Explain workflow
                            </Button>
                        </OpenInTrigger>
                        <OpenInContent>
                            <OpenInLabel>Open in</OpenInLabel>
                            <OpenInSeparator />
                            <OpenInChatGPT />
                            <OpenInClaude />
                            <OpenInCursor />
                            <OpenInScira />
                            <OpenInT3 />
                        </OpenInContent>
                    </OpenIn>
                </Panel>

                <Panel position="bottom-left" className="p-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                        {STATUS_ORDER.map((status) => (
                            <Badge
                                key={status}
                                variant={getStatusBadgeVariant(status)}
                            >
                                {getStatusLabel(status)}: {statusCounts[status]}
                            </Badge>
                        ))}
                    </div>
                </Panel>

                <Controls />
            </Canvas>
        </div>
    )
})