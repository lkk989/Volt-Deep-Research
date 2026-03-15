import type { UIMessage } from 'ai'
import type {
    ConversationStepRecord,
    ObservabilityLogRecord,
    ObservabilitySpan,
    SearchResult,
} from '@voltagent/core'

export const DEFAULT_VOLTAGENT_BASE_URL =
    process.env.NEXT_PUBLIC_VOLTAGENT_URL?.trim() ?? 'http://localhost:3141'

export interface VoltAgentApiErrorResponse {
    error?: string
    success?: false
}

export interface VoltAgentApiSuccessResponse<T> {
    data: T
    success: true
    total?: number
    query?: Record<string, unknown>
}

export type VoltAgentApiResponse<T> =
    | VoltAgentApiSuccessResponse<T>
    | VoltAgentApiErrorResponse

export interface VoltAgentSummary {
    id: string
    name: string
    description?: string
    status: string
    model: string
    tools: unknown[]
    subAgents?: Array<{
        id?: string
        name?: string
    }>
    memory?: unknown
    isTelemetryEnabled: boolean
}

export interface VoltAgentAgentHistoryResult extends Record<string, unknown> {
    entries?: unknown[]
    items?: unknown[]
    limit?: number
    page?: number
    total?: number
}

export interface VoltAgentWorkflowSummary {
    id: string
    name: string
    purpose: string
    stepsCount: number
    status: 'idle' | 'running' | 'completed' | 'error'
}

export interface VoltAgentWorkflowStep {
    id: string
    name: string
    purpose?: string
    type: string
}

export interface VoltAgentWorkflowDetail {
    id: string
    inputSchema?: unknown
    name: string
    purpose: string
    resultSchema?: unknown
    resumeSchema?: unknown
    status: VoltAgentWorkflowSummary['status']
    steps: VoltAgentWorkflowStep[]
    suspendSchema?: unknown
}

export type VoltAgentWorkflowRunStatus =
    | 'running'
    | 'suspended'
    | 'completed'
    | 'cancelled'
    | 'error'

export interface VoltAgentWorkflowExecution {
    createdAt: string
    executionId: string
    metadata?: Record<string, unknown>
    result?: unknown
    status: VoltAgentWorkflowRunStatus
    suspension?: {
        [key: string]: unknown
        suspendedAt?: string
        reason?: string
    }
    updatedAt: string
    userId?: string
    workflowId: string
}

export interface VoltAgentWorkflowExecutionQuery {
    from?: Date | string
    limit?: number
    metadata?: Record<string, unknown>
    offset?: number
    status?: VoltAgentWorkflowRunStatus | 'success' | 'pending'
    to?: Date | string
    userId?: string
    workflowId?: string
}

export interface VoltAgentToolDefinition {
    id?: string
    name: string
    description?: string
    parameters?: Record<string, unknown>
    status?: string
}

export interface VoltAgentMcpServer {
    [key: string]: unknown
    capabilities?: Record<string, unknown>
    description?: string
    id: string
    name?: string
    packages?: Array<Record<string, unknown>>
    protocols?: {
        [key: string]: unknown
        http?: boolean
        sse?: boolean
    }
    remotes?: Array<Record<string, unknown>>
    transport?: string
}

export interface VoltAgentMcpTool {
    [key: string]: unknown
    description?: string
    inputSchema?: Record<string, unknown>
    name: string
}

export interface VoltAgentMcpPrompt {
    [key: string]: unknown
    arguments?: Array<Record<string, unknown>>
    description?: string
    messages?: unknown[]
    name: string
}

export interface VoltAgentMcpPromptQuery {
    arguments?: Record<string, string>
}

export interface VoltAgentMcpResource {
    [key: string]: unknown
    description?: string
    mimeType?: string
    name?: string
    title?: string
    uri: string
}

export interface VoltAgentMcpResourceContents {
    [key: string]: unknown
    contents?: unknown[]
}

export interface VoltAgentMcpResourceTemplate {
    [key: string]: unknown
    description?: string
    mimeType?: string
    name?: string
    uriTemplate?: string
}

export interface VoltAgentLogEntry {
    [key: string]: unknown
}

export interface VoltAgentLogsResult {
    data: VoltAgentLogEntry[]
    query: Record<string, unknown>
    total: number
}

export interface VoltAgentLogsQuery {
    agentId?: string
    conversationId?: string
    executionId?: string
    level?: string
    limit?: number
    since?: Date | string
    until?: Date | string
    workflowId?: string
}

export interface VoltAgentMemoryConversation {
    agentId?: string
    agentName?: string
    createdAt?: string
    id: string
    metadata?: Record<string, unknown>
    title?: string
    updatedAt?: string
    userId: string
}

export interface VoltAgentConversationListResult {
    conversations: VoltAgentMemoryConversation[]
    limit?: number
    offset?: number
    total?: number
}

export interface VoltAgentConversationQuery {
    agentId?: string
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: string
    resourceId?: string
    userId?: string
}

export interface VoltAgentMemoryMessagesResult {
    conversation: VoltAgentMemoryConversation
    messages: UIMessage[]
}

export interface VoltAgentConversationMessagesQuery {
    after?: Date | string
    agentId?: string
    before?: Date | string
    limit?: number
    roles?: string[]
    userId?: string
}

export interface VoltAgentWorkingMemoryResult {
    scope?: string
    value: unknown
}

export interface VoltAgentConversationWorkingMemoryQuery {
    agentId?: string
    scope?: 'user' | 'conversation'
    userId?: string
}

export interface VoltAgentMemorySearchResult {
    count: number
    query: string
    results: SearchResult[]
}

export interface VoltAgentMemorySearchQuery {
    agentId?: string
    conversationId?: string
    limit?: number
    searchQuery: string
    threshold?: number
    userId?: string
}

export interface VoltAgentWorkspaceInfo {
    capabilities?: {
        filesystem?: boolean
        sandbox?: boolean
        search?: boolean
        skills?: boolean
    }
    id: string
    name?: string
    scope?: 'agent' | 'conversation'
}

export interface VoltAgentWorkspaceFileEntry {
    is_dir: boolean
    modified_at?: string
    path: string
    size?: number
}

export interface VoltAgentWorkspaceFileList {
    entries: VoltAgentWorkspaceFileEntry[]
    path: string
}

export interface VoltAgentWorkspaceFileRead {
    content: string
    path: string
}

export interface VoltAgentWorkspaceReadQuery {
    limit?: number
    offset?: number
    path: string
}

export interface VoltAgentWorkspaceSkillListItem {
    active?: boolean
    description?: string
    id: string
    name: string
    path: string
    tags?: string[]
    version?: string
}

export interface VoltAgentWorkspaceSkillDetail
    extends VoltAgentWorkspaceSkillListItem {
    [key: string]: unknown
}

export interface VoltAgentObservabilityTrace {
    spanCount: number
    spans: ObservabilitySpan[]
    traceId: string
    tree: unknown
}

export interface VoltAgentObservabilityTracesResult {
    count: number
    traces: VoltAgentObservabilityTrace[]
}

export interface VoltAgentObservabilityStatus {
    enabled: boolean
    logCount: number
    message: string
    resumableStream: {
        enabled: boolean
        store: string | null
        storeDisplayName: string | null
    }
    spanCount: number
    storage: string
    storageAdapter: string | null
    storageDescription: string | null
    storageDisplayName: string | null
    storagePersistent: boolean | null
    traceCount: number
    websocket: boolean
}

export interface VoltAgentObservabilityLogsResult {
    count: number
    filter?: Record<string, unknown>
    logs: ObservabilityLogRecord[]
}

export interface VoltAgentObservabilityLogQuery {
    endTime?: Date | string
    limit?: number
    severityNumber?: number
    severityText?: string
    spanId?: string
    startTime?: Date | string
    traceId?: string
}

export interface VoltAgentObservabilityMemoryUserSummary {
    agents: Array<{
        agentId: string
        agentName: string
        conversationCount: number
        lastInteractionAt?: string
    }>
    conversationCount: number
    lastInteractionAt?: string
    userId: string
}

export interface VoltAgentObservabilityMemoryUsersResult {
    limit: number
    offset: number
    total: number
    users: VoltAgentObservabilityMemoryUserSummary[]
}

export interface VoltAgentObservabilityMemoryUserQuery {
    agentId?: string
    limit?: number
    offset?: number
    search?: string
}

export interface VoltAgentObservabilityMemoryConversationsResult {
    conversations: VoltAgentMemoryConversation[]
    limit: number
    offset: number
    total: number
}

export interface VoltAgentObservabilityMemoryConversationQuery {
    agentId?: string
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: string
    userId?: string
}

export interface VoltAgentConversationStepsResult {
    conversation: VoltAgentMemoryConversation
    steps: ConversationStepRecord[]
}

export interface VoltAgentConversationStepsQuery {
    agentId?: string
    limit?: number
    operationId?: string
}

export interface VoltAgentObservabilityWorkingMemoryResult {
    agentId: string | null
    agentName: string | null
    content: unknown
    format: string | null
    scope: 'user' | 'conversation'
    template: unknown
}

export interface VoltAgentObservabilityWorkingMemoryQuery {
    agentId?: string
    conversationId?: string
    scope: 'user' | 'conversation'
    userId?: string
}

export interface VoltAgentRunRequest extends Record<string, unknown> {
    input: unknown
    options?: Record<string, unknown>
}

export interface VoltAgentTextResult {
    feedback?: unknown
    finishReason?: string | null
    output?: unknown
    text: string
    toolCalls?: unknown[]
    toolResults?: unknown[]
    usage?: unknown
}

export interface VoltAgentObjectRequest extends Record<string, unknown> {
    input: unknown
    options?: Record<string, unknown>
    schema: Record<string, unknown>
}

export interface VoltAgentToolExecutionRequest {
    context?: Record<string, unknown>
    conversationId?: string
    input?: unknown
    userId?: string
}

export interface VoltAgentToolExecutionResult {
    agentId?: string
    executionTime?: number
    result: unknown
    timestamp?: string
    toolName: string
}

export interface VoltAgentWorkflowExecuteRequest {
    input?: unknown
    options?: Record<string, unknown>
}

export interface VoltAgentWorkflowSuspendRequest {
    reason?: string
}

export interface VoltAgentWorkflowResumeRequest {
    options?: {
        stepId?: string
    }
    resumeData?: unknown
}

export interface VoltAgentWorkflowReplayRequest {
    executionId?: string
    inputData?: unknown
    resumeData?: unknown
    stepId: string
    workflowStateOverride?: unknown
}

export interface VoltAgentWorkflowExecutionResult {
    endAt?: string | null
    executionId: string
    result?: unknown
    startAt?: string | null
    status: string
}

export interface VoltAgentMemorySaveMessagesRequest {
    agentId?: string
    conversationId?: string
    messages: Array<
        UIMessage | { conversationId?: string; message: UIMessage; userId?: string }
    >
    userId?: string
}

export interface VoltAgentMemorySaveMessagesResult {
    saved: number
}

export interface VoltAgentMemoryCreateConversationRequest {
    agentId?: string
    conversationId?: string
    metadata?: Record<string, unknown>
    resourceId?: string
    title?: string
    userId: string
}

export interface VoltAgentMemoryConversationMutationRequest {
    agentId?: string
    metadata?: Record<string, unknown>
    resourceId?: string
    title?: string
    userId?: string
}

export interface VoltAgentMemoryCloneConversationRequest {
    agentId?: string
    includeMessages?: boolean
    metadata?: Record<string, unknown>
    newConversationId?: string
    resourceId?: string
    title?: string
    userId?: string
}

export interface VoltAgentMemoryCloneConversationResult {
    conversation: VoltAgentMemoryConversation
    messageCount: number
}

export interface VoltAgentMemoryDeleteConversationResult {
    deleted: boolean
}

export interface VoltAgentMemoryUpdateWorkingMemoryRequest {
    agentId?: string
    content: unknown
    mode?: string
    userId?: string
}

export interface VoltAgentMemoryUpdateWorkingMemoryResult {
    updated: boolean
}

export interface VoltAgentMemoryDeleteMessagesRequest {
    agentId?: string
    conversationId: string
    messageIds: string[]
    userId: string
}

export interface VoltAgentMemoryDeleteMessagesResult {
    deleted: number
}

export interface VoltAgentMcpInvokeToolRequest {
    arguments?: Record<string, unknown>
    context?: Record<string, unknown>
}

export interface VoltAgentMcpSetLogLevelRequest {
    level: string
}

export interface VoltAgentSimpleSuccessResult {
    success: boolean
}

export interface VoltAgentObservabilitySetupRequest {
    publicKey: string
    secretKey: string
}

export type VoltAgentUpdateInfo = Record<string, unknown>

export interface VoltAgentInstallUpdatesRequest {
    packageName?: string
}

export interface VoltAgentInstallUpdatesResult {
    message: string
}

export type VoltAgentA2AAgentCard = Record<string, unknown>

export type VoltAgentA2AJsonRpcRequest = Record<string, unknown>

export type VoltAgentA2AJsonRpcResponse = Record<string, unknown>

function buildUrl(
    path: string,
    searchParams?: Record<string, string | number | undefined>
): string {
    const url = new URL(path, DEFAULT_VOLTAGENT_BASE_URL)

    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            if (value === undefined) {
                continue
            }

            url.searchParams.set(key, String(value))
        }
    }

    return url.toString()
}

function serializeDate(value: Date | string | undefined): string | undefined {
    if (value === undefined) {
        return undefined
    }

    return value instanceof Date ? value.toISOString() : value
}

function mapNumberQuery(value: number | undefined): number | undefined {
    return typeof value === 'number' ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function normalizeWorkflowStatus(
    value: unknown
): VoltAgentWorkflowSummary['status'] {
    switch (value) {
        case 'running':
        case 'completed':
        case 'error':
            return value
        default:
            return 'idle'
    }
}

function normalizeWorkflowStep(
    step: unknown,
    index: number
): VoltAgentWorkflowStep {
    if (!isRecord(step)) {
        const fallbackName = `Step ${index + 1}`

        return {
            id: `step-${index + 1}`,
            name: fallbackName,
            type: 'step',
        }
    }

    const id =
        typeof step.id === 'string' && step.id.trim().length > 0
            ? step.id
            : `step-${index + 1}`
    const name =
        typeof step.name === 'string' && step.name.trim().length > 0
            ? step.name
            : id
    const type =
        typeof step.type === 'string' && step.type.trim().length > 0
            ? step.type
            : 'step'
    const purpose =
        typeof step.purpose === 'string' && step.purpose.trim().length > 0
            ? step.purpose
            : undefined

    return {
        id,
        name,
        purpose,
        type,
    }
}

function extractWorkflowEntries(payload: unknown): Array<[string, unknown]> {
    if (Array.isArray(payload)) {
        return payload.map((workflow, index) => {
            if (isRecord(workflow) && typeof workflow.id === 'string') {
                return [workflow.id, workflow]
            }

            return [`workflow-${index + 1}`, workflow]
        })
    }

    if (!isRecord(payload)) {
        return []
    }

    if (isRecord(payload.workflows)) {
        return Object.entries(payload.workflows)
    }

    return Object.entries(payload)
}

function normalizeWorkflowDetail(
    workflowId: string,
    workflow: unknown
): VoltAgentWorkflowDetail {
    const details = isRecord(workflow) ? workflow : {}
    const id =
        typeof details.id === 'string' && details.id.trim().length > 0
            ? details.id
            : workflowId
    const name =
        typeof details.name === 'string' && details.name.trim().length > 0
            ? details.name
            : id
    const purpose =
        typeof details.purpose === 'string' ? details.purpose : ''
    const steps = Array.isArray(details.steps)
        ? details.steps.map((step, index) => normalizeWorkflowStep(step, index))
        : []

    return {
        id,
        inputSchema: details.inputSchema,
        name,
        purpose,
        resultSchema: details.resultSchema,
        resumeSchema: details.resumeSchema,
        status: normalizeWorkflowStatus(details.status),
        steps,
        suspendSchema: details.suspendSchema,
    }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`VoltAgent request failed with status ${response.status}`)
    }

    return (await response.json()) as T
}

async function getVoltAgentResponse<T>(
    path: string,
    searchParams?: Record<string, string | number | undefined>
): Promise<T> {
    const response = await fetch(buildUrl(path, searchParams), {
        headers: {
            Accept: 'application/json',
        },
    })

    return parseJsonResponse<T>(response)
}

async function getVoltAgentSuccessData<T>(
    path: string,
    searchParams?: Record<string, string | number | undefined>
): Promise<T> {
    const response = await getVoltAgentResponse<VoltAgentApiResponse<T>>(
        path,
        searchParams
    )

    if ('success' in response && response.success === true) {
        return response.data
    }

    throw new Error(response.error ?? 'VoltAgent request did not succeed')
}

async function sendVoltAgentSuccessData<TResponse, TBody>(
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: TBody,
    searchParams?: Record<string, string | number | undefined>
): Promise<TResponse> {
    const response = await fetch(buildUrl(path, searchParams), {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method,
    })

    const payload = await parseJsonResponse<VoltAgentApiResponse<TResponse>>(response)

    if ('success' in payload && payload.success === true) {
        return payload.data
    }

    throw new Error(payload.error ?? 'VoltAgent request did not succeed')
}

export function getVoltAgentChatEndpoint(agentId: string): string {
    return buildUrl(`/agents/${agentId}/chat`)
}

export function getVoltAgentTextEndpoint(agentId: string): string {
    return buildUrl(`/agents/${agentId}/text`)
}

export function getVoltAgentStreamEndpoint(agentId: string): string {
    return buildUrl(`/agents/${agentId}/stream`)
}

export function getVoltAgentObjectEndpoint(agentId: string): string {
    return buildUrl(`/agents/${agentId}/object`)
}

export function getVoltAgentStreamObjectEndpoint(agentId: string): string {
    return buildUrl(`/agents/${agentId}/stream-object`)
}

export function getVoltToolExecuteEndpoint(toolName: string): string {
    return buildUrl(`/tools/${toolName}/execute`)
}

export function getVoltMcpLogLevelEndpoint(serverId: string): string {
    return buildUrl(`/mcp/servers/${serverId}/logging/level`)
}

export function getVoltA2AAgentCardEndpoint(serverId: string): string {
    return buildUrl(`/.well-known/${serverId}/agent-card.json`)
}

export function getVoltA2AJsonRpcEndpoint(serverId: string): string {
    return buildUrl(`/a2a/${serverId}`)
}

export function getVoltUpdatesEndpoint(): string {
    return buildUrl('/updates')
}

export function getVoltPackageUpdateEndpoint(packageName: string): string {
    return buildUrl(`/updates/${packageName}`)
}

export function getVoltSetupObservabilityEndpoint(): string {
    return buildUrl('/setup-observability')
}

export function getVoltAgentChatResumeEndpoint(
    agentId: string,
    conversationId: string,
    userId: string
): string {
    return buildUrl(`/agents/${agentId}/chat/${conversationId}/stream`, {
        userId,
    })
}

export function getVoltWorkflowExecuteEndpoint(workflowId: string): string {
    return buildUrl(`/workflows/${workflowId}/execute`)
}

export function getVoltWorkflowStreamEndpoint(workflowId: string): string {
    return buildUrl(`/workflows/${workflowId}/stream`)
}

export function getVoltWorkflowExecutionStreamEndpoint(
    workflowId: string,
    executionId: string,
    fromSequence?: string | number
): string {
    return buildUrl(`/workflows/${workflowId}/executions/${executionId}/stream`, {
        fromSequence,
    })
}

export function getVoltWorkflowExecutionResumeEndpoint(
    workflowId: string,
    executionId: string
): string {
    return buildUrl(`/workflows/${workflowId}/executions/${executionId}/resume`)
}

export function getVoltWorkflowExecutionSuspendEndpoint(
    workflowId: string,
    executionId: string
): string {
    return buildUrl(`/workflows/${workflowId}/executions/${executionId}/suspend`)
}

export function getVoltWorkflowExecutionCancelEndpoint(
    workflowId: string,
    executionId: string
): string {
    return buildUrl(`/workflows/${workflowId}/executions/${executionId}/cancel`)
}

export function getVoltWorkflowExecutionReplayEndpoint(
    workflowId: string,
    executionId: string
): string {
    return buildUrl(`/workflows/${workflowId}/executions/${executionId}/replay`)
}

export async function fetchVoltAgentList(): Promise<VoltAgentSummary[]> {
    return getVoltAgentSuccessData<VoltAgentSummary[]>('/agents')
}

export async function fetchVoltAgent(agentId: string): Promise<VoltAgentSummary> {
    return getVoltAgentSuccessData<VoltAgentSummary>(`/agents/${agentId}`)
}

export async function fetchVoltAgentHistory(
    agentId: string,
    page = 0,
    limit = 10
): Promise<VoltAgentAgentHistoryResult> {
    return getVoltAgentSuccessData<VoltAgentAgentHistoryResult>(
        `/agents/${agentId}/history`,
        {
            limit,
            page,
        }
    )
}

export async function fetchVoltAgentText(
    agentId: string,
    request: VoltAgentRunRequest
): Promise<VoltAgentTextResult> {
    return sendVoltAgentSuccessData<VoltAgentTextResult, VoltAgentRunRequest>(
        `/agents/${agentId}/text`,
        'POST',
        request
    )
}

export async function fetchVoltAgentObject(
    agentId: string,
    request: VoltAgentObjectRequest
): Promise<unknown> {
    return sendVoltAgentSuccessData<unknown, VoltAgentObjectRequest>(
        `/agents/${agentId}/object`,
        'POST',
        request
    )
}

export async function fetchVoltAgentWorkspaceInfo(
    agentId: string
): Promise<VoltAgentWorkspaceInfo> {
    return getVoltAgentSuccessData<VoltAgentWorkspaceInfo>(
        `/agents/${agentId}/workspace`
    )
}

export async function fetchVoltAgentWorkspaceFiles(
    agentId: string,
    path = '/'
): Promise<VoltAgentWorkspaceFileList> {
    return getVoltAgentSuccessData<VoltAgentWorkspaceFileList>(
        `/agents/${agentId}/workspace/ls`,
        { path }
    )
}

export async function fetchVoltAgentWorkspaceFile(
    agentId: string,
    query: VoltAgentWorkspaceReadQuery
): Promise<VoltAgentWorkspaceFileRead> {
    return getVoltAgentSuccessData<VoltAgentWorkspaceFileRead>(
        `/agents/${agentId}/workspace/read`,
        {
            limit: mapNumberQuery(query.limit),
            offset: mapNumberQuery(query.offset),
            path: query.path,
        }
    )
}

export async function fetchVoltAgentWorkspaceSkills(
    agentId: string
): Promise<VoltAgentWorkspaceSkillListItem[]> {
    const result = await getVoltAgentSuccessData<{
        skills: VoltAgentWorkspaceSkillListItem[]
    }>(`/agents/${agentId}/workspace/skills`)

    return result.skills
}

export async function fetchVoltAgentWorkspaceSkill(
    agentId: string,
    skillId: string
): Promise<VoltAgentWorkspaceSkillDetail> {
    return getVoltAgentSuccessData<VoltAgentWorkspaceSkillDetail>(
        `/agents/${agentId}/workspace/skills/${skillId}`
    )
}

export async function fetchVoltAgentWorkflowDefinitions(): Promise<
    VoltAgentWorkflowDetail[]
> {
    const response = await getVoltAgentResponse<unknown>('/workflows')

    return extractWorkflowEntries(response).map(([id, workflow]) =>
        normalizeWorkflowDetail(id, workflow)
    )
}

export async function fetchVoltAgentWorkflow(
    workflowId: string
): Promise<VoltAgentWorkflowDetail> {
    const workflows = await fetchVoltAgentWorkflowDefinitions()
    const workflow = workflows.find((candidate) => candidate.id === workflowId)

    if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
    }

    return workflow
}

export async function fetchVoltAgentWorkflowExecutions(
    query: VoltAgentWorkflowExecutionQuery = {}
): Promise<VoltAgentWorkflowExecution[]> {
    return getVoltAgentSuccessData<VoltAgentWorkflowExecution[]>(
        '/workflows/executions',
        {
            from: serializeDate(query.from),
            limit: mapNumberQuery(query.limit),
            metadata: query.metadata ? JSON.stringify(query.metadata) : undefined,
            offset: mapNumberQuery(query.offset),
            status: query.status,
            to: serializeDate(query.to),
            userId: query.userId,
            workflowId: query.workflowId,
        }
    )
}

export async function fetchVoltAgentWorkflowExecutionState(
    workflowId: string,
    executionId: string
): Promise<VoltAgentWorkflowExecution> {
    return getVoltAgentSuccessData<VoltAgentWorkflowExecution>(
        `/workflows/${workflowId}/executions/${executionId}/state`
    )
}

export async function fetchVoltAgentWorkflows(): Promise<VoltAgentWorkflowSummary[]> {
    const workflows = await fetchVoltAgentWorkflowDefinitions()

    return workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        purpose: workflow.purpose,
        status: workflow.status,
        stepsCount: workflow.steps.length,
    }))
}

export async function fetchVoltAgentTools(): Promise<VoltAgentToolDefinition[]> {
    return getVoltAgentSuccessData<VoltAgentToolDefinition[]>('/tools')
}

export async function fetchVoltAgentMcpServers(): Promise<VoltAgentMcpServer[]> {
    const result = await getVoltAgentSuccessData<{
        servers: VoltAgentMcpServer[]
    }>('/mcp/servers')

    return result.servers
}

export async function fetchVoltAgentMcpServer(
    serverId: string
): Promise<VoltAgentMcpServer> {
    return getVoltAgentSuccessData<VoltAgentMcpServer>(
        `/mcp/servers/${serverId}`
    )
}

export async function fetchVoltAgentMcpTools(
    serverId: string
): Promise<VoltAgentMcpTool[]> {
    const result = await getVoltAgentSuccessData<{
        server: VoltAgentMcpServer
        tools: VoltAgentMcpTool[]
    }>(
        `/mcp/servers/${serverId}/tools`
    )

    return result.tools
}

export async function fetchVoltAgentMcpTool(
    serverId: string,
    toolName: string
): Promise<VoltAgentMcpTool> {
    return getVoltAgentSuccessData<VoltAgentMcpTool>(
        `/mcp/servers/${serverId}/tools/${toolName}`
    )
}

export async function fetchVoltAgentMcpInvokeTool(
    serverId: string,
    toolName: string,
    request: VoltAgentMcpInvokeToolRequest = {}
): Promise<unknown> {
    return sendVoltAgentSuccessData<unknown, VoltAgentMcpInvokeToolRequest>(
        `/mcp/servers/${serverId}/tools/${toolName}`,
        'POST',
        request
    )
}

export async function fetchVoltAgentMcpPrompts(
    serverId: string
): Promise<VoltAgentMcpPrompt[]> {
    const result = await getVoltAgentSuccessData<{
        prompts: VoltAgentMcpPrompt[]
    }>(
        `/mcp/servers/${serverId}/prompts`
    )

    return result.prompts
}

export async function fetchVoltAgentMcpPrompt(
    serverId: string,
    promptName: string,
    query: VoltAgentMcpPromptQuery = {}
): Promise<VoltAgentMcpPrompt> {
    return getVoltAgentSuccessData<VoltAgentMcpPrompt>(
        `/mcp/servers/${serverId}/prompts/${promptName}`,
        {
            ...query.arguments,
        }
    )
}

export async function fetchVoltAgentMcpResources(
    serverId: string
): Promise<VoltAgentMcpResource[]> {
    const result = await getVoltAgentSuccessData<{
        resources: VoltAgentMcpResource[]
    }>(`/mcp/servers/${serverId}/resources`)

    return result.resources
}

export async function fetchVoltAgentMcpResource(
    serverId: string,
    uri: string
): Promise<VoltAgentMcpResourceContents> {
    return getVoltAgentSuccessData<VoltAgentMcpResourceContents>(
        `/mcp/servers/${serverId}/resources/contents`,
        {
            uri,
        }
    )
}

export async function fetchVoltAgentMcpResourceTemplates(
    serverId: string
): Promise<VoltAgentMcpResourceTemplate[]> {
    const result = await getVoltAgentSuccessData<{
        resourceTemplates: VoltAgentMcpResourceTemplate[]
    }>(`/mcp/servers/${serverId}/resource-templates`)

    return result.resourceTemplates
}

export async function fetchVoltAgentMcpSetLogLevel(
    serverId: string,
    request: VoltAgentMcpSetLogLevelRequest
): Promise<VoltAgentSimpleSuccessResult> {
    return sendVoltAgentSuccessData<
        VoltAgentSimpleSuccessResult,
        VoltAgentMcpSetLogLevelRequest
    >(`/mcp/servers/${serverId}/logging/level`, 'POST', request)
}

export async function fetchVoltConversationMessages(
    conversationId: string,
    userId: string,
    agentId?: string
): Promise<UIMessage[]> {
    const result = await getVoltAgentSuccessData<VoltAgentMemoryMessagesResult>(
        `/api/memory/conversations/${conversationId}/messages`,
        {
            agentId,
            userId,
        }
    )

    return result.messages
}

export async function fetchVoltMemoryConversationMessages(
    conversationId: string,
    query: VoltAgentConversationMessagesQuery = {}
): Promise<VoltAgentMemoryMessagesResult> {
    return getVoltAgentSuccessData<VoltAgentMemoryMessagesResult>(
        `/api/memory/conversations/${conversationId}/messages`,
        {
            after: serializeDate(query.after),
            agentId: query.agentId,
            before: serializeDate(query.before),
            limit: mapNumberQuery(query.limit),
            roles: query.roles?.join(','),
            userId: query.userId,
        }
    )
}

export async function fetchVoltConversation(
    conversationId: string,
    agentId?: string
): Promise<VoltAgentMemoryConversation> {
    return getVoltAgentSuccessData<VoltAgentMemoryConversation>(
        `/api/memory/conversations/${conversationId}`,
        {
            agentId,
        }
    )
}

export async function fetchVoltConversations(
    agentId: string,
    userId: string
): Promise<VoltAgentMemoryConversation[]> {
    const result = await getVoltAgentSuccessData<VoltAgentConversationListResult>(
        '/api/memory/conversations',
        {
            agentId,
            userId,
        }
    )

    return result.conversations
}

export async function fetchVoltMemoryConversations(
    query: VoltAgentConversationQuery = {}
): Promise<VoltAgentConversationListResult> {
    return getVoltAgentSuccessData<VoltAgentConversationListResult>(
        '/api/memory/conversations',
        {
            agentId: query.agentId,
            limit: mapNumberQuery(query.limit),
            offset: mapNumberQuery(query.offset),
            orderBy: query.orderBy,
            orderDirection: query.orderDirection,
            resourceId: query.resourceId,
            userId: query.userId,
        }
    )
}

export async function fetchVoltConversationWorkingMemory(
    conversationId: string,
    agentId?: string,
    userId?: string
): Promise<VoltAgentWorkingMemoryResult | null> {
    try {
        return await getVoltAgentSuccessData<VoltAgentWorkingMemoryResult>(
            `/api/memory/conversations/${conversationId}/working-memory`,
            {
                agentId,
                scope:
                    typeof userId === 'string' && userId.trim().length > 0
                        ? 'user'
                        : 'conversation',
                userId,
            }
        )
    } catch {
        return null
    }
}

export async function fetchVoltMemoryWorkingMemory(
    conversationId: string,
    query: VoltAgentConversationWorkingMemoryQuery = {}
): Promise<VoltAgentWorkingMemoryResult | null> {
    try {
        return await getVoltAgentSuccessData<VoltAgentWorkingMemoryResult>(
            `/api/memory/conversations/${conversationId}/working-memory`,
            {
                agentId: query.agentId,
                scope: query.scope,
                userId: query.userId,
            }
        )
    } catch {
        return null
    }
}

export async function fetchVoltMemorySearch(
    query: VoltAgentMemorySearchQuery
): Promise<VoltAgentMemorySearchResult> {
    return getVoltAgentSuccessData<VoltAgentMemorySearchResult>(
        '/api/memory/search',
        {
            agentId: query.agentId,
            conversationId: query.conversationId,
            limit: mapNumberQuery(query.limit),
            searchQuery: query.searchQuery,
            threshold: query.threshold,
            userId: query.userId,
        }
    )
}

export async function fetchVoltSaveMemoryMessages(
    request: VoltAgentMemorySaveMessagesRequest
): Promise<VoltAgentMemorySaveMessagesResult> {
    return sendVoltAgentSuccessData<
        VoltAgentMemorySaveMessagesResult,
        VoltAgentMemorySaveMessagesRequest
    >('/api/memory/save-messages', 'POST', request)
}

export async function fetchVoltCreateMemoryConversation(
    request: VoltAgentMemoryCreateConversationRequest
): Promise<{ conversation: VoltAgentMemoryConversation }> {
    return sendVoltAgentSuccessData<
        { conversation: VoltAgentMemoryConversation },
        VoltAgentMemoryCreateConversationRequest
    >('/api/memory/conversations', 'POST', request)
}

export async function fetchVoltUpdateMemoryConversation(
    conversationId: string,
    request: VoltAgentMemoryConversationMutationRequest
): Promise<{ conversation: VoltAgentMemoryConversation }> {
    return sendVoltAgentSuccessData<
        { conversation: VoltAgentMemoryConversation },
        VoltAgentMemoryConversationMutationRequest
    >(`/api/memory/conversations/${conversationId}`, 'PATCH', request)
}

export async function fetchVoltDeleteMemoryConversation(
    conversationId: string,
    agentId?: string
): Promise<VoltAgentMemoryDeleteConversationResult> {
    return sendVoltAgentSuccessData<VoltAgentMemoryDeleteConversationResult, never>(
        `/api/memory/conversations/${conversationId}`,
        'DELETE',
        undefined,
        { agentId }
    )
}

export async function fetchVoltCloneMemoryConversation(
    conversationId: string,
    request: VoltAgentMemoryCloneConversationRequest
): Promise<VoltAgentMemoryCloneConversationResult> {
    return sendVoltAgentSuccessData<
        VoltAgentMemoryCloneConversationResult,
        VoltAgentMemoryCloneConversationRequest
    >(`/api/memory/conversations/${conversationId}/clone`, 'POST', request)
}

export async function fetchVoltUpdateMemoryWorkingMemory(
    conversationId: string,
    request: VoltAgentMemoryUpdateWorkingMemoryRequest
): Promise<VoltAgentMemoryUpdateWorkingMemoryResult> {
    return sendVoltAgentSuccessData<
        VoltAgentMemoryUpdateWorkingMemoryResult,
        VoltAgentMemoryUpdateWorkingMemoryRequest
    >(`/api/memory/conversations/${conversationId}/working-memory`, 'POST', request)
}

export async function fetchVoltDeleteMemoryMessages(
    request: VoltAgentMemoryDeleteMessagesRequest
): Promise<VoltAgentMemoryDeleteMessagesResult> {
    return sendVoltAgentSuccessData<
        VoltAgentMemoryDeleteMessagesResult,
        VoltAgentMemoryDeleteMessagesRequest
    >('/api/memory/messages/delete', 'POST', request)
}

export async function fetchVoltAgentLogs(
    agentId: string,
    limit = 20
): Promise<VoltAgentLogsResult> {
    return fetchVoltLogs({ agentId, limit })
}

export async function fetchVoltLogs(
    query: VoltAgentLogsQuery = {}
): Promise<VoltAgentLogsResult> {
    const response = await getVoltAgentResponse<{
        data?: VoltAgentLogEntry[]
        error?: string
        query?: Record<string, unknown>
        success?: boolean
        total?: number
    }>('/api/logs', {
        agentId: query.agentId,
        conversationId: query.conversationId,
        executionId: query.executionId,
        level: query.level,
        limit: mapNumberQuery(query.limit),
        since: serializeDate(query.since),
        until: serializeDate(query.until),
        workflowId: query.workflowId,
    })

    if (response.success !== true || !Array.isArray(response.data)) {
        throw new Error(response.error ?? 'VoltAgent log request did not succeed')
    }

    return {
        data: response.data,
        query: response.query ?? {},
        total: typeof response.total === 'number' ? response.total : 0,
    }
}

export async function fetchVoltObservabilityStatus(): Promise<VoltAgentObservabilityStatus> {
    return getVoltAgentSuccessData<VoltAgentObservabilityStatus>(
        '/observability/status'
    )
}

export async function fetchVoltObservabilityTraces(
    query?: Record<string, string | number | undefined>
): Promise<VoltAgentObservabilityTracesResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityTracesResult>(
        '/observability/traces',
        query
    )
}

export async function fetchVoltObservabilityTrace(
    traceId: string
): Promise<VoltAgentObservabilityTrace> {
    return getVoltAgentSuccessData<VoltAgentObservabilityTrace>(
        `/observability/traces/${traceId}`
    )
}

export async function fetchVoltObservabilitySpan(
    spanId: string
): Promise<ObservabilitySpan> {
    return getVoltAgentSuccessData<ObservabilitySpan>(
        `/observability/spans/${spanId}`
    )
}

export async function fetchVoltObservabilityTraceLogs(
    traceId: string
): Promise<VoltAgentObservabilityLogsResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityLogsResult>(
        `/observability/traces/${traceId}/logs`
    )
}

export async function fetchVoltObservabilitySpanLogs(
    spanId: string
): Promise<VoltAgentObservabilityLogsResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityLogsResult>(
        `/observability/spans/${spanId}/logs`
    )
}

export async function fetchVoltObservabilityLogs(
    query: VoltAgentObservabilityLogQuery = {}
): Promise<VoltAgentObservabilityLogsResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityLogsResult>(
        '/observability/logs',
        {
            endTime: serializeDate(query.endTime),
            limit: mapNumberQuery(query.limit),
            severityNumber: query.severityNumber,
            severityText: query.severityText,
            spanId: query.spanId,
            startTime: serializeDate(query.startTime),
            traceId: query.traceId,
        }
    )
}

export async function fetchVoltObservabilityMemoryUsers(
    query: VoltAgentObservabilityMemoryUserQuery = {}
): Promise<VoltAgentObservabilityMemoryUsersResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityMemoryUsersResult>(
        '/observability/memory/users',
        {
            agentId: query.agentId,
            limit: mapNumberQuery(query.limit),
            offset: mapNumberQuery(query.offset),
            search: query.search,
        }
    )
}

export async function fetchVoltObservabilityMemoryConversations(
    query: VoltAgentObservabilityMemoryConversationQuery = {}
): Promise<VoltAgentObservabilityMemoryConversationsResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityMemoryConversationsResult>(
        '/observability/memory/conversations',
        {
            agentId: query.agentId,
            limit: mapNumberQuery(query.limit),
            offset: mapNumberQuery(query.offset),
            orderBy: query.orderBy,
            orderDirection: query.orderDirection,
            userId: query.userId,
        }
    )
}

export async function fetchVoltObservabilityMemoryMessages(
    conversationId: string,
    query: {
        agentId?: string
        after?: Date | string
        before?: Date | string
        limit?: number
        roles?: string[]
    } = {}
): Promise<VoltAgentMemoryMessagesResult> {
    return getVoltAgentSuccessData<VoltAgentMemoryMessagesResult>(
        `/observability/memory/conversations/${conversationId}/messages`,
        {
            after: serializeDate(query.after),
            agentId: query.agentId,
            before: serializeDate(query.before),
            limit: mapNumberQuery(query.limit),
            roles: query.roles?.join(','),
        }
    )
}

export async function fetchVoltObservabilityConversationSteps(
    conversationId: string,
    query: VoltAgentConversationStepsQuery = {}
): Promise<VoltAgentConversationStepsResult> {
    return getVoltAgentSuccessData<VoltAgentConversationStepsResult>(
        `/observability/memory/conversations/${conversationId}/steps`,
        {
            agentId: query.agentId,
            limit: mapNumberQuery(query.limit),
            operationId: query.operationId,
        }
    )
}

export async function fetchVoltObservabilityWorkingMemory(
    query: VoltAgentObservabilityWorkingMemoryQuery
): Promise<VoltAgentObservabilityWorkingMemoryResult> {
    return getVoltAgentSuccessData<VoltAgentObservabilityWorkingMemoryResult>(
        '/observability/memory/working-memory',
        {
            agentId: query.agentId,
            conversationId: query.conversationId,
            scope: query.scope,
            userId: query.userId,
        }
    )
}

export async function fetchVoltSetupObservability(
    request: VoltAgentObservabilitySetupRequest
): Promise<unknown> {
    return sendVoltAgentSuccessData<unknown, VoltAgentObservabilitySetupRequest>(
        '/setup-observability',
        'POST',
        request
    )
}

export async function fetchVoltCheckUpdates(): Promise<VoltAgentUpdateInfo> {
    return getVoltAgentSuccessData<VoltAgentUpdateInfo>('/updates')
}

export async function fetchVoltInstallUpdates(
    request: VoltAgentInstallUpdatesRequest = {}
): Promise<VoltAgentInstallUpdatesResult> {
    return sendVoltAgentSuccessData<
        VoltAgentInstallUpdatesResult,
        VoltAgentInstallUpdatesRequest
    >('/updates', 'POST', request)
}

export async function fetchVoltInstallPackageUpdate(
    packageName: string
): Promise<VoltAgentInstallUpdatesResult> {
    return sendVoltAgentSuccessData<VoltAgentInstallUpdatesResult, never>(
        `/updates/${packageName}`,
        'POST'
    )
}

export async function fetchVoltExecuteTool(
    toolName: string,
    request: VoltAgentToolExecutionRequest = {}
): Promise<VoltAgentToolExecutionResult> {
    return sendVoltAgentSuccessData<
        VoltAgentToolExecutionResult,
        VoltAgentToolExecutionRequest
    >(`/tools/${toolName}/execute`, 'POST', request)
}

export async function fetchVoltExecuteWorkflow(
    workflowId: string,
    request: VoltAgentWorkflowExecuteRequest = {}
): Promise<VoltAgentWorkflowExecutionResult> {
    return sendVoltAgentSuccessData<
        VoltAgentWorkflowExecutionResult,
        VoltAgentWorkflowExecuteRequest
    >(`/workflows/${workflowId}/execute`, 'POST', request)
}

export async function fetchVoltSuspendWorkflow(
    workflowId: string,
    executionId: string,
    request: VoltAgentWorkflowSuspendRequest = {}
): Promise<VoltAgentWorkflowExecution> {
    return sendVoltAgentSuccessData<
        VoltAgentWorkflowExecution,
        VoltAgentWorkflowSuspendRequest
    >(`/workflows/${workflowId}/executions/${executionId}/suspend`, 'POST', request)
}

export async function fetchVoltCancelWorkflow(
    workflowId: string,
    executionId: string,
    request: VoltAgentWorkflowSuspendRequest = {}
): Promise<VoltAgentWorkflowExecution> {
    return sendVoltAgentSuccessData<
        VoltAgentWorkflowExecution,
        VoltAgentWorkflowSuspendRequest
    >(`/workflows/${workflowId}/executions/${executionId}/cancel`, 'POST', request)
}

export async function fetchVoltResumeWorkflow(
    workflowId: string,
    executionId: string,
    request: VoltAgentWorkflowResumeRequest = {}
): Promise<VoltAgentWorkflowExecutionResult> {
    return sendVoltAgentSuccessData<
        VoltAgentWorkflowExecutionResult,
        VoltAgentWorkflowResumeRequest
    >(`/workflows/${workflowId}/executions/${executionId}/resume`, 'POST', request)
}

export async function fetchVoltReplayWorkflow(
    workflowId: string,
    executionId: string,
    request: VoltAgentWorkflowReplayRequest
): Promise<VoltAgentWorkflowExecutionResult> {
    return sendVoltAgentSuccessData<
        VoltAgentWorkflowExecutionResult,
        VoltAgentWorkflowReplayRequest
    >(`/workflows/${workflowId}/executions/${executionId}/replay`, 'POST', request)
}

export async function fetchVoltA2AAgentCard(
    serverId: string
): Promise<VoltAgentA2AAgentCard> {
    return getVoltAgentResponse<VoltAgentA2AAgentCard>(
        `/.well-known/${serverId}/agent-card.json`
    )
}

export async function fetchVoltA2AJsonRpc(
    serverId: string,
    request: VoltAgentA2AJsonRpcRequest
): Promise<VoltAgentA2AJsonRpcResponse> {
    const response = await fetch(buildUrl(`/a2a/${serverId}`), {
        body: JSON.stringify(request),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'POST',
    })

    return parseJsonResponse<VoltAgentA2AJsonRpcResponse>(response)
}
