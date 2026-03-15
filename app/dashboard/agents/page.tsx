'use client'

import Link from 'next/link'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    BotIcon,
    ActivityIcon,
    MemoryStickIcon,
    Settings2Icon,
    CheckCircleIcon,
    ClockIcon,
} from 'lucide-react'
import { useVoltAgentList } from '@/hooks/use-voltagent'

export default function AgentsPage() {
    const { data: agents = [] } = useVoltAgentList()

    const activeAgents = agents.filter((agent) => agent.status === 'active')
    const memoryEnabledAgents = agents.filter((agent) => agent.memory != null)
    const telemetryEnabledAgents = agents.filter(
        (agent) => agent.isTelemetryEnabled
    )

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Agents
                    </h1>
                    <p className="text-muted-foreground">
                        Browse registered VoltAgent agents and open a dedicated
                        chat session for the one you want to work with.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    <Settings2Icon className="h-4 w-4" />
                    Runtime registry
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Agents
                        </CardTitle>
                        <BotIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agents.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered VoltAgent agents
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active
                        </CardTitle>
                        <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {activeAgents.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agents currently marked active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Memory Enabled
                        </CardTitle>
                        <MemoryStickIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {memoryEnabledAgents.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agents with memory configured
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Telemetry Enabled
                        </CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {telemetryEnabledAgents.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agents emitting observability data
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agent Registry</CardTitle>
                    <CardDescription>
                        Select an agent to open a chat that is bound to that
                        exact runtime agent.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-150">
                        <div className="grid gap-4 md:grid-cols-2">
                            {agents.map((agent) => (
                                <Link
                                    key={agent.id}
                                    href={`/dashboard/chat/${encodeURIComponent(agent.id)}`}
                                >
                                    <Card className="border-2 transition-colors hover:bg-accent">
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <BotIcon className="h-5 w-5 text-primary" />
                                                            <h3 className="font-semibold text-lg">
                                                                {agent.name}
                                                            </h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {agent.description ??
                                                                'No description available'}
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant={
                                                            agent.status ===
                                                            'active'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="flex items-center gap-1"
                                                    >
                                                        {agent.status ===
                                                        'active' ? (
                                                            <ActivityIcon className="h-3 w-3" />
                                                        ) : (
                                                            <ClockIcon className="h-3 w-3" />
                                                        )}
                                                        {agent.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            agent.status.slice(1)}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 border-t pt-2">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Model
                                                        </p>
                                                        <p className="text-sm font-medium break-all">
                                                            {agent.model}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Tools
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {agent.tools.length}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Memory
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {agent.memory
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Telemetry
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {agent.isTelemetryEnabled
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
