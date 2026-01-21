"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Layers, Cpu, Network, Database, Globe } from "lucide-react";
import { Asset_CpuCore } from "./assets/Asset_CpuCore";
import { Asset_NetworkMesh } from "./assets/Asset_NetworkMesh";
import { Asset_DataStream } from "./assets/Asset_DataStream";
import { Asset_Shield } from "./assets/Asset_Shield";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LAYERS = [
  {
    id: "interface",
    title: "Interface Layer",
    description: "Built on Next.js 16 and Hono, providing a lightning-fast, edge-ready gateway for user interactions and API orchestration.",
    icon: Globe,
    asset: Asset_NetworkMesh,
    color: "emerald",
    tags: ["Next.js", "Hono", "WebSocket"]
  },
  {
    id: "orchestration",
    title: "Orchestration Layer",
    description: "The Director agent supervises task decomposition, state management, and multi-agent coordination via the VoltAgent framework.",
    icon: Cpu,
    asset: Asset_CpuCore,
    color: "blue",
    tags: ["VoltAgent", "Director", "Stateful"]
  },
  {
    id: "swarm",
    title: "Agent Swarm Layer",
    description: "Specialized agents for scraping, analysis, synthesis, and coding. Each agent is purpose-built with dedicated toolkits.",
    icon: Network,
    asset: Asset_DataStream,
    color: "emerald",
    tags: ["Specialized", "Toolkits", "Swarm"]
  },
  {
    id: "memory",
    title: "Semantic Memory Layer",
    description: "Persistent context storage using LibSQL and vector embeddings, allowing agents to maintain long-term knowledge across sessions.",
    icon: Database,
    asset: Asset_Shield,
    color: "blue",
    tags: ["LibSQL", "Vector DB", "Embeddings"]
  }
];

export function OrchestrationLayers() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const layers = gsap.utils.toArray(".layer-item");
    
    layers.forEach((layer: any, i) => {
      gsap.from(layer, {
        opacity: 0,
        x: i % 2 === 0 ? -100 : 100,
        duration: 1,
        scrollTrigger: {
          trigger: layer,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
          scrub: 1, // Smooth scrubbing
        }
      });
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="agents" className="relative py-32 bg-black overflow-hidden">
      {/* Vertical line through center */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent hidden md:block" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            System <span className="text-emerald-500">Architecture.</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A modular, layered approach to autonomous intelligence. Every level is optimized for performance, scalability, and seamless agentic collaboration.
          </p>
        </div>

        <div ref={layersRef} className="space-y-12 md:space-y-0 relative">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            const Asset = layer.asset;
            return (
              <div 
                key={layer.id} 
                className={cn(
                  "layer-item flex flex-col md:flex-row items-center gap-8 md:gap-24 py-12",
                  i % 2 !== 0 && "md:flex-row-reverse"
                )}
              >
                {/* Content */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className={cn(
                    "inline-flex p-4 rounded-2xl border",
                    layer.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-blue-500/20 bg-blue-500/5 text-blue-400"
                  )}>
                    <Icon size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {layer.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed max-w-lg mx-auto md:mx-0">
                        {layer.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {layer.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            {tag}
                        </span>
                    ))}
                  </div>
                </div>

                {/* Visual Connector / Placeholder */}
                <div className="flex-1 flex justify-center items-center">
                    <div className={cn(
                        "relative w-64 h-64 md:w-80 md:h-80 rounded-3xl border border-dashed transition-all duration-700 overflow-hidden",
                        layer.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5"
                    )}>
                        {/* Animated Asset Background */}
                        <div className="absolute inset-0 opacity-20">
                            <Asset color={layer.color as "emerald" | "blue"} />
                        </div>

                        <div className="absolute inset-4 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                             <div className={cn(
                                "w-full h-full opacity-10 absolute inset-0",
                                layer.color === "emerald" ? "bg-[radial-gradient(circle_at_center,_#10b981_0,_transparent_70%)]" : "bg-[radial-gradient(circle_at_center,_#3b82f6_0,_transparent_70%)]"
                             )} />
                             {/* Main Center Asset */}
                             <div className="w-32 h-32 relative z-10">
                                <Asset color={layer.color as "emerald" | "blue"} />
                             </div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
