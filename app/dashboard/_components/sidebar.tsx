'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/base/accordion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Custom Icons
const ChatIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
)

const WorkflowIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
)

const ObservabilityIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
    </svg>
)

const LogsIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
    </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <div className="flex h-full w-64 flex-col border-r bg-muted/10">
            <div className="flex h-14 items-center border-b px-6">
                <span className="text-lg font-semibold">Mastervolt</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <Accordion
                    type="multiple"
                    defaultValue={['main', 'research', 'system']}
                    className="w-full px-4"
                >
                    <AccordionItem value="main" className="border-none">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                            Main
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/dashboard"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <rect
                                            width="7"
                                            height="9"
                                            x="3"
                                            y="3"
                                            rx="1"
                                        />
                                        <rect
                                            width="7"
                                            height="5"
                                            x="14"
                                            y="3"
                                            rx="1"
                                        />
                                        <rect
                                            width="7"
                                            height="9"
                                            x="14"
                                            y="12"
                                            rx="1"
                                        />
                                        <rect
                                            width="7"
                                            height="5"
                                            x="3"
                                            y="16"
                                            rx="1"
                                        />
                                    </svg>
                                    Overview
                                </Link>
                                <Link
                                    href="/dashboard/chat"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/chat')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <ChatIcon className="h-4 w-4" />
                                    Chat
                                </Link>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="research" className="border-none">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                            Research
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/dashboard/research"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/research')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    New Research
                                </Link>
                                <Link
                                    href="/dashboard/workflows"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/workflows')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <WorkflowIcon className="h-4 w-4" />
                                    Workflows
                                </Link>
                                <Link
                                    href="/dashboard/reports"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/reports')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    Reports
                                </Link>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="system" className="border-none">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                            System
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/dashboard/agents"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/agents')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <path d="M12 8V4H8" />
                                        <rect
                                            width="16"
                                            height="12"
                                            x="4"
                                            y="8"
                                            rx="2"
                                        />
                                        <path d="M2 14h2" />
                                        <path d="M20 14h2" />
                                        <path d="M15 13v2" />
                                        <path d="M9 13v2" />
                                    </svg>
                                    Agents
                                </Link>
                                <Link
                                    href="/dashboard/memory"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/memory')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
                                        <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
                                        <path d="M4 12H2" />
                                        <path d="M10 12H8" />
                                        <path d="M16 12h-2" />
                                        <path d="M22 12h-2" />
                                    </svg>
                                    Memory
                                </Link>
                                <Link
                                    href="/dashboard/observability"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/observability')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <ObservabilityIcon className="h-4 w-4" />
                                    Observability
                                </Link>
                                <Link
                                    href="/dashboard/logs"
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        isActive('/dashboard/logs')
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <LogsIcon className="h-4 w-4" />
                                    Logs
                                </Link>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <div className="border-t p-4">
                <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                </Link>
            </div>
        </div>
    )
}
