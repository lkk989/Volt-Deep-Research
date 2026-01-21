'use client'

import {
    PromptInput,
    PromptInputButton,
    PromptInputFooter,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/base/switch'
import { Label } from '@/components/ui/base/label'
import { SendIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function ResearchFormPage() {
    const router = useRouter()
    const [depth, setDepth] = useState('standard')
    const [useWeb, setUseWeb] = useState(true)

    const handleSubmit = async (message: { text: string }) => {
        if (!message.text.trim()) return

        const researchId = nanoid()
        // In a real app, we would initialize the research session here via API
        router.push(
            `/dashboard/research/${researchId}?q=${encodeURIComponent(message.text)}&depth=${depth}&web=${useWeb}`
        )
    }

    return (
        <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="w-full max-w-3xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <SparklesIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        New Deep Research
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Orchestrate 14 specialized agents to conduct
                        comprehensive analysis.
                    </p>
                </div>

                <Card className="border-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Research Parameters</CardTitle>
                        <CardDescription>
                            Configure how the agents should approach your query.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Research Depth</Label>
                                <Select value={depth} onValueChange={setDepth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select depth" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quick">
                                            Quick Scan (3-5 mins)
                                        </SelectItem>
                                        <SelectItem value="standard">
                                            Standard Analysis (10-15 mins)
                                        </SelectItem>
                                        <SelectItem value="deep">
                                            Deep Dive (30+ mins)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Web Search</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Allow agents to crawl live sources.
                                    </p>
                                </div>
                                <Switch
                                    checked={useWeb}
                                    onCheckedChange={setUseWeb}
                                />
                            </div>
                        </div>

                        <PromptInput
                            onSubmit={handleSubmit}
                            className="min-h-37.5 items-start p-4"
                        >
                            <PromptInputTextarea
                                placeholder="Describe your research topic in detail..."
                                className="min-h-25 w-full resize-none bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-none"
                            />
                            <PromptInputFooter className="pt-4">
                                <div className="text-xs text-muted-foreground">
                                    Press Enter to start research
                                </div>
                                <PromptInputButton
                                    type="submit"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <SendIcon className="h-4 w-4" />
                                    Start Research
                                </PromptInputButton>
                            </PromptInputFooter>
                        </PromptInput>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            title: 'Market Analysis',
                            query: 'Current trends in renewable energy storage 2026',
                        },
                        {
                            title: 'Tech Stack Review',
                            query: 'Comparison of VoltAgent vs LangChain for multi-agent systems',
                        },
                        {
                            title: 'Scientific Research',
                            query: 'Latest breakthroughs in room-temperature superconductors',
                        },
                    ].map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() =>
                                handleSubmit({ text: suggestion.query })
                            }
                            className="flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                        >
                            <span className="text-sm font-medium">
                                {suggestion.title}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                                {suggestion.query}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
