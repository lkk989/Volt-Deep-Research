'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchIcon, PlusIcon, FileTextIcon, Settings2Icon, ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

const actions = [
    {
        title: 'New Research',
        description: 'Initiate autonomous research mission',
        icon: PlusIcon,
        href: '/dashboard/research',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'hover:border-emerald-500/20',
    },
    {
        title: 'Query Assistant',
        description: 'Refine research queries with AI',
        icon: SearchIcon,
        href: '/dashboard/chat',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'hover:border-blue-500/20',
    },
    {
        title: 'View Reports',
        description: 'Explore synthesized knowledge base',
        icon: FileTextIcon,
        href: '/dashboard/reports',
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'hover:border-purple-500/20',
    },
    {
        title: 'Agent Config',
        description: 'Manage specialist agent behaviors',
        icon: Settings2Icon,
        href: '/dashboard/agents',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'hover:border-orange-500/20',
    },
]

export function QuickActions() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Card
                    key={action.title}
                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-border/50 ${action.border}`}
                >
                    <CardHeader className="pb-2">
                        <div className={`p-2.5 w-fit rounded-xl ${action.bg} ${action.color} mb-2`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base font-bold tracking-tight">
                            {action.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full justify-between px-0 h-auto font-medium text-xs hover:bg-transparent group/btn"
                        >
                            <Link href={action.href} className="flex items-center w-full">
                                <span className="text-muted-foreground group-hover/btn:text-foreground transition-colors">Launch Module</span>
                                <ArrowRightIcon className="h-3 w-3 translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
