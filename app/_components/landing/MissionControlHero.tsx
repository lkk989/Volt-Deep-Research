"use client";

import React, { useRef, useMemo } from "react";
import { ReactFlow, Background, Position, Handle, BackgroundVariant, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PacketEdge } from "./edges/PacketEdge";
import { GlitchText } from "./ui/GlitchText";
import { useMagnetic } from "@/hooks/use-magnetic";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Custom Node Component for Agents - MEMOIZED
const AgentNode = React.memo(({ data }: { data: { label: string; role: string; color: string } }) => {
  return (
    <div className={cn(
        "rounded-xl border bg-black/80 px-4 py-3 shadow-lg backdrop-blur-md min-w-45",
        "transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        data.color === "emerald" ? "border-emerald-500/50 shadow-emerald-500/20" : "border-slate-700 shadow-slate-900/50"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-500/50! border-none!" />
      <div className="flex items-center gap-3">
        <div className={cn("h-3 w-3 rounded-full animate-pulse", data.color === "emerald" ? "bg-emerald-500" : "bg-blue-500")} />
        <div>
            <div className="text-sm font-bold text-white font-mono">{data.label}</div>
            <div className="text-[10px] text-slate-400 font-sans">{data.role}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-500/50! border-none!" />
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  
  const magneticButtonRef = useMagnetic(0.3);

  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    packet: PacketEdge,
  }), []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Text reveal animation with clip-path
    tl.from(".reveal-text", {
      yPercent: 100,
      rotate: 2,
      opacity: 0,
      duration: 1.2,
      stagger: 0.1,
    })
    .from(textRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8,
    }, "-=0.6")
    .from(".hero-button", {
      opacity: 0,
      scale: 0.8,
      duration: 0.8,
      stagger: 0.1,
    }, "-=0.4")
    .from(graphRef.current, {
      opacity: 0,
      scale: 0.95,
      y: 40,
      duration: 1.5,
      ease: "expo.out",
    }, "-=1.2");

    // Parallax background effect
    gsap.to(".hero-bg-accent", {
      yPercent: -20,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-screen w-full bg-background pt-20 overflow-hidden">
      {/* Parallax Background Accents */}
      <div className="hero-bg-accent absolute top-1/4 -right-20 w-150 h-150 bg-emerald-500/10 rounded-full blur-120 pointer-events-none" />
      <div className="hero-bg-accent absolute bottom-1/4 -left-20 w-120 h-120 bg-blue-500/10 rounded-full blur-120 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 h-full flex flex-col md:flex-row gap-12 items-center py-20 min-h-[calc(100vh-80px)]">

        {/* Left Content */}
        <div className="flex-1 space-y-8 z-10">
             <div className="overflow-hidden">
               <Badge variant="secondary" className="reveal-text inline-flex items-center gap-2 px-3 py-1 text-xs font-mono tracking-wide text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  SYSTEM ACTIVE // v2.1.3
               </Badge>
             </div>

             <div className="space-y-2">
               <div className="overflow-hidden">
                 <h1 ref={titleRef} className="reveal-text text-5xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9]">
                    <GlitchText>Mastervolt</GlitchText>
                 </h1>
               </div>
               <div className="overflow-hidden">
                 <h1 className="reveal-text text-5xl md:text-8xl font-black tracking-tighter text-emerald-500 leading-[0.9]">
                    Deep Research.
                 </h1>
               </div>
             </div>

             <div ref={textRef}>
               <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
                  The enterprise multi-agent orchestration engine. Deploy the <strong>Director</strong> to coordinate specialized swarms for intelligence gathering, verification, and synthesis.
               </p>
             </div>

             <div className="flex flex-wrap gap-4 pt-4">
                <div ref={magneticButtonRef as any}>
                  <Button asChild className="hero-button px-8 py-8 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-bold tracking-widest transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] border-emerald-400">
                    <a href="/deploy">DEPLOY_AGENTS_v2</a>
                  </Button>
                </div>
                <Button asChild variant="outline" className="hero-button px-8 py-8 border-white/10 hover:bg-white/5 text-white font-mono text-sm font-medium">
                  <a href="#agents">VIEW_TOPOLOGY</a>
                </Button>
             </div>
        </div>

        {/* Right Content: Interactive Graph */}
        <div ref={graphRef} className="flex-1 w-full h-150 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative shadow-[0_0_80px_-20px_rgba(16,185,129,0.25)] group">
            <div className="absolute top-0 left-0 right-0 p-5 border-b border-white/5 bg-white/5 flex justify-between items-center z-20">
                <div className="text-xs font-mono text-slate-500 tracking-widest">ARCHITECTURAL_VIEW // LIVE_NODES</div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Badge variant="ghost" className="text-emerald-500 text-[10px] font-mono border-none bg-emerald-500/10">STREAMING</Badge>
                </div>
            </div>

            <div className="w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000">
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
            
            {/* Viewport Overlay Gradient */}
            <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/20 to-transparent" />
        </div>

      </div>
    </section>
  );
}
