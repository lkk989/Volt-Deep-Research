import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClockIcon } from 'lucide-react'

const activityItems = [
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
]

export function RecentActivity() {
    return (
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
                        {activityItems.map((item, i) => (
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
    )
}
