// Observability routes that proxy to VoltAgent server (port 3141)
// These endpoints mirror the VoltAgent API for dashboard integration

const VOLTAGENT_URL = process.env.VOLTAGENT_URL ?? 'http://localhost:3141'

interface ProxyOptions {
    path: string
    searchParams?: Record<string, string>
}

async function proxyToVoltAgent<T>(options: ProxyOptions): Promise<T> {
    const url = new URL(options.path, VOLTAGENT_URL)

    if (options.searchParams) {
        for (const [key, value] of Object.entries(options.searchParams)) {
            url.searchParams.set(key, value)
        }
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(
            `VoltAgent API error: ${response.status} ${response.statusText}`
        )
    }

    return response.json() as Promise<T>
}

// GET /api/observability/traces - List traces from VoltAgent
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // Pass through query parameters
        const filters: Record<string, string> = {}
        for (const [key, value] of searchParams) {
            filters[key] = value
        }

        const data = await proxyToVoltAgent<{
            success: boolean
            data?: Array<{
                traceId: string
                entityType: string
                entityId: string
                startTime: string
                endTime?: string
                status: string
                metadata?: Record<string, unknown>
            }>
            error?: string
        }>({
            path: '/observability/traces',
            searchParams: filters,
        })

        return Response.json(data)
    } catch (error) {
        console.error('[API] Observability traces error:', error)
        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch traces',
                data: [],
            },
            { status: 500 }
        )
    }
}
