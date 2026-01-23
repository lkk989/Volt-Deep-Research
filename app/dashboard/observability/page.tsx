"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/base/chart'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'

type Trace = {
    id: string
    name?: string
    durationMs?: number
    startTime?: string
    service?: string
    status?: string
}

export default function ObservabilityPage() {
    const [traces, setTraces] = useState<Trace[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Trace | null>(null)
    const [traceLogs, setTraceLogs] = useState<any[]>([])
    const [spans, setSpans] = useState<any[]>([])
    const [selectedSpan, setSelectedSpan] = useState<any | null>(null)
    const [spanLogs, setSpanLogs] = useState<any[]>([])

    const backend =
        (process.env.NEXT_PUBLIC_API_URL as string) ||
        (process.env.NEXT_PUBLIC_VOLTAGENT_URL as string) ||
        'http://localhost:3141'

    const [serviceFilter, setServiceFilter] = useState<string | null>(null)
    const [query, setQuery] = useState<string>('')
    const [debouncedQuery, setDebouncedQuery] = useState(query)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(t)
    }, [query])

    async function fetchTraces() {
        setLoading(true)
        setError(null)
        try {
            const url = `${backend.replace(/\/$/, '')}/observability/traces?limit=50`
            const res = await fetch(url)
            if (!res.ok) throw new Error('Failed to load traces')
            const json = await res.json()
            setTraces(json.data || [])
            setLastUpdated(new Date().toISOString())
        } catch (err: any) {
            console.error('Failed to fetch traces', err)
            setError(err?.message || String(err))
            setTraces([])
        } finally {
            setLoading(false)
        }
    }

    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        void fetchTraces()

        // fetch observability status
        ;(async () => {
            try {
                const res = await fetch(`${backend.replace(/\/$/, '')}/observability/status`)
                if (!res.ok) throw new Error('Failed to fetch observability status')
                const json = await res.json()
                setStatus(json?.data?.status || 'unknown')
            } catch (err) {
                console.warn('Unable to fetch observability status', err)
                setStatus('unknown')
            }
        })()
    }, [])

    async function loadTraceDetails(traceId: string) {
        try {
            const res = await fetch(`${backend.replace(/\/$/, '')}/observability/traces/${encodeURIComponent(traceId)}`)
            if (!res.ok) throw new Error('Failed to load trace')
            const json = await res.json()
            setSelected(json.data || null)

            const logsRes = await fetch(`${backend.replace(/\/$/, '')}/observability/traces/${encodeURIComponent(traceId)}/logs`)
            if (logsRes.ok) {
                const logsJson = await logsRes.json()
                setTraceLogs(logsJson.data || [])
            } else {
                setTraceLogs([])
            }

            // Try to set spans if returned in trace detail
            if (json?.data?.spans) {
                setSpans(json.data.spans)
            } else {
                // no-op; spans may be available via separate endpoints
                setSpans([])
            }        } catch (err) {
            console.error('Failed to load trace details', err)
            setSelected(null)
            setTraceLogs([])
        }
    }

    // Compute filtered traces based on service filter and debounced query
    const filteredTraces = useMemo(() => {
        return traces.filter((t) => {
            if (serviceFilter && String(t.service || '') !== serviceFilter) return false
            if (!debouncedQuery) return true
            const q = debouncedQuery.toLowerCase()
            return (
                String(t.name || '').toLowerCase().includes(q) ||
                String(t.service || '').toLowerCase().includes(q) ||
                String(t.id || '').toLowerCase().includes(q)
            )
        })
    }, [traces, serviceFilter, debouncedQuery])

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Observability</h1>
                    <p className="text-muted-foreground">Traces and spans from VoltAgent</p>
                    {lastUpdated && <div className="text-xs text-muted-foreground">Last updated: {new Date(lastUpdated).toLocaleString()}</div>}
                </div>
                <div className="flex items-center gap-3">
                    <label className="sr-only" htmlFor="service-filter">Service</label>
                    <select id="service-filter" aria-label="Filter by service" value={serviceFilter ?? ''} onChange={(e) => setServiceFilter(e.target.value || null)} className="rounded border px-2 py-1">
                        <option value="">All</option>
                        {[...new Set(traces.map(t => t.service).filter(Boolean))].map((s) => (
                            <option key={String(s)} value={String(s)}>{String(s)}</option>
                        ))}
                    </select>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search traces" className="rounded border px-2 py-1" />
                    <Button variant="ghost" onClick={() => void fetchTraces()}>Refresh</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Traces</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-muted-foreground">Loading traces...</div>
                        ) : (
                            <ScrollArea className="h-125">
                                <div className="space-y-2 p-2">
                                    {filteredTraces.length === 0 && <div className="text-muted-foreground">No traces found</div>}
                                    {filteredTraces.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                                            <div>
                                                <div className="font-medium">{t.name || t.id}</div>
                                                <div className="text-xs text-muted-foreground">{t.service || 'unknown'} • {t.durationMs ? `${t.durationMs} ms` : '—'}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={() => loadTraceDetails(t.id)}>View</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                        <div className="mt-4">
                            <ChartContainer id="trace-durations" config={{ duration: { label: 'Duration (ms)', color: '#7c3aed' } }}>
                                <ResponsiveContainer width="100%" height={80}>
                                    <BarChart data={filteredTraces.map(t => ({ id: t.id, name: t.name || t.id, duration: t.durationMs || 0 }))} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide />
                                        <Tooltip content={(props: any) => <ChartTooltipContent {...props} />} />
                                        <Legend content={(props: any) => <ChartLegendContent {...props} />} />
                                        <Bar dataKey="duration" fill="#7c3aed" onClick={(e: any) => loadTraceDetails(e?.payload?.id)} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Trace Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selected ? (
                            <div className="space-y-3">
                                <div className="text-sm font-medium">{selected.name || selected.id}</div>
                                <div className="text-xs text-muted-foreground">Service: {selected.service || 'n/a'}</div>
                                <div className="text-xs text-muted-foreground">Duration: {selected.durationMs ?? '—'} ms</div>
                                <div className="pt-2 text-xs font-semibold">Logs</div>
                                <div className="space-y-2 max-h-45 overflow-auto">
                                    {traceLogs.length === 0 && <div className="text-muted-foreground">No trace logs</div>}
                                    {traceLogs.map((l, i) => (
                                        <div key={i} className="rounded border p-2 text-xs">
                                            <div className="text-muted-foreground">{new Date(l.timestamp || Date.now()).toLocaleString()}</div>
                                            <div>{l.message || JSON.stringify(l)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 text-xs font-semibold">Spans</div>
                                <div className="space-y-2 max-h-45 overflow-auto">
                                    {spans.length === 0 && <div className="text-muted-foreground">No spans</div>}
                                    {spans.map((s: any, idx: number) => (
                                        <div key={s.id || idx} className="rounded border p-2 text-xs">
                                            <div className="font-medium">{s.name || s.id}</div>
                                            <div className="text-xs text-muted-foreground">{s.service || 'n/a'} • {s.duration ? `${s.duration} ms` : '—'}</div>
                                            <div className="mt-2 flex gap-2">
                                                <Button size="sm" onClick={async () => {
                                                    setSelectedSpan(s)
                                                    try {
                                                        const res = await fetch(`${backend.replace(/\/$/, '')}/observability/spans/${encodeURIComponent(s.id)}/logs`)
                                                        if (!res.ok) throw new Error('Failed to load span logs')
                                                        const json = await res.json()
                                                        setSpanLogs(json.data || [])
                                                    } catch (err) {
                                                        console.error('Failed to load span logs', err)
                                                        setSpanLogs([])
                                                    }
                                                }}>Logs</Button>
                                                <Button size="sm" onClick={async () => {
                                                    // load span detail
                                                    try {
                                                        const res = await fetch(`${backend.replace(/\/$/, '')}/observability/spans/${encodeURIComponent(s.id)}`)
                                                        if (!res.ok) throw new Error('Failed to load span')
                                                        const json = await res.json()
                                                        setSelectedSpan(json.data || s)
                                                    } catch (err) {
                                                        console.error('Failed to load span', err)
                                                    }
                                                }}>View</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedSpan && (
                                    <div className="pt-3">
                                        <div className="text-xs font-semibold">Selected Span</div>
                                        <div className="rounded border p-2 text-xs">
                                            <div className="font-medium">{selectedSpan.name || selectedSpan.id}</div>
                                            <div className="text-xs text-muted-foreground">Service: {selectedSpan.service || 'n/a'}</div>
                                            <div className="text-xs text-muted-foreground">Duration: {selectedSpan.duration ?? '—'}</div>
                                            <div className="pt-2 text-xs font-semibold">Logs</div>
                                            <div className="space-y-2 max-h-45 overflow-auto">
                                                {spanLogs.length === 0 && <div className="text-muted-foreground">No span logs</div>}
                                                {spanLogs.map((l, i) => (
                                                    <div key={i} className="rounded border p-2 text-xs">
                                                        <div className="text-muted-foreground">{new Date(l.timestamp || Date.now()).toLocaleString()}</div>
                                                        <div>{l.message || JSON.stringify(l)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">Select a trace to view details</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
