'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DEFAULT_VOLTAGENT_BASE_URL } from '@/lib/voltagent-client'
import { useVoltAgentWorkflow } from '@/hooks/use-voltagent'
import {
    WorkflowVisualizer,
    type WorkflowNodeStatus,
    type WorkflowVisualizationEvent,
} from './workflow-visualizer'

interface WorkflowExecutionProps {
    workflowId: string
    input: unknown
    onClose?: () => void
    userId?: string
}

interface WorkflowStreamEvent {
    type: string
    executionId?: string
    from?: string
    input?: unknown
    output?: unknown
    status?: WorkflowNodeStatus | 'completed'
    timestamp?: string
    stepIndex?: number
    stepType?: string
    metadata?: Record<string, unknown>
    error?: {
        message?: string
    }
}

export function WorkflowExecution({
    workflowId,
    input,
    onClose,
    userId = "user-1"
}: WorkflowExecutionProps) {
    const { data: workflow, isLoading: isWorkflowLoading } =
        useVoltAgentWorkflow(workflowId)
    const [events, setEvents] = useState<WorkflowVisualizationEvent[]>([])
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
            setError(null)
            setEvents([])
            abortControllerRef.current = new AbortController()
            
            const response = await fetch(
                `${DEFAULT_VOLTAGENT_BASE_URL}/workflows/${workflowId}/stream`,
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
        } catch (err: unknown) {
            if (!(err instanceof Error) || err.name !== 'AbortError') {
                console.error('Execution error:', err)
                setStatus('error')
                setError(
                    err instanceof Error ? err.message : 'Workflow execution failed'
                )
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

        setEvents((current) => [...current, event])

        if (event.type.startsWith('step-') || event.type === 'workflow-start') {
            setStatus('loading')
        }
    }

    const isComplete = status === 'idle' && events.length > 0
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

            {isWorkflowLoading || !workflow ? (
                <Card className="flex h-[600px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
            ) : (
                <WorkflowVisualizer
                    workflowId={workflow.id}
                    workflowName={workflow.name}
                    workflowPurpose={workflow.purpose}
                    steps={workflow.steps}
                    events={events}
                />
            )}

            {error && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2">Error</h4>
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}
        </Card>
    )
}
