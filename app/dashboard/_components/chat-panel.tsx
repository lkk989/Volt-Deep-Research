'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Agent, AgentContent, AgentHeader } from '@/components/ai-elements/agent'
import { Snippet, SnippetInput } from '@/components/ai-elements/snippet'
import {
    FileTree,
    FileTreeFile,
    FileTreeFolder,
    FileTreeIcon,
    FileTreeName,
} from '@/components/ai-elements/file-tree'
import { DEFAULT_VOLTAGENT_BASE_URL } from '@/lib/voltagent-client'
import { ChatAdvancedOptions } from './chat-advanced-options'
import type { AdvancedChatOptions } from './chat-options'
import {
    useVoltAgent,
    useVoltAgentLogs,
    useVoltAgentMcpPrompts,
    useVoltAgentMcpServers,
    useVoltAgentMcpTools,
    useVoltAgentTools,
    useVoltAgentWorkspaceFiles,
    useVoltAgentWorkspaceInfo,
    useVoltAgentWorkspaceSkills,
    useVoltConversationWorkingMemory,
    useVoltAgentWorkflows,
} from '@/hooks/use-voltagent'
import { FileIcon, FolderIcon } from 'lucide-react'

interface ChatPanelProps {
    activeAgentId: string
    chatId: string
    userId: string
    selectedModel?: string
    advancedOptions: AdvancedChatOptions
    activeOptionCount: number
    onAdvancedOptionChange: <K extends keyof AdvancedChatOptions>(
        key: K,
        value: AdvancedChatOptions[K]
    ) => void
    onResetAdvancedOptions: () => void
}

export function ChatPanel({
    activeAgentId,
    chatId,
    userId,
    selectedModel,
    advancedOptions,
    activeOptionCount,
    onAdvancedOptionChange,
    onResetAdvancedOptions,
}: ChatPanelProps) {
    const { data: workingMemory } = useVoltConversationWorkingMemory(
        chatId,
        activeAgentId,
        userId
    )
    const { data: activeAgent } = useVoltAgent(activeAgentId)
    const { data: workflows = [] } = useVoltAgentWorkflows()
    const { data: tools = [] } = useVoltAgentTools()
    const { data: logs } = useVoltAgentLogs(activeAgentId, 10)
    const { data: mcpServers = [] } = useVoltAgentMcpServers()
    const { data: workspaceInfo } = useVoltAgentWorkspaceInfo(activeAgentId)
    const { data: workspaceFiles } = useVoltAgentWorkspaceFiles(activeAgentId)
    const { data: workspaceSkills = [] } = useVoltAgentWorkspaceSkills(activeAgentId)
    const primaryMcpServerId = useMemo(() => {
        const firstServer = mcpServers[0]
        return typeof firstServer?.id === 'string' ? firstServer.id : ''
    }, [mcpServers])
    const { data: mcpTools = [] } = useVoltAgentMcpTools(primaryMcpServerId)
    const { data: mcpPrompts = [] } = useVoltAgentMcpPrompts(primaryMcpServerId)

    return (
        <aside className="hidden w-88 shrink-0 border-l bg-muted/20 xl:flex xl:flex-col">
            <div className="space-y-4 overflow-y-auto p-4">
                <ChatAdvancedOptions
                    options={advancedOptions}
                    activeOptionCount={activeOptionCount}
                    onChange={onAdvancedOptionChange}
                    onReset={onResetAdvancedOptions}
                />

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Agent</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Agent>
                            <AgentHeader
                                name={activeAgent?.name ?? activeAgentId}
                                model={activeAgent?.model}
                            />
                            <AgentContent className="space-y-2 text-xs text-muted-foreground">
                                {activeAgent?.description ? (
                                    <p>{activeAgent.description}</p>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                        {activeAgent?.status ?? 'unknown'}
                                    </Badge>
                                    {activeAgent?.isTelemetryEnabled ? (
                                        <Badge variant="outline">Observability enabled</Badge>
                                    ) : null}
                                    {activeAgent?.memory ? (
                                        <Badge variant="outline">Memory enabled</Badge>
                                    ) : null}
                                </div>
                            </AgentContent>
                        </Agent>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Thread</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Conversation ID</span>
                            <span className="font-mono text-foreground">{chatId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>User</span>
                            <span className="font-mono text-foreground">{userId}</span>
                        </div>
                        {selectedModel?.trim() ? (
                            <div className="flex items-center justify-between gap-4">
                                <span>Selected model</span>
                                <span className="text-right text-foreground">
                                    {selectedModel}
                                </span>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Config</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Agent model</span>
                            <span className="text-right text-foreground">{activeAgent?.model ?? 'runtime-resolved'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Agent tools</span>
                            <span className="text-foreground">{Array.isArray(activeAgent?.tools) ? activeAgent.tools.length : 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Sub-agents</span>
                            <span className="text-foreground">{Array.isArray(activeAgent?.subAgents) ? activeAgent.subAgents.length : 0}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span>Registered workflows</span>
                            <span className="text-foreground">{workflows.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Global tools</span>
                            <span className="text-foreground">{tools.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Memory & observation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Memory configured</span>
                            <span className="text-foreground">{activeAgent?.memory ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Working memory</span>
                            <span className="text-foreground">{workingMemory ? 'Loaded' : 'Unavailable'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Telemetry</span>
                            <span className="text-foreground">{activeAgent?.isTelemetryEnabled ? 'On' : 'Off'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Recent log entries</span>
                            <span className="text-foreground">{logs?.data.length ?? 0}</span>
                        </div>
                        {workingMemory ? (
                            <Snippet code={JSON.stringify(workingMemory.value, null, 2)}>
                                <SnippetInput />
                            </Snippet>
                        ) : null}
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>MCP</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Server count</span>
                            <span className="text-foreground">{mcpServers.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Tool count</span>
                            <span className="text-foreground">{mcpTools.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Prompt count</span>
                            <span className="text-foreground">{mcpPrompts.length}</span>
                        </div>
                        <Snippet code={DEFAULT_VOLTAGENT_BASE_URL}>
                            <SnippetInput />
                        </Snippet>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Workspace</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Workspace ID</span>
                            <span className="font-mono text-foreground">
                                {workspaceInfo?.id ?? 'Unavailable'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {workspaceInfo?.capabilities?.filesystem ? (
                                <Badge variant="outline">Filesystem</Badge>
                            ) : null}
                            {workspaceInfo?.capabilities?.search ? (
                                <Badge variant="outline">Search</Badge>
                            ) : null}
                            {workspaceInfo?.capabilities?.skills ? (
                                <Badge variant="outline">Skills</Badge>
                            ) : null}
                            {workspaceInfo?.capabilities?.sandbox ? (
                                <Badge variant="outline">Sandbox</Badge>
                            ) : null}
                        </div>

                        {workspaceFiles?.entries.length ? (
                            <FileTree defaultExpanded={new Set(['/'])}>
                                {workspaceFiles.entries.map((entry) =>
                                    entry.is_dir ? (
                                        <FileTreeFolder
                                            key={entry.path}
                                            path={entry.path}
                                            name={entry.path}
                                        >
                                            <FileTreeIcon>
                                                <FolderIcon className="size-4 text-muted-foreground" />
                                            </FileTreeIcon>
                                            <FileTreeName>{entry.path}</FileTreeName>
                                        </FileTreeFolder>
                                    ) : (
                                        <FileTreeFile
                                            key={entry.path}
                                            path={entry.path}
                                            name={entry.path}
                                        >
                                            <FileTreeIcon>
                                                <FileIcon className="size-4 text-muted-foreground" />
                                            </FileTreeIcon>
                                            <FileTreeName>{entry.path}</FileTreeName>
                                        </FileTreeFile>
                                    )
                                )}
                            </FileTree>
                        ) : (
                            <div className="text-muted-foreground">
                                No workspace file entries available.
                            </div>
                        )}

                        <Separator />
                        <div className="space-y-2">
                            <div className="font-medium text-foreground">
                                Skills
                            </div>
                            {workspaceSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {workspaceSkills.map((skill) => (
                                        <Badge key={skill.id} variant="secondary">
                                            {skill.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    No workspace skills available.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </aside>
    )
}
