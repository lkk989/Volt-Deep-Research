'use client'

import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useVoltAgentWorkflow } from '@/hooks/use-voltagent'
import {
    WorkflowVisualizer,
    type WorkflowVisualizationEvent,
} from './workflow-visualizer'

interface WorkflowCanvasProps {
    workflowId: string
    events?: WorkflowVisualizationEvent[]
}

export function WorkflowCanvas({ workflowId, events = [] }: WorkflowCanvasProps) {
    const { data: workflow, isLoading, isError } = useVoltAgentWorkflow(workflowId)

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        )
    }

    if (isError || !workflow) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">Failed to load workflow</p>
            </Card>
        )
    }

    return (
        <WorkflowVisualizer
            workflowId={workflow.id}
            workflowName={workflow.name}
            workflowPurpose={workflow.purpose}
            steps={workflow.steps}
            events={events}
        />
    )
}
