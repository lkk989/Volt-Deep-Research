'use client'

import { Bot } from 'lucide-react'

export function ChatHeader() {
    return (
        <div className="flex items-center justify-between border-b bg-background px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold">VoltAgent</h1>
                    <p className="text-sm text-muted-foreground">
                        AI Assistant
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600">
                    Online
                </span>
            </div>
        </div>
    )
}
