import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchIcon, PlusIcon, FileTextIcon, Settings2Icon } from 'lucide-react'
import Link from 'next/link'

const actions = [
    {
        title: 'New Research',
        description: 'Start a new comprehensive research task',
        icon: PlusIcon,
        href: '/dashboard/research',
        color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
        title: 'Query Assistant',
        description: 'Generate optimized search queries',
        icon: SearchIcon,
        href: '/dashboard/chat',
        color: 'bg-blue-500/10 text-blue-500',
    },
    {
        title: 'View Reports',
        description: 'Access and share research reports',
        icon: FileTextIcon,
        href: '/dashboard/reports',
        color: 'bg-purple-500/10 text-purple-500',
    },
    {
        title: 'Agent Settings',
        description: 'Configure specialist agent behavior',
        icon: Settings2Icon,
        href: '/dashboard/agents',
        color: 'bg-orange-500/10 text-orange-500',
    },
]

export function QuickActions() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Card
                    key={action.title}
                    className="group relative overflow-hidden transition-all hover:shadow-md"
                >
                    <CardHeader className="pb-2">
                        <div className={`p-2 w-fit rounded-lg ${action.color}`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="mt-2 text-base">
                            {action.title}
                        </CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full justify-start p-0 h-auto font-normal hover:bg-transparent text-primary"
                        >
                            <Link href={action.href}>Launch action →</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
