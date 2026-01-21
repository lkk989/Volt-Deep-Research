"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { PacketEdge } from "./edges/PacketEdge";
import { Badge } from "@/components/ui/badge";

// Custom Node Component - Memoized
const DomainNode = React.memo(({ data }: { data: { label: string; icon: any; color: string; description: string } }) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "group relative flex flex-col items-center justify-center p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-37.5 transition-all duration-500",
      data.color === "emerald" 
        ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
        : "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-500/50! border-none!" />
      
      <div className={cn(
        "p-3 rounded-lg mb-2 transition-colors duration-500",
        data.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
      )}>
        <Icon size={24} />
      </div>
      <div className="text-sm font-mono font-bold text-white mb-1">{data.label}</div>
      <div className="text-[10px] text-slate-500 text-center max-w-30">{data.description}</div>
      
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-500/50! border-none!" />
      
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function DomainSwitcher() {
  const containerRef = useRef<HTMLDivElement>(null);
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
    // Animation for switching
    gsap.to(".graph-container", {
      opacity: 0,
      scale: 0.98,
      duration: 0.3,
      onComplete: () => {
        setActiveDomain(domain);
        setNodes(DOMAINS[domain].nodes);
        setEdges(DOMAINS[domain].edges);
        gsap.to(".graph-container", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
      }
    });
  }, [setNodes, setEdges]);

  useGSAP(() => {
    gsap.from(".switcher-info", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      },
      opacity: 0,
      x: -50,
      duration: 1,
      stagger: 0.2,
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="features" className="relative py-32 bg-background overflow-hidden border-t border-white/5">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          
          {/* Left: Info & Controls */}
          <div className="flex-1 space-y-10 switcher-info">
            <div className="space-y-6">
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/5">
                Dynamic Topologies
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-none">
                Multi-Domain <br />
                <span className="text-emerald-500 underline decoration-emerald-500/20 underline-offset-8">Orchestration.</span>
              </h2>
              <p className="text-muted-foreground max-w-md text-lg leading-relaxed font-medium">
                Mastervolt adapts its agent swarms dynamically based on the mission context. Switch domains to see how the Director re-configures the topology for different specialized tasks.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["research", "trading", "analysis"] as Domain[]).map((d) => (
                <Button
                  key={d}
                  onClick={() => switchDomain(d)}
                  variant={activeDomain === d ? "default" : "outline"}
                  className={cn(
                    "px-6 py-6 h-12 rounded-xl font-mono text-xs font-bold transition-all duration-500 uppercase tracking-widest",
                    activeDomain === d
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30 shadow-2xl"
                      : "border-white/10 text-muted-foreground hover:border-white/30 bg-white/5"
                  )}
                >
                  {d}_MODE
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/5 hover:border-emerald-500/30 transition-all duration-500 group">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest font-bold">Topology_Status</CardDescription>
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase italic">{activeDomain === "research" ? "READY" : "ADAPTING"}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white/5 border-white/5 hover:border-blue-500/30 transition-all duration-500 group">
                <CardHeader className="pb-2">
                  <CardDescription className="text-blue-500 font-mono text-[10px] uppercase tracking-widest font-bold">Network_Latency</CardDescription>
                  <CardTitle className="text-2xl font-black tracking-tighter italic">0.42ms</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Right: Interactive Graph */}
          <div className="graph-container flex-[1.5] w-full h-150 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative group shadow-2xl transition-shadow duration-1000 hover:shadow-emerald-500/10">
            <div className="absolute top-0 left-0 right-0 p-6 border-b border-white/5 bg-white/5 flex justify-between items-center z-20 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  Topology <span className="text-white/20">//</span> <span className="text-emerald-500/80">ARCH_v2.0</span> <span className="text-white/20">//</span> {activeDomain}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-mono text-blue-400 bg-blue-500/10 border-blue-500/20">ENCRYPTED</Badge>
                <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">SYNCED</Badge>
              </div>
            </div>

            <div className="w-full h-full grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000">
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