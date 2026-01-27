'use client'

import { use, useEffect, useState } from "react"
import { WorkflowCanvas } from "../../_components/workflow-canvas"
import { WorkflowExecution } from "../../_components/workflow-execution"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WorkflowDetailPageProps {
    params: Promise<{ id: string }>
}

export default function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
    const resolvedParams = use(params)
    const [workflow, setWorkflow] = useState<any>(null)
    const [executing, setExecuting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWorkflow()
    }, [resolvedParams.id])

    const fetchWorkflow = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/workflows/${resolvedParams.id}`)
            const result = await response.json()

            if (result.success) {
                setWorkflow(result.data)
            }
        } catch (error) {
            console.error("Failed to fetch workflow:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-muted-foreground">Loading workflow...</div>
            </div>
        )
    }

    if (!workflow) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Workflow not found</p>
                    <Button asChild>
                        <Link href="/dashboard/workflows">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Workflows
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/workflows">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {workflow.name}
                            </h1>
                            <Badge>{workflow.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {workflow.purpose || "No description"}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setExecuting(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Workflow
                </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="visualization">Visualization</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Workflow Steps</h3>
                        <div className="space-y-3">
                            {workflow.steps?.map((step: any, index: number) => (
                                <div
                                    key={step.id}
                                    className="flex items-start gap-3 p-3 border rounded-lg"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{step.name}</h4>
                                            <Badge variant="outline">{step.type}</Badge>
                                        </div>
                                        {step.purpose && (
                                            <p className="text-sm text-muted-foreground">
                                                {step.purpose}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="visualization">
                    <WorkflowCanvas workflowId={resolvedParams.id} />
                </TabsContent>

                <TabsContent value="schema">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Input Schema</h3>
                                <pre className="text-xs p-4 bg-muted rounded-lg overflow-auto">
                                    {JSON.stringify(workflow.inputSchema, null, 2)}
                                </pre>
                            </div>
                            {workflow.suspendSchema && (
                                <div>
                                    <h3 className="font-semibold mb-2">Suspend Schema</h3>
                                    <pre className="text-xs p-4 bg-muted rounded-lg overflow-auto">
                                        {JSON.stringify(workflow.suspendSchema, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {workflow.resumeSchema && (
                                <div>
                                    <h3 className="font-semibold mb-2">Resume Schema</h3>
                                    <pre className="text-xs p-4 bg-muted rounded-lg overflow-auto">
                                        {JSON.stringify(workflow.resumeSchema, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {executing && (
                <WorkflowExecution
                    workflowId={resolvedParams.id}
                    input={{}}
                    onClose={() => setExecuting(false)}
                />
            )}
        </div>
    )
}
