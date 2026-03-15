'use client'

import Link from 'next/link'
import { useVoltAgentList } from '@/hooks/use-voltagent'
import { Button } from '@/components/ui/button'
import { BotIcon } from 'lucide-react'

export default function ChatPage() {
    const { data: agents = [] } = useVoltAgentList()

    return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="flex max-w-lg flex-col items-center gap-4 rounded-xl border bg-card px-8 py-10 text-center shadow-xs">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BotIcon className="size-7" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Select an agent to start chatting
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Open a dedicated dynamic chat route for a real registered VoltAgent.
                    </p>
                    {agents.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                            Available now: {agents.length} agent{agents.length === 1 ? '' : 's'}.
                        </p>
                    ) : null}
                </div>
                <Button asChild>
                    <Link href="/dashboard/agents">Open agents</Link>
                </Button>
            </div>
        </div>
    )
}
