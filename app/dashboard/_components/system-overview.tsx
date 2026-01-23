import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export function SystemOverview() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                    Mastervolt Deep Research System v0.1.5
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                                Core Technologies
                            </h4>
                            <ul className="list-disc pl-4 text-sm text-muted-foreground">
                                <li>VoltAgent v2.1.6</li>
                                <li>Next.js 16.1.4</li>
                                <li>TypeScript 5.9.3</li>
                                <li>LibSQL & Supabase</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                                AI Models
                            </h4>
                            <ul className="list-disc pl-4 text-sm text-muted-foreground">
                                <li>Google Gemini 2.0 Flash</li>
                                <li>OpenAI GPT-4o</li>
                                <li>Vertex AI Integration</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
