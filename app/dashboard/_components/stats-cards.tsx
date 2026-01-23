'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState, useRef } from 'react'

import {
    NavAgentsIcon,
    NavWorkflowIcon,
    NavObservabilityIcon,
} from './nav-icons'
import { CheckCircle2Icon } from 'lucide-react'

export function StatsCards() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)
    // FIXME: Wrong api, is not connecting to voltagent.... next has none this.  u have to connect to voltagent api
    useEffect(() => {
// Use VoltAgent server as canonical API surface: fetch /agents and /api/conversations
    const backend =
        (process.env.NEXT_PUBLIC_API_URL as string) ||
        (process.env.NEXT_PUBLIC_VOLTAGENT_URL as string) ||
        'http://localhost:3141'

    const agentsUrl = `${backend.replace(/\/$/, '')}/agents`
    const convUrl = `${backend.replace(/\/$/, '')}/api/conversations?userId=default-user`

    let cancelled = false

    ;(async () => {
        try {
            setLoading(true)

            const [agentsRes, convRes] = await Promise.all([
                fetch(agentsUrl, { headers: { 'Content-Type': 'application/json' } }),
                fetch(convUrl, { headers: { 'Content-Type': 'application/json' } }),
            ])

            if (!agentsRes.ok) {
                const t = await agentsRes.text().catch(() => '')
                throw new Error(`Failed to fetch agents: ${agentsRes.status} ${t}`)
            }

            if (!convRes.ok) {
                const t = await convRes.text().catch(() => '')
                throw new Error(`Failed to fetch conversations: ${convRes.status} ${t}`)
            }

            const agentsJson = await agentsRes.json()
            const convJson = await convRes.json()

            if (!cancelled) {
                const agentCount = Array.isArray(agentsJson.data) ? agentsJson.data.length : Array.isArray(agentsJson) ? agentsJson.length : undefined
                const convCount = Array.isArray(convJson.data) ? convJson.data.length : undefined

                setStats({
                    activeAgents: agentCount,
                    totalConversations: convCount,
                    workflows: undefined,
                    tasksCompleted: undefined,
                    systemStatus: 'healthy',
                })
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to fetch VoltAgent metrics', err)
            if (!cancelled) setStats({ activeAgents: undefined, totalConversations: undefined, workflows: undefined, tasksCompleted: undefined, systemStatus: 'degraded' })
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        // No external animation library used by default. Simple CSS transitions can handle fades.
        // Leave this effect for lifecycle awareness; animations removed per policy.
    }, [loading, stats])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card
                        key={i}
                        className="animate-pulse border-emerald-500/5"
                    >
                        <CardHeader className="h-20" />
                        <CardContent className="h-16" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
            <Card className="stat-card group hover:border-emerald-500/50 transition-all duration-500 bg-linear-to-b from-background to-emerald-500/2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Active Agents
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:scale-110 transition-transform">
                        <NavAgentsIcon className="h-4 w-4 text-emerald-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-emerald-500 tracking-tighter">
                        {stats?.activeAgents ?? '—'}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        NEURAL UNITS ONLINE
                    </p>
                </CardContent>
            </Card>

            <Card className="stat-card group hover:border-blue-500/50 transition-all duration-500 bg-linear-to-b from-background to-blue-500/2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Workflows
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:scale-110 transition-transform">
                        <NavWorkflowIcon className="h-4 w-4 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-blue-500 tracking-tighter">
                        {stats?.workflows ?? '—'}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        ACTIVE CHAINS
                    </p>
                </CardContent>
            </Card>

            <Card className="stat-card group hover:border-purple-500/50 transition-all duration-500 bg-linear-to-b from-background to-purple-500/2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Completed
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-purple-500/10 group-hover:scale-110 transition-transform">
                        <CheckCircle2Icon className="h-4 w-4 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-purple-500 tracking-tighter">
                        {stats?.tasksCompleted ?? '—'}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        TOTAL RESEARCH TASKS
                    </p>
                </CardContent>
            </Card>

            <Card className="stat-card group hover:border-emerald-500/50 transition-all duration-500 bg-linear-to-b from-background to-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        System
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:scale-110 transition-transform">
                        <NavObservabilityIcon className="h-4 w-4 text-emerald-500 animate-pulse" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-emerald-500 tracking-tighter uppercase italic">
                        {stats?.systemStatus === 'healthy'
                            ? 'Healthy'
                            : 'Operational'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] text-emerald-500/80 font-bold tracking-widest">
                            CORE SYNCED
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
