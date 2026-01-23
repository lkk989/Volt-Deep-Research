'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    MessageSquare,
    Search,
    Workflow,
    FileText,
    Bot,
    Database,
    Zap,
    ScrollText,
    Settings,
    ChevronRight,
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/base/sidebar'
import { cn } from '@/lib/utils'

const navMain = [
    {
        title: 'Platform',
        items: [
            {
                title: 'Overview',
                url: '/dashboard',
                icon: LayoutDashboard,
            },
            {
                title: 'Chat',
                url: '/dashboard/chat',
                icon: MessageSquare,
            },
        ],
    },
    {
        title: 'Research',
        items: [
            {
                title: 'New Research',
                url: '/dashboard/research',
                icon: Search,
            },
            {
                title: 'Workflows',
                url: '/dashboard/workflows',
                icon: Workflow,
            },
            {
                title: 'Reports',
                url: '/dashboard/reports',
                icon: FileText,
            },
        ],
    },
    {
        title: 'System',
        items: [
            {
                title: 'Agents',
                url: '/dashboard/agents',
                icon: Bot,
            },
            {
                title: 'Memory',
                url: '/dashboard/memory',
                icon: Database,
            },
            {
                title: 'Observability',
                url: '/dashboard/observability',
                icon: Zap,
            },
            {
                title: 'Logs',
                url: '/dashboard/logs',
                icon: ScrollText,
            },
        ],
    },
]

export function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-14 border-b flex items-center justify-center">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 group-data-[collapsible=icon]:px-0"
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Bot className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-lg">
                            Mastervolt
                        </span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                {navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                            className={cn(
                                                'transition-all duration-200',
                                                pathname === item.url
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="size-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/settings'}
                            tooltip="Settings"
                        >
                            <Link href="/settings">
                                <Settings className="size-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

// Export as Sidebar for compatibility if needed, but the layout uses Sidebar
export { DashboardSidebar as Sidebar }
