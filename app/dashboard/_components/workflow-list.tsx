'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

const VOLTAGENT_API_URL = process.env.NEXT_PUBLIC_VOLTAGENT_URL || 'http://localhost:3141'

interface Workflow {
    id: string
    name: string
    purpose: string
    steps: any[]
}

interface WorkflowListProps {
    onExecute: (workflowId: string) => void
}

export function WorkflowList({ onExecute }: WorkflowListProps) {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${VOLTAGENT_API_URL}/workflows`)
            .then(async res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch workflows: ${res.statusText}`)
                }
                return res.json()
            })
            .then(data => {
                const workflowList = Object.entries(data.workflows || data || {}).map(([id, workflow]: [string, any]) => ({
                    id,
                    name: workflow.name || id,
                    purpose: workflow.purpose || '',
                    steps: workflow.steps || []
                }))
                setWorkflows(workflowList)
                setError(null)
            })
            .catch(err => {
                console.error('Failed to load workflows:', err)
                setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
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
                <p className="text-xs text-muted-foreground">{error}</p>
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
