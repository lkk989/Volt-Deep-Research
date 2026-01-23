"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/base/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Terminal } from "@/components/ai-elements/terminal"

type LogItem = {
    id?: string
    timestamp?: string
    level?: string
    agentId?: string
    message?: string
    meta?: Record<string, unknown>
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogItem[]>([])
    const [level, setLevel] = useState<string>("info")
    const [query, setQuery] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(true)
    const [live, setLive] = useState<boolean>(false)
    const wsRef = useRef<WebSocket | null>(null)
    const [showTerminal, setShowTerminal] = useState<boolean>(true)
    const [terminalOutput, setTerminalOutput] = useState<string>("")
    const [terminalPaused, setTerminalPaused] = useState<boolean>(false)

    const backend =
        (process.env.NEXT_PUBLIC_API_URL as string) ||
        (process.env.NEXT_PUBLIC_VOLTAGENT_URL as string) ||
        "http://localhost:3141"

    const [serviceFilter, setServiceFilter] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [debouncedQuery, setDebouncedQuery] = useState(query)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(t)
    }, [query])

    async function fetchLogs() {
        setLoading(true)
        setError(null)

        const url = `${backend.replace(/\/$/, "")}/api/logs?level=${encodeURIComponent(
            level
        )}&limit=500`

        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error("Failed to fetch logs")
            const json = await res.json()
            setLogs(json.data as LogItem[])
            setLastUpdated(new Date().toISOString())
        } catch (err: any) {
            console.error("Unable to fetch logs:", err)
            setError(err?.message || String(err))
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchLogs()
    }, [level])

    useEffect(() => {
        if (!live) {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
            return
        }

        const wsUrl = backend.replace(/^http/, "ws") + `/ws/logs?level=${encodeURIComponent(level)}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (e) => {
            try {
                // Keep structured log state
                const data = JSON.parse(e.data)
                const payload = data.data || data
                setLogs((prev) => [payload as LogItem, ...prev].slice(0, 500))

                // Append raw line to terminal output when visible and not paused
                if (showTerminal && !terminalPaused) {
                    let line = ''
                    if (payload && typeof payload === 'object') {
                        const ts = payload.timestamp ? new Date(payload.timestamp).toLocaleString() : new Date().toLocaleString()
                        const lvl = payload.level ? `[${String(payload.level).toUpperCase()}]` : ''
                        const agent = payload.agentId ? `${payload.agentId}` : 'system'
                        const msg = payload.message ? `${payload.message}` : JSON.stringify(payload)
                        line = `${ts} ${lvl} ${agent} - ${msg}`
                    } else {
                        line = String(e.data)
                    }
                    setTerminalOutput((prev) => prev + line + '\n')
                }
            } catch (err) {
                // If not JSON, still append raw
                if (showTerminal && !terminalPaused) setTerminalOutput((prev) => prev + String(e.data) + '\n')
                console.warn("Malformed WS log message", err)
            }
        }

        ws.onopen = () => console.info("Logs websocket connected")
        ws.onclose = () => console.info("Logs websocket disconnected")
        ws.onerror = (err) => console.error("Logs websocket error", err)

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [live, level, showTerminal, terminalPaused])

    const filtered = logs.filter((l) => {
        if (serviceFilter && String(l.agentId || "") !== serviceFilter) return false
        if (!debouncedQuery) return true
        return (
            String(l.message || "").toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            String(l.agentId || "").toLowerCase().includes(debouncedQuery.toLowerCase())
        )
    })

    // Compute counts per level for chart
    const counts = ['debug','info','warn','error'].map((lvl) => ({ level: lvl, count: logs.filter((x) => (x.level || 'info').toLowerCase() === lvl).length }))

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                    <p className="text-muted-foreground">Live system and agent logs.</p>
                    {lastUpdated && (
                        <div className="text-xs text-muted-foreground">Last updated: {new Date(lastUpdated).toLocaleString()}</div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-44">
                        <ChartContainer
                            id="logs-counts"
                            config={{ counts: { label: 'Events', color: '#10b981' } }}
                        >
                            <ResponsiveContainer width="100%" height={48}>
                                <BarChart data={counts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="level" hide />
                                    <YAxis hide />
                                    <Tooltip content={(props: any) => <ChartTooltipContent {...props} />} />
                                    <Legend content={(props: any) => <ChartLegendContent {...props} />} />
                                    <Bar dataKey="count" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="log-level">Log level</label>
                        <select
                            id="log-level"
                            aria-label="Log level"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="rounded border px-2 py-1"
                        >
                            <option value="debug">debug</option>
                            <option value="info">info</option>
                            <option value="warn">warn</option>
                            <option value="error">error</option>
                        </select>

                        <label className="sr-only" htmlFor="service-filter">Agent filter</label>
                        <select id="service-filter" aria-label="Filter by agent" value={serviceFilter ?? ""} onChange={(e) => setServiceFilter(e.target.value || null)} className="rounded border px-2 py-1">
                            <option value="">All</option>
                            {[...new Set(logs.map(l => l.agentId).filter(Boolean))].map((s) => (
                                <option key={String(s)} value={String(s)}>{String(s)}</option>
                            ))}
                        </select>

                        <Input placeholder="Search logs..." value={query} onChange={(e) => setQuery(e.target.value)} />
                        <Button variant="ghost" onClick={() => void fetchLogs()}>Refresh</Button>
                        <Button variant={live ? "destructive" : "default"} onClick={() => setLive((s) => !s)}>
                            {live ? "Stop Live" : "Live"}
                        </Button>
                        <Button variant={showTerminal ? "destructive" : "default"} onClick={() => setShowTerminal((s) => !s)}>
                            {showTerminal ? "Hide Terminal" : "Terminal"}
                        </Button>
                        <Button variant={terminalPaused ? "secondary" : "ghost"} onClick={() => setTerminalPaused((s) => !s)} disabled={!showTerminal}>
                            {terminalPaused ? "Resume Terminal" : "Pause Terminal"}
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    Error: {error}
                </div>
            )} 

            <Card>
                <CardHeader>
                    <CardTitle>Recent Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {showTerminal ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Button size="sm" variant={terminalPaused ? 'secondary' : 'ghost'} onClick={() => setTerminalPaused((s) => !s)}>
                                    {terminalPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setTerminalOutput("")}>Clear</Button>
                                <div className="text-xs text-muted-foreground ml-auto">WS: {live ? 'connected' : 'disconnected'}</div>
                            </div>
                            <Terminal output={terminalOutput} isStreaming={live && !terminalPaused} autoScroll={true} onClear={() => setTerminalOutput("")} />
                        </div>
                    ) : loading ? (
                        <div className="text-muted-foreground">Loading...</div>
                    ) : (
                        <ScrollArea className="h-125">
                            <div className="space-y-3 p-2">
                                {filtered.length === 0 && <div className="text-muted-foreground">No logs</div>}
                                {filtered.map((log, i) => (
                                    <div key={log.id || i} className="rounded-md border p-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(log.timestamp || Date.now()).toLocaleString()}
                                                </div>
                                                <div className="font-medium">{log.message}</div>
                                                <div className="text-xs text-muted-foreground">{log.agentId || 'system'}</div>
                                            </div>
                                            <div className="text-xs font-semibold text-muted-foreground">{log.level?.toUpperCase()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
