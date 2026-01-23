'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SystemOverview() {
    return (
        <Card className="col-span-4 border-emerald-500/10 bg-emerald-500/2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">System Status</CardTitle>
                    <CardDescription>
                        Mastervolt Deep Research Engine v0.1.5
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-500 uppercase tracking-tighter">Live</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Core Stack</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Framework</span>
                                    <span className="font-mono font-medium">VoltAgent v2.1.6</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Storage</span>
                                    <span className="font-mono font-medium">LibSQL / Turso</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Intelligence</h4>
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-md px-2 py-0">Gemini 3 Pro</Badge>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none rounded-md px-2 py-0">Claude 4.5</Badge>
                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none rounded-md px-2 py-0">GPT-4o</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Observability</h4>
                            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs">Traces Synchronized</span>
                                    <span className="text-xs font-mono font-bold text-emerald-500">YES</span>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[85%]" />
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic mt-4">
                            System fully integrated with VoltOps Cloud. All agents operational.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
