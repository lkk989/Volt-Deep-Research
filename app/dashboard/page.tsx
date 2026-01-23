'use client'

import { StatsCards } from './_components/stats-cards'
import { QuickActions } from './_components/quick-actions'
import { SystemOverview } from './_components/system-overview'
import { RecentActivity } from './_components/recent-activity'

export default function DashboardPage() {
    return (
        <div className="flex h-full flex-col gap-8 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to Mastervolt Deep Research System v0.1.5.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Overview
                </h3>
                <StatsCards />
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                </h3>
                <QuickActions />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <SystemOverview />
                <RecentActivity />
            </div>
        </div>
    )
}
