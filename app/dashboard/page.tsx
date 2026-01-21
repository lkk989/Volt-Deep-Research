'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    ActivityIcon,
    BotIcon,
    CheckCircleIcon,
    ClockIcon,
    ZapIcon,
} from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Overview of your Mastervolt Deep Research system.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Agents
                        </CardTitle>
                        <BotIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">
                            Orchestrated by Deep Research Agent
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Workflows
                        </CardTitle>
                        <ZapIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">
                            Active research workflows
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tasks Completed
                        </CardTitle>
                        <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">
                            +12% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            System Status
                        </CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            Healthy
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All systems operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Project Overview</CardTitle>
                        <CardDescription>
                            Mastervolt Deep Research System v0.1.5
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">
                                        Core Technologies
                                    </h4>
                                    <ul className="list-disc pl-4 text-sm text-muted-foreground">
                                        <li>VoltAgent v2.1.6</li>
                                        <li>Next.js 16.1.4</li>
                                        <li>TypeScript 5.9.3</li>
                                        <li>LibSQL & Supabase</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">
                                        AI Models
                                    </h4>
                                    <ul className="list-disc pl-4 text-sm text-muted-foreground">
                                        <li>Google Gemini 2.0 Flash</li>
                                        <li>OpenAI GPT-4o</li>
                                        <li>Vertex AI Integration</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest system events and agent actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {[
                                    {
                                        agent: 'Deep Research',
                                        action: 'Started comprehensive analysis',
                                        time: '2m ago',
                                    },
                                    {
                                        agent: 'Scrapper',
                                        action: 'Extracted data from 5 sources',
                                        time: '5m ago',
                                    },
                                    {
                                        agent: 'Data Analyzer',
                                        action: 'Identified 3 key patterns',
                                        time: '12m ago',
                                    },
                                    {
                                        agent: 'Writer',
                                        action: 'Drafted initial report section',
                                        time: '15m ago',
                                    },
                                    {
                                        agent: 'Fact Checker',
                                        action: 'Verified 8 claims',
                                        time: '22m ago',
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {item.agent}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.action}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                {item.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
