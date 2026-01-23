'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    MastervoltLogo,
    NavOverviewIcon,
    NavChatIcon,
    NavResearchIcon,
    NavWorkflowIcon,
    NavReportsIcon,
    NavAgentsIcon,
    NavMemoryIcon,
    NavObservabilityIcon,
    NavLogsIcon,
    NavSettingsIcon,
} from './nav-icons'
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
                icon: NavOverviewIcon,
            },
            {
                title: 'Chat',
                url: '/dashboard/chat',
                icon: NavChatIcon,
            },
        ],
    },
    {
        title: 'Research',
        items: [
            {
                title: 'New Research',
                url: '/dashboard/research',
                icon: NavResearchIcon,
            },
            {
                title: 'Workflows',
                url: '/dashboard/workflows',
                icon: NavWorkflowIcon,
            },
            {
                title: 'Reports',
                url: '/dashboard/reports',
                icon: NavReportsIcon,
            },
        ],
    },
    {
        title: 'System',
        items: [
            {
                title: 'Agents',
                url: '/dashboard/agents',
                icon: NavAgentsIcon,
            },
            {
                title: 'Memory',
                url: '/dashboard/memory',
                icon: NavMemoryIcon,
            },
            {
                title: 'Observability',
                url: '/dashboard/observability',
                icon: NavObservabilityIcon,
            },
            {
                title: 'Logs',
                url: '/dashboard/logs',
                icon: NavLogsIcon,
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
                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95">
                        <MastervoltLogo className="size-7" animate />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-1">
                        <span className="truncate font-black text-xl bg-linear-to-br from-white via-emerald-300 to-emerald-500 bg-clip-text text-transparent tracking-tighter">
                            MASTERVOLT
                        </span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                {navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
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
                                                'transition-all duration-300 h-10',
                                                pathname === item.url
                                                    ? 'bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]'
                                                    : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5'
                                            )}
                                        >
                                            <Link href={item.url} className="flex items-center gap-3">
                                                <item.icon className="size-4.5 opacity-80" />
                                                <span className="font-medium tracking-tight">
                                                    {item.title}
                                                </span>
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
                            className={cn(
                                'transition-all duration-300',
                                pathname === '/settings' ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-400'
                            )}
                        >
                            <Link href="/settings" className="flex items-center gap-3">
                                <NavSettingsIcon className="size-4.5" />
                                <span className="font-medium tracking-tight">
                                    Settings
                                </span>
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
