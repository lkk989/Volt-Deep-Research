"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { Search, TrendingUp, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { PacketEdge } from "./edges/PacketEdge";

// Custom Node Component - Memoized
const DomainNode = React.memo(({ data }: { data: { label: string; icon: any; color: string; description: string } }) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "group relative flex flex-col items-center justify-center p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-[150px] transition-all duration-500",
      data.color === "emerald" 
        ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]" 
        : "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-500/50 !border-none" />
      
      <div className={cn(
        "p-3 rounded-lg mb-2 transition-colors duration-500",
        data.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
      )}>
        <Icon size={24} />
      </div>
      <div className="text-sm font-mono font-bold text-white mb-1">{data.label}</div>
      <div className="text-[10px] text-slate-500 text-center max-w-[120px]">{data.description}</div>
      
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-500/50 !border-none" />
      
      {/* Animated Ping */}
      <div className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          data.color === "emerald" ? "bg-emerald-400" : "bg-blue-400"
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-3 w-3",
          data.color === "emerald" ? "bg-emerald-500" : "bg-blue-500"
        )}></span>
      </div>
    </div>
  );
});

DomainNode.displayName = "DomainNode";

type Domain = "research" | "trading" | "analysis";

const DOMAINS: Record<Domain, { nodes: Node[]; edges: Edge[] }> = {
  research: {
    nodes: [
      { id: "center", type: "domain", position: { x: 300, y: 150 }, data: { label: "Director", icon: Zap, color: "emerald", description: "Core Orchestrator" } },
      { id: "n1", type: "domain", position: { x: 50, y: 50 }, data: { label: "Assistant", icon: Search, color: "blue", description: "Query Generation" } },
      { id: "n2", type: "domain", position: { x: 550, y: 50 }, data: { label: "Scrapper", icon: ShieldCheck, color: "blue", description: "Web Extraction" } },
      { id: "n3", type: "domain", position: { x: 300, y: 350 }, data: { label: "Synthesizer", icon: BarChart3, color: "blue", description: "Report Creation" } },
    ],
    edges: [
      { id: "e1", source: "center", target: "n1", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e2", source: "center", target: "n2", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e3", source: "center", target: "n3", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
    ]
  },
  trading: {
    nodes: [
      { id: "center", type: "domain", position: { x: 300, y: 150 }, data: { label: "Director", icon: Zap, color: "emerald", description: "Portfolio Manager" } },
      { id: "n1", type: "domain", position: { x: 50, y: 50 }, data: { label: "AlphaGen", icon: TrendingUp, color: "blue", description: "Signal Discovery" } },
      { id: "n2", type: "domain", position: { x: 550, y: 50 }, data: { label: "RiskEngine", icon: ShieldCheck, color: "blue", description: "Execution Control" } },
      { id: "n3", type: "domain", position: { x: 300, y: 350 }, data: { label: "Backtester", icon: BarChart3, color: "blue", description: "Strategy Validation" } },
    ],
    edges: [
      { id: "e1", source: "center", target: "n1", type: "packet", style: { stroke: "#3b82f6", strokeWidth: 2 } },
      { id: "e2", source: "center", target: "n2", type: "packet", style: { stroke: "#3b82f6", strokeWidth: 2 } },
      { id: "e3", source: "center", target: "n3", type: "packet", style: { stroke: "#3b82f6", strokeWidth: 2 } },
    ]
  },
  analysis: {
    nodes: [
      { id: "center", type: "domain", position: { x: 300, y: 150 }, data: { label: "Director", icon: Zap, color: "emerald", description: "Data Scientist" } },
      { id: "n1", type: "domain", position: { x: 50, y: 50 }, data: { label: "PatternBot", icon: BarChart3, color: "blue", description: "Anomaly Detection" } },
      { id: "n2", type: "domain", position: { x: 550, y: 50 }, data: { label: "StatEngine", icon: TrendingUp, color: "blue", description: "Regression Models" } },
      { id: "n3", type: "domain", position: { x: 300, y: 350 }, data: { label: "VisuGen", icon: Zap, color: "blue", description: "Insight Generation" } },
    ],
    edges: [
      { id: "e1", source: "center", target: "n1", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e2", source: "center", target: "n2", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e3", source: "center", target: "n3", type: "packet", style: { stroke: "#10b981", strokeWidth: 2 } },
    ]
  }
};

export function DomainSwitcher() {
  const [activeDomain, setActiveDomain] = useState<Domain>("research");
  const [nodes, setNodes, onNodesChange] = useNodesState(DOMAINS.research.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DOMAINS.research.edges);

  const nodeTypes = useMemo(() => ({
    domain: DomainNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    packet: PacketEdge,
  }), []);

  const switchDomain = useCallback((domain: Domain) => {
    setActiveDomain(domain);
    setNodes(DOMAINS[domain].nodes);
    setEdges(DOMAINS[domain].edges);
  }, [setNodes, setEdges]);

  return (
    <section id="features" className="relative py-24 bg-black overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left: Info & Controls */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Multi-Domain <br />
                <span className="text-emerald-500">Orchestration.</span>
              </h2>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Mastervolt adapts its agent swarms dynamically based on the mission context. Switch domains to see how the Director re-configures the topology for different specialized tasks.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {(["research", "trading", "analysis"] as Domain[]).map((d) => (
                <button
                  key={d}
                  onClick={() => switchDomain(d)}
                  className={cn(
                    "px-6 py-3 rounded-xl font-mono text-sm transition-all duration-300 border",
                    activeDomain === d
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
                  )}
                >
                  {d.toUpperCase()}_MODE
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2">
                <div className="text-xs font-mono text-emerald-500">STATUS</div>
                <div className="text-lg font-bold text-white uppercase tracking-tighter">
                    {activeDomain === "research" ? "READY" : "ADAPTING..."}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2">
                <div className="text-xs font-mono text-blue-500">LATENCY</div>
                <div className="text-lg font-bold text-white">0.42ms</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Graph */}
          <div className="flex-[1.5] w-full h-[600px] rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 p-6 border-b border-white/5 bg-white/5 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  Topology // {activeDomain}_v2.0
                </div>
              </div>
              <div className="flex gap-2">
                <div className="px-2 py-1 rounded bg-blue-500/10 text-[10px] font-mono text-blue-400">ENCRYPTED</div>
                <div className="px-2 py-1 rounded bg-emerald-500/10 text-[10px] font-mono text-emerald-400">SYNCED</div>
              </div>
            </div>

            <div className="w-full h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
                onlyRenderVisibleElements={true}
                proOptions={{ hideAttribution: true }}
                className="bg-black/0"
              >
                <Background 
                    color="#10b981" 
                    variant={BackgroundVariant.Dots}
                    gap={24} 
                    size={1} 
                    style={{ opacity: 0.15 }} 
                />
                <Controls className="fill-white border-white/10 bg-black/50" />
              </ReactFlow>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}