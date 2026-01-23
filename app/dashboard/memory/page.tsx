'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DatabaseIcon,
    SearchIcon,
    BrainIcon,
    ClockIcon,
    HashIcon,
    MemoryStickIcon,
} from 'lucide-react'
import { useState } from 'react'

const mockMemoryEntries = [
    {
        id: 'mem_001',
        agent: 'Assistant',
        type: 'conversation',
        content:
            'User asked about quantum computing applications in cryptography',
        timestamp: '2026-01-22 13:45:32',
        embedding_id: 'emb_a8f3c2d1',
    },
    {
        id: 'mem_002',
        agent: 'Writer',
        type: 'document',
        content: 'Research report on renewable energy storage trends completed',
        timestamp: '2026-01-22 12:30:15',
        embedding_id: 'emb_b7e4d3a2',
    },
    {
        id: 'mem_003',
        agent: 'Data Analyzer',
        type: 'insight',
        content: 'Identified 3 key patterns in climate data analysis',
        timestamp: '2026-01-22 11:15:48',
        embedding_id: 'emb_c6f5e4b3',
    },
    {
        id: 'mem_004',
        agent: 'Fact Checker',
        type: 'verification',
        content: 'Verified 8 claims with 95% confidence level',
        timestamp: '2026-01-22 10:00:22',
        embedding_id: 'emb_d5g6f5c4',
    },
]

const agentMemoryStats = [
    { agent: 'Deep Research', entries: 1247, size: '2.3 MB' },
    { agent: 'Assistant', entries: 3421, size: '1.8 MB' },
    { agent: 'Writer', entries: 892, size: '3.1 MB' },
    { agent: 'Scrapper', entries: 2156, size: '1.5 MB' },
    { agent: 'Data Analyzer', entries: 1789, size: '2.7 MB' },
    { agent: 'Fact Checker', entries: 1034, size: '1.9 MB' },
    { agent: 'Synthesizer', entries: 645, size: '2.1 MB' },
    { agent: 'Coding', entries: 2341, size: '3.5 MB' },
]

export default function MemoryPage() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Memory
                    </h1>
                    <p className="text-muted-foreground">
                        Browse and search agent memory and vector embeddings.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Entries
                        </CardTitle>
                        <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">13,525</div>
                        <p className="text-xs text-muted-foreground">
                            Across all agents
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Embeddings
                        </CardTitle>
                        <BrainIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8,742</div>
                        <p className="text-xs text-muted-foreground">
                            Semantic vectors
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Storage
                        </CardTitle>
                        <MemoryStickIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">28.3 MB</div>
                        <p className="text-xs text-muted-foreground">
                            LibSQL databases
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cache Hit Rate
                        </CardTitle>
                        <HashIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">87.3%</div>
                        <p className="text-xs text-muted-foreground">
                            Embedding cache
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Memory Browser</CardTitle>
                            <CardDescription>
                                Search and explore agent memory entries
                            </CardDescription>
                        </div>
                        <div className="relative w-72">
                            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Semantic search..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="entries" className="w-full">
                        <TabsList>
                            <TabsTrigger value="entries">
                                Recent Entries
                            </TabsTrigger>
                            <TabsTrigger value="agents">By Agent</TabsTrigger>
                        </TabsList>
                        <TabsContent value="entries" className="mt-4">
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4">
                                    {mockMemoryEntries.map((entry) => (
                                        <Card
                                            key={entry.id}
                                            className="border transition-colors hover:bg-accent"
                                        >
                                            <CardContent className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">
                                                                {entry.agent}
                                                            </Badge>
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {entry.type}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <ClockIcon className="h-3 w-3" />
                                                            {entry.timestamp}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm">
                                                        {entry.content}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <BrainIcon className="h-3 w-3" />
                                                        Embedding:{' '}
                                                        {entry.embedding_id}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="agents" className="mt-4">
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4">
                                    {agentMemoryStats.map((stat, i) => (
                                        <Card
                                            key={i}
                                            className="border transition-colors hover:bg-accent"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-medium">
                                                            {stat.agent}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {stat.entries.toLocaleString()}{' '}
                                                            entries
                                                        </p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <Badge variant="outline">
                                                            {stat.size}
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                        >
                                                            Browse
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
