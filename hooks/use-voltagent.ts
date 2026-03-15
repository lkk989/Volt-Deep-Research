'use client'

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query'
import {
    fetchVoltAgent,
    fetchVoltAgentHistory,
    fetchVoltAgentList,
    fetchVoltAgentLogs,
    fetchVoltAgentMcpInvokeTool,
    fetchVoltAgentMcpPrompt,
    fetchVoltAgentMcpPrompts,
    fetchVoltAgentMcpResource,
    fetchVoltAgentMcpResources,
    fetchVoltAgentMcpResourceTemplates,
    fetchVoltAgentMcpSetLogLevel,
    fetchVoltAgentMcpServer,
    fetchVoltAgentMcpServers,
    fetchVoltAgentMcpTool,
    fetchVoltAgentMcpTools,
    fetchVoltAgentObject,
    fetchVoltAgentText,
    fetchVoltA2AAgentCard,
    fetchVoltA2AJsonRpc,
    fetchVoltCancelWorkflow,
    fetchVoltCheckUpdates,
    fetchVoltCloneMemoryConversation,
    fetchVoltCreateMemoryConversation,
    fetchVoltDeleteMemoryConversation,
    fetchVoltDeleteMemoryMessages,
    fetchVoltAgentWorkflow,
    fetchVoltAgentWorkflowExecutionState,
    fetchVoltAgentWorkflowExecutions,
    fetchVoltAgentTools,
    fetchVoltExecuteTool,
    fetchVoltExecuteWorkflow,
    fetchVoltAgentWorkspaceFile,
    fetchVoltAgentWorkspaceFiles,
    fetchVoltAgentWorkspaceInfo,
    fetchVoltAgentWorkspaceSkill,
    fetchVoltAgentWorkspaceSkills,
    fetchVoltAgentWorkflows,
    fetchVoltConversation,
    fetchVoltLogs,
    fetchVoltInstallPackageUpdate,
    fetchVoltInstallUpdates,
    fetchVoltMemoryConversationMessages,
    fetchVoltMemoryConversations,
    fetchVoltMemorySearch,
    fetchVoltMemoryWorkingMemory,
    fetchVoltObservabilityConversationSteps,
    fetchVoltObservabilityLogs,
    fetchVoltObservabilityMemoryConversations,
    fetchVoltObservabilityMemoryMessages,
    fetchVoltObservabilityMemoryUsers,
    fetchVoltObservabilitySpan,
    fetchVoltObservabilitySpanLogs,
    fetchVoltObservabilityStatus,
    fetchVoltObservabilityTrace,
    fetchVoltObservabilityTraceLogs,
    fetchVoltObservabilityTraces,
    fetchVoltObservabilityWorkingMemory,
    fetchVoltConversations,
    fetchVoltConversationWorkingMemory,
    fetchVoltConversationMessages,
    fetchVoltReplayWorkflow,
    fetchVoltResumeWorkflow,
    fetchVoltSaveMemoryMessages,
    fetchVoltSetupObservability,
    fetchVoltSuspendWorkflow,
    fetchVoltUpdateMemoryConversation,
    fetchVoltUpdateMemoryWorkingMemory,
    type VoltAgentA2AAgentCard,
    type VoltAgentA2AJsonRpcRequest,
    type VoltAgentA2AJsonRpcResponse,
    type VoltAgentConversationMessagesQuery,
    type VoltAgentConversationQuery,
    type VoltAgentConversationStepsQuery,
    type VoltAgentConversationWorkingMemoryQuery,
    type VoltAgentInstallUpdatesRequest,
    type VoltAgentInstallUpdatesResult,
    type VoltAgentLogsQuery,
    type VoltAgentMcpInvokeToolRequest,
    type VoltAgentMcpSetLogLevelRequest,
    type VoltAgentMemoryCloneConversationRequest,
    type VoltAgentMemoryCloneConversationResult,
    type VoltAgentMemoryConversation,
    type VoltAgentMemoryConversationMutationRequest,
    type VoltAgentMemoryCreateConversationRequest,
    type VoltAgentMemoryDeleteConversationResult,
    type VoltAgentMemoryDeleteMessagesRequest,
    type VoltAgentMemoryDeleteMessagesResult,
    type VoltAgentMemorySaveMessagesRequest,
    type VoltAgentMemorySaveMessagesResult,
    type VoltAgentMemoryUpdateWorkingMemoryRequest,
    type VoltAgentMemoryUpdateWorkingMemoryResult,
    type VoltAgentMcpPromptQuery,
    type VoltAgentMemorySearchQuery,
    type VoltAgentObservabilityLogQuery,
    type VoltAgentObservabilityMemoryConversationQuery,
    type VoltAgentObservabilityMemoryUserQuery,
    type VoltAgentObservabilitySetupRequest,
    type VoltAgentRunRequest,
    type VoltAgentSimpleSuccessResult,
    type VoltAgentTextResult,
    type VoltAgentToolExecutionRequest,
    type VoltAgentToolExecutionResult,
    type VoltAgentUpdateInfo,
    type VoltAgentWorkflowExecuteRequest,
    type VoltAgentWorkflowExecution,
    type VoltAgentWorkflowExecutionResult,
    type VoltAgentObservabilityWorkingMemoryQuery,
    type VoltAgentWorkflowReplayRequest,
    type VoltAgentWorkflowResumeRequest,
    type VoltAgentWorkflowSuspendRequest,
    type VoltAgentWorkflowExecutionQuery,
    type VoltAgentWorkspaceReadQuery,
} from '@/lib/voltagent-client'

export const voltagentQueryKeys = {
    agent: (agentId: string) => ['voltagent', 'agent', agentId] as const,
    agents: ['voltagent', 'agents'] as const,
    agentHistory: (agentId: string, page: number, limit: number) =>
        ['voltagent', 'agent-history', agentId, page, limit] as const,
    a2aAgentCard: (serverId: string) =>
        ['voltagent', 'a2a', 'agent-card', serverId] as const,
    conversation: (conversationId: string, userId: string) =>
        ['voltagent', 'conversation', conversationId, userId] as const,
    conversationById: (conversationId: string, agentId?: string) =>
        ['voltagent', 'conversation-by-id', conversationId, agentId ?? ''] as const,
    conversationMessagesQuery: (conversationId: string, queryKey: string) =>
        ['voltagent', 'conversation-messages-query', conversationId, queryKey] as const,
    conversations: (agentId: string, userId: string) =>
        ['voltagent', 'conversations', agentId, userId] as const,
    conversationsQuery: (queryKey: string) =>
        ['voltagent', 'conversations-query', queryKey] as const,
    conversationSteps: (
        conversationId: string,
        agentId: string,
        limit: number,
        operationId: string
    ) =>
        [
            'voltagent',
            'conversation-steps',
            conversationId,
            agentId,
            limit,
            operationId,
        ] as const,
    conversationWorkingMemory: (
        conversationId: string,
        agentId: string,
        userId: string
    ) =>
        [
            'voltagent',
            'conversation-working-memory',
            conversationId,
            agentId,
            userId,
        ] as const,
    conversationWorkingMemoryQuery: (conversationId: string, queryKey: string) =>
        ['voltagent', 'conversation-working-memory-query', conversationId, queryKey] as const,
    logs: (agentId: string, limit: number) =>
        ['voltagent', 'logs', agentId, limit] as const,
    mcpPrompts: (serverId: string) =>
        ['voltagent', 'mcp', 'prompts', serverId] as const,
    mcpPrompt: (serverId: string, promptName: string, argsKey: string) =>
        ['voltagent', 'mcp', 'prompt', serverId, promptName, argsKey] as const,
    mcpResource: (serverId: string, uri: string) =>
        ['voltagent', 'mcp', 'resource', serverId, uri] as const,
    mcpResources: (serverId: string) =>
        ['voltagent', 'mcp', 'resources', serverId] as const,
    mcpResourceTemplates: (serverId: string) =>
        ['voltagent', 'mcp', 'resource-templates', serverId] as const,
    mcpServer: (serverId: string) =>
        ['voltagent', 'mcp', 'server', serverId] as const,
    mcpServers: ['voltagent', 'mcp', 'servers'] as const,
    mcpTools: (serverId: string) =>
        ['voltagent', 'mcp', 'tools', serverId] as const,
    mcpTool: (serverId: string, toolName: string) =>
        ['voltagent', 'mcp', 'tool', serverId, toolName] as const,
    memorySearch: (queryKey: string) =>
        ['voltagent', 'memory-search', queryKey] as const,
    observabilityLogs: (queryKey: string) =>
        ['voltagent', 'observability', 'logs', queryKey] as const,
    observabilityMemoryConversations: (queryKey: string) =>
        ['voltagent', 'observability', 'memory-conversations', queryKey] as const,
    observabilityMemoryMessages: (conversationId: string, queryKey: string) =>
        [
            'voltagent',
            'observability',
            'memory-messages',
            conversationId,
            queryKey,
        ] as const,
    observabilityMemoryUsers: (queryKey: string) =>
        ['voltagent', 'observability', 'memory-users', queryKey] as const,
    observabilitySpan: (spanId: string) =>
        ['voltagent', 'observability', 'span', spanId] as const,
    observabilitySpanLogs: (spanId: string) =>
        ['voltagent', 'observability', 'span-logs', spanId] as const,
    observabilityStatus: ['voltagent', 'observability', 'status'] as const,
    observabilityTrace: (traceId: string) =>
        ['voltagent', 'observability', 'trace', traceId] as const,
    observabilityTraceLogs: (traceId: string) =>
        ['voltagent', 'observability', 'trace-logs', traceId] as const,
    observabilityTraces: (queryKey: string) =>
        ['voltagent', 'observability', 'traces', queryKey] as const,
    observabilityWorkingMemory: (queryKey: string) =>
        ['voltagent', 'observability', 'working-memory', queryKey] as const,
    tools: ['voltagent', 'tools'] as const,
    updates: ['voltagent', 'updates'] as const,
    workflow: (workflowId: string) =>
        ['voltagent', 'workflow', workflowId] as const,
    workflowExecutionState: (workflowId: string, executionId: string) =>
        ['voltagent', 'workflow-state', workflowId, executionId] as const,
    workflowExecutions: (queryKey: string) =>
        ['voltagent', 'workflow-executions', queryKey] as const,
    workflows: ['voltagent', 'workflows'] as const,
    workspaceFile: (
        agentId: string,
        path: string,
        offset: number,
        limit: number
    ) => ['voltagent', 'workspace', 'file', agentId, path, offset, limit] as const,
    workspaceFiles: (agentId: string, path: string) =>
        ['voltagent', 'workspace', 'files', agentId, path] as const,
    workspaceInfo: (agentId: string) =>
        ['voltagent', 'workspace', 'info', agentId] as const,
    workspaceSkill: (agentId: string, skillId: string) =>
        ['voltagent', 'workspace', 'skill', agentId, skillId] as const,
    workspaceSkills: (agentId: string) =>
        ['voltagent', 'workspace', 'skills', agentId] as const,
}

function serializeQueryKey(value: unknown): string {
    return JSON.stringify(value ?? {})
}

export type VoltQueryResult<T> = UseQueryResult<T, Error>

export type VoltMutationResult<TData, TVariables> = UseMutationResult<
    TData,
    Error,
    TVariables
>

function invalidateWorkflowQueries(
    queryClient: ReturnType<typeof useQueryClient>,
    workflowId: string
) {
    void queryClient.invalidateQueries({ queryKey: voltagentQueryKeys.workflows })
    void queryClient.invalidateQueries({ queryKey: voltagentQueryKeys.workflow(workflowId) })
    void queryClient.invalidateQueries({ queryKey: ['voltagent', 'workflow-executions'] })
}

function invalidateMemoryQueries(
    queryClient: ReturnType<typeof useQueryClient>,
    conversationId?: string
) {
    void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversations'] })
    void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversations-query'] })
    if (typeof conversationId === 'string' && conversationId.trim().length > 0) {
        void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversation', conversationId] })
        void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversation-by-id', conversationId] })
        void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversation-messages-query', conversationId] })
        void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversation-working-memory-query', conversationId] })
        void queryClient.invalidateQueries({ queryKey: ['voltagent', 'conversation-steps', conversationId] })
    }
}

export function useVoltAgentList() {
    return useQuery({
        queryFn: fetchVoltAgentList,
        queryKey: voltagentQueryKeys.agents,
        staleTime: 30_000,
    })
}

export function useVoltAgent(agentId: string) {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgent(agentId),
        queryKey: voltagentQueryKeys.agent(agentId),
        staleTime: 30_000,
    })
}

export function useVoltAgentHistory(agentId: string, page = 0, limit = 10) {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgentHistory(agentId, page, limit),
        queryKey: voltagentQueryKeys.agentHistory(agentId, page, limit),
        staleTime: 10_000,
    })
}

export function useVoltAgentWorkflows() {
    return useQuery({
        queryFn: fetchVoltAgentWorkflows,
        queryKey: voltagentQueryKeys.workflows,
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkflow(workflowId: string) {
    return useQuery({
        enabled: workflowId.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkflow(workflowId),
        queryKey: voltagentQueryKeys.workflow(workflowId),
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkflowExecutions(
    query: VoltAgentWorkflowExecutionQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltAgentWorkflowExecutions(query),
        queryKey: voltagentQueryKeys.workflowExecutions(queryKey),
        staleTime: 5_000,
    })
}

export function useVoltAgentWorkflowExecutionState(
    workflowId: string,
    executionId: string
) {
    return useQuery({
        enabled:
            workflowId.trim().length > 0 && executionId.trim().length > 0,
        queryFn: () =>
            fetchVoltAgentWorkflowExecutionState(workflowId, executionId),
        queryKey: voltagentQueryKeys.workflowExecutionState(
            workflowId,
            executionId
        ),
        staleTime: 5_000,
    })
}

export function useVoltAgentWorkspaceInfo(agentId: string) {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkspaceInfo(agentId),
        queryKey: voltagentQueryKeys.workspaceInfo(agentId),
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkspaceFiles(agentId: string, path = '/') {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkspaceFiles(agentId, path),
        queryKey: voltagentQueryKeys.workspaceFiles(agentId, path),
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkspaceFile(
    agentId: string,
    query: VoltAgentWorkspaceReadQuery
) {
    return useQuery({
        enabled:
            agentId.trim().length > 0 && query.path.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkspaceFile(agentId, query),
        queryKey: voltagentQueryKeys.workspaceFile(
            agentId,
            query.path,
            query.offset ?? 0,
            query.limit ?? 2000
        ),
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkspaceSkills(agentId: string) {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkspaceSkills(agentId),
        queryKey: voltagentQueryKeys.workspaceSkills(agentId),
        staleTime: 30_000,
    })
}

export function useVoltAgentWorkspaceSkill(agentId: string, skillId: string) {
    return useQuery({
        enabled:
            agentId.trim().length > 0 && skillId.trim().length > 0,
        queryFn: () => fetchVoltAgentWorkspaceSkill(agentId, skillId),
        queryKey: voltagentQueryKeys.workspaceSkill(agentId, skillId),
        staleTime: 30_000,
    })
}

export function useVoltAgentTools() {
    return useQuery({
        queryFn: fetchVoltAgentTools,
        queryKey: voltagentQueryKeys.tools,
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpServers() {
    return useQuery({
        queryFn: fetchVoltAgentMcpServers,
        queryKey: voltagentQueryKeys.mcpServers,
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpServer(serverId: string) {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpServer(serverId),
        queryKey: voltagentQueryKeys.mcpServer(serverId),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpTools(serverId: string) {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpTools(serverId),
        queryKey: voltagentQueryKeys.mcpTools(serverId),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpTool(serverId: string, toolName: string) {
    return useQuery({
        enabled: serverId.trim().length > 0 && toolName.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpTool(serverId, toolName),
        queryKey: voltagentQueryKeys.mcpTool(serverId, toolName),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpPrompts(serverId: string) {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpPrompts(serverId),
        queryKey: voltagentQueryKeys.mcpPrompts(serverId),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpPrompt(
    serverId: string,
    promptName: string,
    query: VoltAgentMcpPromptQuery = {}
) {
    const argsKey = serializeQueryKey(query)

    return useQuery({
        enabled: serverId.trim().length > 0 && promptName.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpPrompt(serverId, promptName, query),
        queryKey: voltagentQueryKeys.mcpPrompt(serverId, promptName, argsKey),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpResources(serverId: string) {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpResources(serverId),
        queryKey: voltagentQueryKeys.mcpResources(serverId),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpResource(serverId: string, uri: string) {
    return useQuery({
        enabled: serverId.trim().length > 0 && uri.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpResource(serverId, uri),
        queryKey: voltagentQueryKeys.mcpResource(serverId, uri),
        staleTime: 30_000,
    })
}

export function useVoltAgentMcpResourceTemplates(serverId: string) {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltAgentMcpResourceTemplates(serverId),
        queryKey: voltagentQueryKeys.mcpResourceTemplates(serverId),
        staleTime: 30_000,
    })
}

export function useVoltConversationMessages(
    conversationId: string,
    userId: string,
    agentId = ''
) {
    return useQuery({
        enabled:
            conversationId.trim().length > 0 &&
            userId.trim().length > 0 &&
            agentId.trim().length > 0,
        queryFn: () =>
            fetchVoltConversationMessages(conversationId, userId, agentId),
        queryKey: [
            ...voltagentQueryKeys.conversation(conversationId, userId),
            agentId,
        ],
        staleTime: 5_000,
    })
}

export function useVoltConversation(conversationId: string, agentId = '') {
    return useQuery({
        enabled: conversationId.trim().length > 0,
        queryFn: () => fetchVoltConversation(conversationId, agentId),
        queryKey: voltagentQueryKeys.conversationById(conversationId, agentId),
        staleTime: 5_000,
    })
}

export function useVoltConversationMessagesQuery(
    conversationId: string,
    query: VoltAgentConversationMessagesQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        enabled: conversationId.trim().length > 0,
        queryFn: () => fetchVoltMemoryConversationMessages(conversationId, query),
        queryKey: voltagentQueryKeys.conversationMessagesQuery(
            conversationId,
            queryKey
        ),
        staleTime: 5_000,
    })
}

export function useVoltConversations(agentId: string, userId: string) {
    return useQuery({
        enabled: agentId.trim().length > 0 && userId.trim().length > 0,
        queryFn: () => fetchVoltConversations(agentId, userId),
        queryKey: voltagentQueryKeys.conversations(agentId, userId),
        staleTime: 5_000,
    })
}

export function useVoltMemoryConversations(
    query: VoltAgentConversationQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltMemoryConversations(query),
        queryKey: voltagentQueryKeys.conversationsQuery(queryKey),
        staleTime: 5_000,
    })
}

export function useVoltConversationWorkingMemory(
    conversationId: string,
    agentId: string,
    userId: string
) {
    return useQuery({
        enabled:
            conversationId.trim().length > 0 &&
            agentId.trim().length > 0 &&
            userId.trim().length > 0,
        queryFn: () =>
            fetchVoltConversationWorkingMemory(conversationId, agentId, userId),
        queryKey: voltagentQueryKeys.conversationWorkingMemory(
            conversationId,
            agentId,
            userId
        ),
        staleTime: 10_000,
    })
}

export function useVoltConversationWorkingMemoryQuery(
    conversationId: string,
    query: VoltAgentConversationWorkingMemoryQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        enabled: conversationId.trim().length > 0,
        queryFn: () => fetchVoltMemoryWorkingMemory(conversationId, query),
        queryKey: voltagentQueryKeys.conversationWorkingMemoryQuery(
            conversationId,
            queryKey
        ),
        staleTime: 10_000,
    })
}

export function useVoltConversationSteps(
    conversationId: string,
    query: VoltAgentConversationStepsQuery = {}
) {
    return useQuery({
        enabled: conversationId.trim().length > 0,
        queryFn: () => fetchVoltObservabilityConversationSteps(conversationId, query),
        queryKey: voltagentQueryKeys.conversationSteps(
            conversationId,
            query.agentId ?? '',
            query.limit ?? 0,
            query.operationId ?? ''
        ),
        staleTime: 5_000,
    })
}

export function useVoltAgentLogs(agentId: string, limit = 20) {
    return useQuery({
        enabled: agentId.trim().length > 0,
        queryFn: () => fetchVoltAgentLogs(agentId, limit),
        queryKey: voltagentQueryKeys.logs(agentId, limit),
        staleTime: 10_000,
    })
}

export function useVoltLogs(query: VoltAgentLogsQuery = {}) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltLogs(query),
        queryKey: ['voltagent', 'logs-query', queryKey] as const,
        staleTime: 10_000,
    })
}

export function useVoltMemorySearch(query: VoltAgentMemorySearchQuery) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        enabled: query.searchQuery.trim().length > 0,
        queryFn: () => fetchVoltMemorySearch(query),
        queryKey: voltagentQueryKeys.memorySearch(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityStatus() {
    return useQuery({
        queryFn: fetchVoltObservabilityStatus,
        queryKey: voltagentQueryKeys.observabilityStatus,
        staleTime: 10_000,
    })
}

export function useVoltObservabilityTraces(
    query?: Record<string, string | number | undefined>
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltObservabilityTraces(query),
        queryKey: voltagentQueryKeys.observabilityTraces(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityTrace(traceId: string) {
    return useQuery({
        enabled: traceId.trim().length > 0,
        queryFn: () => fetchVoltObservabilityTrace(traceId),
        queryKey: voltagentQueryKeys.observabilityTrace(traceId),
        staleTime: 10_000,
    })
}

export function useVoltObservabilitySpan(spanId: string) {
    return useQuery({
        enabled: spanId.trim().length > 0,
        queryFn: () => fetchVoltObservabilitySpan(spanId),
        queryKey: voltagentQueryKeys.observabilitySpan(spanId),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityTraceLogs(traceId: string) {
    return useQuery({
        enabled: traceId.trim().length > 0,
        queryFn: () => fetchVoltObservabilityTraceLogs(traceId),
        queryKey: voltagentQueryKeys.observabilityTraceLogs(traceId),
        staleTime: 10_000,
    })
}

export function useVoltObservabilitySpanLogs(spanId: string) {
    return useQuery({
        enabled: spanId.trim().length > 0,
        queryFn: () => fetchVoltObservabilitySpanLogs(spanId),
        queryKey: voltagentQueryKeys.observabilitySpanLogs(spanId),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityLogs(
    query: VoltAgentObservabilityLogQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltObservabilityLogs(query),
        queryKey: voltagentQueryKeys.observabilityLogs(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityMemoryUsers(
    query: VoltAgentObservabilityMemoryUserQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltObservabilityMemoryUsers(query),
        queryKey: voltagentQueryKeys.observabilityMemoryUsers(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityMemoryConversations(
    query: VoltAgentObservabilityMemoryConversationQuery = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        queryFn: () => fetchVoltObservabilityMemoryConversations(query),
        queryKey: voltagentQueryKeys.observabilityMemoryConversations(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityMemoryMessages(
    conversationId: string,
    query: {
        agentId?: string
        after?: Date | string
        before?: Date | string
        limit?: number
        roles?: string[]
    } = {}
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        enabled: conversationId.trim().length > 0,
        queryFn: () => fetchVoltObservabilityMemoryMessages(conversationId, query),
        queryKey: voltagentQueryKeys.observabilityMemoryMessages(
            conversationId,
            queryKey
        ),
        staleTime: 10_000,
    })
}

export function useVoltObservabilityWorkingMemory(
    query: VoltAgentObservabilityWorkingMemoryQuery
) {
    const queryKey = serializeQueryKey(query)

    return useQuery({
        enabled:
            query.scope === 'user'
                ? (query.userId?.trim().length ?? 0) > 0
                : (query.conversationId?.trim().length ?? 0) > 0,
        queryFn: () => fetchVoltObservabilityWorkingMemory(query),
        queryKey: voltagentQueryKeys.observabilityWorkingMemory(queryKey),
        staleTime: 10_000,
    })
}

export function useVoltUpdates(): VoltQueryResult<VoltAgentUpdateInfo> {
    return useQuery({
        queryFn: fetchVoltCheckUpdates,
        queryKey: voltagentQueryKeys.updates,
        staleTime: 30_000,
    })
}

export function useVoltA2AAgentCard(
    serverId: string
): VoltQueryResult<VoltAgentA2AAgentCard> {
    return useQuery({
        enabled: serverId.trim().length > 0,
        queryFn: () => fetchVoltA2AAgentCard(serverId),
        queryKey: voltagentQueryKeys.a2aAgentCard(serverId),
        staleTime: 30_000,
    })
}

export function useVoltAgentText(
    agentId: string
): VoltMutationResult<VoltAgentTextResult, VoltAgentRunRequest> {
    return useMutation({
        mutationFn: (request) => fetchVoltAgentText(agentId, request),
    })
}

export function useVoltAgentObject(
    agentId: string
): VoltMutationResult<unknown, Parameters<typeof fetchVoltAgentObject>[1]> {
    return useMutation({
        mutationFn: (request) => fetchVoltAgentObject(agentId, request),
    })
}

export function useVoltExecuteTool(
    toolName: string
): VoltMutationResult<VoltAgentToolExecutionResult, VoltAgentToolExecutionRequest> {
    return useMutation({
        mutationFn: (request) => fetchVoltExecuteTool(toolName, request),
    })
}

export function useVoltExecuteWorkflow(
    workflowId: string
): VoltMutationResult<VoltAgentWorkflowExecutionResult, VoltAgentWorkflowExecuteRequest> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) => fetchVoltExecuteWorkflow(workflowId, request),
        onSuccess: () => invalidateWorkflowQueries(queryClient, workflowId),
    })
}

export function useVoltSuspendWorkflow(
    workflowId: string,
    executionId: string
): VoltMutationResult<VoltAgentWorkflowExecution, VoltAgentWorkflowSuspendRequest | undefined> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltSuspendWorkflow(workflowId, executionId, request ?? {}),
        onSuccess: () => invalidateWorkflowQueries(queryClient, workflowId),
    })
}

export function useVoltCancelWorkflow(
    workflowId: string,
    executionId: string
): VoltMutationResult<VoltAgentWorkflowExecution, VoltAgentWorkflowSuspendRequest | undefined> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltCancelWorkflow(workflowId, executionId, request ?? {}),
        onSuccess: () => invalidateWorkflowQueries(queryClient, workflowId),
    })
}

export function useVoltResumeWorkflow(
    workflowId: string,
    executionId: string
): VoltMutationResult<VoltAgentWorkflowExecutionResult, VoltAgentWorkflowResumeRequest | undefined> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltResumeWorkflow(workflowId, executionId, request ?? {}),
        onSuccess: () => invalidateWorkflowQueries(queryClient, workflowId),
    })
}

export function useVoltReplayWorkflow(
    workflowId: string,
    executionId: string
): VoltMutationResult<VoltAgentWorkflowExecutionResult, VoltAgentWorkflowReplayRequest> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltReplayWorkflow(workflowId, executionId, request),
        onSuccess: () => invalidateWorkflowQueries(queryClient, workflowId),
    })
}

export function useVoltSaveMemoryMessages(): VoltMutationResult<
    VoltAgentMemorySaveMessagesResult,
    VoltAgentMemorySaveMessagesRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: fetchVoltSaveMemoryMessages,
        onSuccess: () => invalidateMemoryQueries(queryClient),
    })
}

export function useVoltCreateMemoryConversation(): VoltMutationResult<
    { conversation: VoltAgentMemoryConversation },
    VoltAgentMemoryCreateConversationRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: fetchVoltCreateMemoryConversation,
        onSuccess: () => invalidateMemoryQueries(queryClient),
    })
}

export function useVoltUpdateMemoryConversation(
    conversationId: string
): VoltMutationResult<
    { conversation: VoltAgentMemoryConversation },
    VoltAgentMemoryConversationMutationRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltUpdateMemoryConversation(conversationId, request),
        onSuccess: () => invalidateMemoryQueries(queryClient, conversationId),
    })
}

export function useVoltDeleteMemoryConversation(
    conversationId: string,
    agentId?: string
): VoltMutationResult<
    VoltAgentMemoryDeleteConversationResult,
    void
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => fetchVoltDeleteMemoryConversation(conversationId, agentId),
        onSuccess: () => invalidateMemoryQueries(queryClient, conversationId),
    })
}

export function useVoltCloneMemoryConversation(
    conversationId: string
): VoltMutationResult<
    VoltAgentMemoryCloneConversationResult,
    VoltAgentMemoryCloneConversationRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) => fetchVoltCloneMemoryConversation(conversationId, request),
        onSuccess: () => invalidateMemoryQueries(queryClient, conversationId),
    })
}

export function useVoltUpdateMemoryWorkingMemory(
    conversationId: string
): VoltMutationResult<
    VoltAgentMemoryUpdateWorkingMemoryResult,
    VoltAgentMemoryUpdateWorkingMemoryRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) =>
            fetchVoltUpdateMemoryWorkingMemory(conversationId, request),
        onSuccess: () => invalidateMemoryQueries(queryClient, conversationId),
    })
}

export function useVoltDeleteMemoryMessages(): VoltMutationResult<
    VoltAgentMemoryDeleteMessagesResult,
    VoltAgentMemoryDeleteMessagesRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: fetchVoltDeleteMemoryMessages,
        onSuccess: (_, variables) =>
            invalidateMemoryQueries(queryClient, variables.conversationId),
    })
}

export function useVoltAgentMcpInvokeTool(
    serverId: string,
    toolName: string
): VoltMutationResult<unknown, VoltAgentMcpInvokeToolRequest | undefined> {
    return useMutation({
        mutationFn: (request) =>
            fetchVoltAgentMcpInvokeTool(serverId, toolName, request ?? {}),
    })
}

export function useVoltAgentMcpSetLogLevel(
    serverId: string
): VoltMutationResult<VoltAgentSimpleSuccessResult, VoltAgentMcpSetLogLevelRequest> {
    return useMutation({
        mutationFn: (request) => fetchVoltAgentMcpSetLogLevel(serverId, request),
    })
}

export function useVoltSetupObservability(): VoltMutationResult<
    unknown,
    VoltAgentObservabilitySetupRequest
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: fetchVoltSetupObservability,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: voltagentQueryKeys.observabilityStatus })
            void queryClient.invalidateQueries({ queryKey: ['voltagent', 'observability'] })
        },
    })
}

export function useVoltInstallUpdates(): VoltMutationResult<
    VoltAgentInstallUpdatesResult,
    VoltAgentInstallUpdatesRequest | undefined
> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request) => fetchVoltInstallUpdates(request ?? {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: voltagentQueryKeys.updates })
        },
    })
}

export function useVoltInstallPackageUpdate(
    packageName: string
): VoltMutationResult<VoltAgentInstallUpdatesResult, void> {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => fetchVoltInstallPackageUpdate(packageName),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: voltagentQueryKeys.updates })
        },
    })
}

export function useVoltA2AJsonRpc(
    serverId: string
): VoltMutationResult<VoltAgentA2AJsonRpcResponse, VoltAgentA2AJsonRpcRequest> {
    return useMutation({
        mutationFn: (request) => fetchVoltA2AJsonRpc(serverId, request),
    })
}
