'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVoltAgentWorkflows } from '@/hooks/use-voltagent'
import { Loader2, PlayCircle } from 'lucide-react'

interface WorkflowListProps {
    onExecute: (workflowId: string) => void
}

export function WorkflowList({ onExecute }: WorkflowListProps) {
    const {
        data: workflows = [],
        error,
        isLoading,
    } = useVoltAgentWorkflows()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="p-12 text-center">
                <p className="text-destructive mb-2">Failed to load workflows</p>
                <p className="text-xs text-muted-foreground">{error.message}</p>
            </Card>
        )
    }

    if (workflows.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No workflows available</p>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
                <Card key={workflow.id}>
                    <CardHeader>
                        <CardTitle>{workflow.name}</CardTitle>
                        <CardDescription>{workflow.purpose}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-xs text-muted-foreground">
                            {workflow.stepsCount} step{workflow.stepsCount === 1 ? '' : 's'}
                        </p>
                        <Button onClick={() => onExecute(workflow.id)} className="w-full">
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Execute
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
