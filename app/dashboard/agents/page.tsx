'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    BotIcon,
    ActivityIcon,
    MemoryStickIcon,
    ZapIcon,
    Settings2Icon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from 'lucide-react'

const mockAgents = [
    {
        id: 'plan-agent',
        name: 'Deep Research Agent',
        description: 'Orchestrates multi-agent research workflows',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '2.3 MB',
        uptime: '99.9%',
        role: 'orchestrator',
    },
    {
        id: 'assistant',
        name: 'Assistant',
        description: 'Query generation and search coordination',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '1.8 MB',
        uptime: '99.7%',
        role: 'researcher',
    },
    {
        id: 'writer',
        name: 'Writer',
        description: 'Report synthesis and composition',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '3.1 MB',
        uptime: '99.8%',
        role: 'composer',
    },
    {
        id: 'scrapper',
        name: 'Scrapper',
        description: 'Web data extraction and collection',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '1.5 MB',
        uptime: '98.5%',
        role: 'collector',
    },
    {
        id: 'data-analyzer',
        name: 'Data Analyzer',
        description: 'Pattern analysis and insight extraction',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '2.7 MB',
        uptime: '99.6%',
        role: 'analyst',
    },
    {
        id: 'fact-checker',
        name: 'Fact Checker',
        description: 'Verification and bias detection',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '1.9 MB',
        uptime: '99.9%',
        role: 'verifier',
    },
    {
        id: 'synthesizer',
        name: 'Synthesizer',
        description: 'Multi-source information synthesis',
        status: 'idle',
        model: 'gemini-2.0-flash-exp',
        memory: '2.1 MB',
        uptime: '99.5%',
        role: 'synthesizer',
    },
    {
        id: 'coding',
        name: 'Coding Agent',
        description: 'Code implementation and bug fixes',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '3.5 MB',
        uptime: '99.3%',
        role: 'developer',
    },
    {
        id: 'data-scientist',
        name: 'Data Scientist',
        description: 'Statistical analysis and modeling',
        status: 'active',
        model: 'gemini-2.0-flash-exp',
        memory: '4.2 MB',
        uptime: '99.4%',
        role: 'scientist',
    },
    {
        id: 'judge',
        name: 'Judge',
        description: 'Quality evaluation and scoring',
        status: 'idle',
        model: 'gemini-2.0-flash-exp',
        memory: '1.2 MB',
        uptime: '99.9%',
        role: 'evaluator',
    },
]

export default function AgentsPage() {
    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Agents
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and monitor your specialized AI agents.
                    </p>
                </div>
                <Button className="gap-2" variant="outline">
                    <Settings2Icon className="h-4 w-4" />
                    Configure
                </Button>
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
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">
                            10 specialized agents
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
                            8
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently processing
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Memory Usage
                        </CardTitle>
                        <MemoryStickIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">28.3 MB</div>
                        <p className="text-xs text-muted-foreground">
                            Across all agents
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg Uptime
                        </CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.6%</div>
                        <p className="text-xs text-muted-foreground">
                            Last 30 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agent Status</CardTitle>
                    <CardDescription>
                        Real-time status of all specialized agents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px]">
                        <div className="grid gap-4 md:grid-cols-2">
                            {mockAgents.map((agent) => (
                                <Card
                                    key={agent.id}
                                    className="border-2 transition-colors hover:bg-accent"
                                >
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <BotIcon className="h-5 w-5 text-primary" />
                                                        <h3 className="font-semibold text-lg">
                                                            {agent.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {agent.description}
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

                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Model
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        {agent.model}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Role
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {agent.role}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Memory
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        {agent.memory}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Uptime
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        {agent.uptime}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
