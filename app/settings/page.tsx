'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/base/label'
import { Switch } from '@/components/ui/base/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Settings2Icon,
    KeyIcon,
    BrainIcon,
    DatabaseIcon,
    ActivityIcon,
    AlertCircleIcon,
    CheckCircleIcon,
} from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
    const [defaultModel, setDefaultModel] = useState('gemini-2.0-flash-exp')
    const [enableCache, setEnableCache] = useState(true)
    const [voltOpsSync, setVoltOpsSync] = useState(true)

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure your Mastervolt Deep Research system.
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Settings2Icon className="h-4 w-4" />
                    Advanced
                </Button>
            </div>

            <div className="grid gap-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <KeyIcon className="h-5 w-5 text-primary" />
                            <CardTitle>API Keys</CardTitle>
                        </div>
                        <CardDescription>
                            Manage your API keys and credentials (stored in
                            .env)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label>Google Generative AI</Label>
                                    <p className="text-xs text-muted-foreground">
                                        GOOGLE_GENERATIVE_AI_API_KEY
                                    </p>
                                </div>
                                <Badge
                                    variant="default"
                                    className="flex items-center gap-1"
                                >
                                    <CheckCircleIcon className="h-3 w-3" />
                                    Configured
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label>VoltOps Platform</Label>
                                    <p className="text-xs text-muted-foreground">
                                        VOLTAGENT_PUBLIC_KEY,
                                        VOLTAGENT_SECRET_KEY
                                    </p>
                                </div>
                                <Badge
                                    variant="default"
                                    className="flex items-center gap-1"
                                >
                                    <CheckCircleIcon className="h-3 w-3" />
                                    Configured
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label>Supabase (Optional)</Label>
                                    <p className="text-xs text-muted-foreground">
                                        SUPABASE_URL, SUPABASE_ANON_KEY
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <AlertCircleIcon className="h-3 w-3" />
                                    Not Configured
                                </Badge>
                            </div>
                        </div>
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircleIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        Security Note
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        API keys are stored in your .env file.
                                        Never commit this file to version
                                        control. Use .env.example for templates.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BrainIcon className="h-5 w-5 text-primary" />
                            <CardTitle>AI Models</CardTitle>
                        </div>
                        <CardDescription>
                            Configure default models and AI settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Default Model</Label>
                            <Select
                                value={defaultModel}
                                onValueChange={setDefaultModel}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini-2.0-flash-exp">
                                        Google Gemini 2.0 Flash (Experimental)
                                    </SelectItem>
                                    <SelectItem value="gemini-2.5-flash-lite">
                                        Google Gemini 2.5 Flash Lite (Preview)
                                    </SelectItem>
                                    <SelectItem value="gpt-4o">
                                        OpenAI GPT-4o
                                    </SelectItem>
                                    <SelectItem value="gpt-4o-mini">
                                        OpenAI GPT-4o Mini
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Default model used by new agents
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                                <Label>Embedding Cache</Label>
                                <p className="text-xs text-muted-foreground">
                                    Cache embeddings for improved performance
                                    (1000 entries, 1hr TTL)
                                </p>
                            </div>
                            <Switch
                                checked={enableCache}
                                onCheckedChange={setEnableCache}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <DatabaseIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Memory & Storage</CardTitle>
                        </div>
                        <CardDescription>
                            Configure memory and database settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Total Memory Usage
                                </Label>
                                <p className="text-2xl font-bold">28.3 MB</p>
                                <p className="text-xs text-muted-foreground">
                                    Across 14 agent databases
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Vector Embeddings
                                </Label>
                                <p className="text-2xl font-bold">8,742</p>
                                <p className="text-xs text-muted-foreground">
                                    In shared vector store
                                </p>
                            </div>
                        </div>
                        <div className="bg-muted/50 border border-muted rounded-lg p-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Storage Location
                                </p>
                                <code className="text-xs text-muted-foreground">
                                    .voltagent/*.db (LibSQL databases)
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ActivityIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Observability</CardTitle>
                        </div>
                        <CardDescription>
                            VoltOps integration and monitoring
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                                <Label>VoltOps Sync</Label>
                                <p className="text-xs text-muted-foreground">
                                    Forward metrics to VoltOps platform (50%
                                    sampling)
                                </p>
                            </div>
                            <Switch
                                checked={voltOpsSync}
                                onCheckedChange={setVoltOpsSync}
                            />
                        </div>
                        {voltOpsSync && (
                            <div className="bg-muted/50 border border-muted rounded-lg p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        <p className="text-sm font-medium">
                                            Connected to VoltOps
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Batch size: 512 events, Interval: 4s
                                    </p>
                                    <Button size="sm" variant="outline" asChild>
                                        <a
                                            href="https://console.voltagent.dev"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open VoltOps Console →
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
