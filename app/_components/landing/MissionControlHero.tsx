"use client";

import React, { useRef, useMemo } from "react";
import { ReactFlow, Background, Position, Handle, BackgroundVariant, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PacketEdge } from "./edges/PacketEdge";
import { GlitchText } from "./ui/GlitchText";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Custom Node Component for Agents - MEMOIZED
const AgentNode = React.memo(({ data }: { data: { label: string; role: string; color: string } }) => {
  return (
    <div className={cn(
        "rounded-xl border bg-black/80 px-4 py-3 shadow-lg backdrop-blur-md min-w-[180px]",
        "transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        data.color === "emerald" ? "border-emerald-500/50 shadow-emerald-500/20" : "border-slate-700 shadow-slate-900/50"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-500/50 !border-none" />
      <div className="flex items-center gap-3">
        <div className={cn("h-3 w-3 rounded-full animate-pulse", data.color === "emerald" ? "bg-emerald-500" : "bg-blue-500")} />
        <div>
            <div className="text-sm font-bold text-white font-mono">{data.label}</div>
            <div className="text-[10px] text-slate-400 font-sans">{data.role}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-500/50 !border-none" />
    </div>
  );
});

AgentNode.displayName = "AgentNode";

const initialNodes: Node[] = [
  {
    id: 'director',
    type: 'agent',
    position: { x: 400, y: 50 },
    data: { label: 'Director Agent', role: 'Orchestration & Supervision', color: 'emerald' },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  { id: 'assistant', type: 'agent', position: { x: 50, y: 250 }, data: { label: 'Assistant', role: 'Query Gen & Search', color: 'blue' }, targetPosition: Position.Top },
  { id: 'scrapper', type: 'agent', position: { x: 250, y: 350 }, data: { label: 'Scrapper', role: 'Web Data Extraction', color: 'blue' }, targetPosition: Position.Top },
  { id: 'analyzer', type: 'agent', position: { x: 450, y: 250 }, data: { label: 'Data Analyzer', role: 'Pattern Recognition', color: 'blue' }, targetPosition: Position.Top },
  { id: 'factchecker', type: 'agent', position: { x: 650, y: 350 }, data: { label: 'Fact Checker', role: 'Verification & Bias', color: 'blue' }, targetPosition: Position.Top },
  { id: 'synthesizer', type: 'agent', position: { x: 800, y: 250 }, data: { label: 'Synthesizer', role: 'Narrative Construction', color: 'blue' }, targetPosition: Position.Top },
  { id: 'writer', type: 'agent', position: { x: 400, y: 500 }, data: { label: 'Writer Agent', role: 'Report Generation', color: 'emerald' }, targetPosition: Position.Top },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'director', target: 'assistant', type: 'packet', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e2', source: 'director', target: 'scrapper', type: 'packet', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e3', source: 'director', target: 'analyzer', type: 'packet', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e4', source: 'director', target: 'factchecker', type: 'packet', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e5', source: 'director', target: 'synthesizer', type: 'packet', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e6', source: 'synthesizer', target: 'writer', type: 'packet', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e7', source: 'analyzer', target: 'synthesizer', type: 'packet', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e8', source: 'factchecker', target: 'synthesizer', type: 'packet', style: { stroke: '#3b82f6', strokeWidth: 2 } },
];

export function MissionControlHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    packet: PacketEdge,
  }), []);

  useGSAP(() => {
    gsap.from(graphRef.current, {
        opacity: 0,
        y: 100,
        duration: 1.5,
        ease: "power3.out",
        delay: 0.5
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-screen w-full bg-black pt-20">
      <div className="container mx-auto px-4 h-full flex flex-col md:flex-row gap-8 items-center">

        {/* Left Content */}
        <div className="flex-1 space-y-6 z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-mono tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                SYSTEM ACTIVE // v2.1.3
             </div>

             <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                <GlitchText>Mastervolt</GlitchText> <br />
                <span className="text-emerald-500">Deep Research.</span>
             </h1>

             <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                The enterprise multi-agent orchestration engine. Deploy the <strong>Director</strong> to coordinate specialized swarms for intelligence gathering, verification, and synthesis.
             </p>

             <div className="flex gap-4 pt-4">
                <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-sm font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    DEPLOY_AGENTS
                </button>
                <button className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg font-mono text-sm font-medium transition-all">
                    VIEW_TOPOLOGY
                </button>
             </div>
        </div>

        {/* Right Content: Interactive Graph */}
        <div ref={graphRef} className="flex-1 w-full h-[600px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden relative shadow-[0_0_50px_-20px_rgba(16,185,129,0.2)]">
            <div className="absolute top-0 left-0 right-0 p-4 border-b border-white/5 bg-white/5 flex justify-between items-center z-20">
                <div className="text-xs font-mono text-slate-400">ARCHITECTURAL_VIEW</div>
                <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="text-[10px] text-emerald-500 font-mono">LIVE</div>
                </div>
            </div>

            <div className="w-full h-full">
                <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
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
                </ReactFlow>
            </div>
        </div>

      </div>
    </section>
  );
}