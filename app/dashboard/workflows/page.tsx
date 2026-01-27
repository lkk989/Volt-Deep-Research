'use client'

import { useState } from "react"
import { WorkflowList } from "../_components/workflow-list"
import { WorkflowExecution } from "../_components/workflow-execution"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WorkflowsPage() {
    const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
    const [showInputDialog, setShowInputDialog] = useState(false)
    const [workflowInput, setWorkflowInput] = useState("")
    const [executing, setExecuting] = useState(false)

    const handleExecute = (workflowId: string) => {
        setSelectedWorkflow(workflowId)
        setShowInputDialog(true)
    }

    const handleStartExecution = () => {
        if (workflowInput) {
            try {
                JSON.parse(workflowInput)
            } catch (error) {
                alert("Invalid JSON input")
                return
            }
        }
        setShowInputDialog(false)
        setExecuting(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
                    <p className="text-muted-foreground">
                        Manage and execute multi-step AI workflows
                    </p>
                </div>
            </div>

            {executing && selectedWorkflow ? (
                <WorkflowExecution
                    workflowId={selectedWorkflow}
                    input={workflowInput ? (() => {
                        try {
                            return JSON.parse(workflowInput)
                        } catch {
                            return { input: workflowInput }
                        }
                    })() : {}}
                    onClose={() => {
                        setExecuting(false)
                        setSelectedWorkflow(null)
                        setWorkflowInput("")
                    }}
                />
            ) : (
                <WorkflowList onExecute={handleExecute} />
            )}

            <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Workflow Input</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="workflow-input" className="text-sm font-medium">
                                Input (JSON format)
                            </label>
                            <Input
                                id="workflow-input"
                                placeholder='{"topic": "AI agents"}'
                                value={workflowInput}
                                onChange={(e) => setWorkflowInput(e.target.value)}
                                className="font-mono mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Leave empty for default input
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleStartExecution}
                                className="flex-1"
                            >
                                Start Execution
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowInputDialog(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
