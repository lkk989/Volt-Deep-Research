import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BotIcon, ZapIcon, CheckCircleIcon, ActivityIcon } from 'lucide-react'

export function StatsCards() {
    return (
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
    )
}
