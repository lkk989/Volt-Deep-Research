"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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

// Custom Agent Node for Styling - MEMOIZED
const StyleAgentNode = React.memo(({ data }: { data: { label: string; icon: any; color: string } }) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-[150px] shadow-lg",
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
      "p-4 rounded-xl border bg-black/80 backdrop-blur-md min-w-[150px] shadow-lg border-white/10",
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

export function StyleNodeEditor() {
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
    setEdges((eds) => addEdge({ ...params, type: 'packet', style: { stroke: "#10b981", strokeWidth: 2 } }, eds));
    
    // Surprise Effect: Apply style changes based on connection
    if (params.source === "agent-neon") {
        document.documentElement.style.setProperty("--emerald-500", "#10b981");
        document.documentElement.style.setProperty("--emerald-600", "#059669");
    } else if (params.source === "agent-minimal") {
        document.documentElement.style.setProperty("--emerald-500", "#3b82f6");
        document.documentElement.style.setProperty("--emerald-600", "#2563eb");
    }
  }, [setEdges]);

  return (
    <section className="relative py-32 bg-black overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
            Experimental // Node_Styling_Engine
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            The <span className="text-emerald-500">Rewireable</span> Landing Page.
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Our agents don't just process data—they can manipulate the environment itself. Connect an agent to a property to "re-wire" the styling of this entire page in real-time.
          </p>
        </div>

        <div className="w-full h-[500px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-black/80 backdrop-blur-md text-xs font-mono text-slate-400 pointer-events-none">
                <MousePointer2 size={14} className="text-emerald-500" />
                DRAG SOURCE TO TARGET TO APPLY STYLING
            </div>
        </div>

        <div className="mt-12 flex justify-center">
            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-xs hover:bg-white/10 transition-all flex items-center gap-2"
            >
                <Palette size={14} />
                RESET_SYSTEM_STYLING
            </button>
        </div>
      </div>
    </section>
  );
}