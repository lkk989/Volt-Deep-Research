"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { Palette, MousePointer2, Sparkles, Wand2 } from "lucide-react";
import { PacketEdge } from "./edges/PacketEdge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Custom Agent Node for Styling - MEMOIZED
const StyleAgentNode = React.memo(({ data }: { data: { label: string; icon: any; color: string } }) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-37.5 shadow-lg",
      data.color === "emerald" ? "border-emerald-500/50" : "border-blue-500/50"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          data.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
        )}>
          <Icon size={20} />
        </div>
        <div className="text-sm font-mono font-bold text-white uppercase tracking-tighter">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-black" />
    </div>
  );
});
StyleAgentNode.displayName = "StyleAgentNode";

// Custom Property Node - MEMOIZED
const PropertyNode = React.memo(({ data }: { data: { label: string; value: string; color: string } }) => {
  return (
    <div className={cn(
      "p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-37.5 shadow-lg border-white/10",
      "hover:border-white/30 transition-all duration-300"
    )}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-black" />
      <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">Property</div>
      <div className="text-sm font-bold text-white">{data.label}</div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full transition-all duration-500", data.color)} style={{ width: '60%' }} />
      </div>
    </div>
  );
});
PropertyNode.displayName = "PropertyNode";

const initialNodes: Node[] = [
  {
    id: "agent-neon",
    type: "styleAgent",
    position: { x: 50, y: 100 },
    data: { label: "NeonVibe Agent", icon: Sparkles, color: "emerald" }
  },
  {
    id: "agent-minimal",
    type: "styleAgent",
    position: { x: 50, y: 250 },
    data: { label: "Minimalist Agent", icon: Wand2, color: "blue" }
  },
  {
    id: "prop-color",
    type: "property",
    position: { x: 400, y: 50 },
    data: { label: "Primary Accent", value: "#10b981", color: "bg-emerald-500" }
  },
  {
    id: "prop-glow",
    type: "property",
    position: { x: 400, y: 180 },
    data: { label: "Shadow Glow", value: "20px", color: "bg-blue-500" }
  },
  {
    id: "prop-radius",
    type: "property",
    position: { x: 400, y: 310 },
    data: { label: "Corner Radius", value: "12px", color: "bg-slate-500" }
  },
];

const initialEdges: Edge[] = [];

import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function StyleNodeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({
    styleAgent: StyleAgentNode,
    property: PropertyNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    packet: PacketEdge,
  }), []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'packet', animated: true, style: { stroke: "#10b981", strokeWidth: 2 } }, eds));
    
    // Dramatic Style Transition
    const tl = gsap.timeline();
    
    if (params.source === "agent-neon") {
        document.documentElement.style.setProperty("--emerald-500", "#10b981");
        document.documentElement.style.setProperty("--background", "0 0% 0%");
        toast.success("SYSTEM ALERT: NEON_VIBE_MODE // ENABLED", {
          description: "Global CSS variables re-wired to emerald high-glow palette.",
          icon: <Sparkles className="w-4 h-4" />
        });
    } else if (params.source === "agent-minimal") {
        document.documentElement.style.setProperty("--emerald-500", "#3b82f6");
        document.documentElement.style.setProperty("--background", "222 47% 11%");
        toast.info("SYSTEM ALERT: MINIMALIST_MODE // ENABLED", {
          description: "Global CSS variables re-wired to deep blue slate palette.",
          icon: <Wand2 className="w-4 h-4" />
        });
    }

    // Flash the background
    tl.to(".editor-container", {
        borderColor: params.source === "agent-neon" ? "#10b981" : "#3b82f6",
        boxShadow: params.source === "agent-neon" ? "0 0 50px rgba(16,185,129,0.2)" : "0 0 50px rgba(59,130,246,0.2)",
        duration: 0.5,
    }).to(".editor-container", {
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: "none",
        duration: 2,
    });

  }, [setEdges]);

  useGSAP(() => {
    gsap.from(".editor-header", {
        scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
        },
        opacity: 0,
        y: 30,
        duration: 1,
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative py-32 bg-background overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="editor-header flex flex-col items-center text-center mb-24 space-y-6">
          <Badge variant="outline" className="px-3 py-1 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.3em] border-emerald-500/20 bg-emerald-500/5 font-bold">
            Experimental // Node_Styling_Engine
          </Badge>
          <h2 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter leading-none italic">
            Rewireable <span className="text-emerald-500 not-italic">UI/UX.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl text-xl leading-relaxed font-medium">
            Our agents don't just process data—they can manipulate the environment itself. Connect an agent to a property to "re-wire" the styling of this entire page in real-time.
          </p>
        </div>

        <div className="editor-container w-full h-150 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl relative overflow-hidden group shadow-2xl transition-all duration-700">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
                onlyRenderVisibleElements={true}
                proOptions={{ hideAttribution: true }}
                className="bg-transparent"
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

            {/* Instruction Overlay */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 rounded-full border border-emerald-500/30 bg-black/90 backdrop-blur-md text-[10px] font-mono font-black text-emerald-400 pointer-events-none uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <MousePointer2 size={16} className="text-emerald-500 animate-bounce" />
                DRAG SOURCE TO TARGET TO_APPLY_STYLING
            </div>
        </div>

        <div className="mt-16 flex justify-center">
            <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="px-10 py-7 h-14 rounded-xl flex items-center gap-3 font-mono text-xs font-bold tracking-widest text-white border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all uppercase"
            >
                <Wand2 size={18} />
                RESET_SYSTEM_STYLING
            </Button>
        </div>
      </div>
    </section>
  );
}
