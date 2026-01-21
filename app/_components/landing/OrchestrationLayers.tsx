"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Layers, Cpu, Network, Database, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function OrchestrationLayers() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Parallax effect for assets
    const assets = gsap.utils.toArray(".layer-asset");
    assets.forEach((asset: any) => {
      gsap.to(asset, {
        yPercent: 30,
        rotate: 5,
        ease: "none",
        scrollTrigger: {
          trigger: asset,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        }
      });
    });

    // Content reveal
    const items = gsap.utils.toArray(".layer-item");
    items.forEach((item: any) => {
      gsap.from(item.querySelector(".layer-content"), {
        opacity: 0,
        y: 50,
        duration: 0.8,
        scrollTrigger: {
          trigger: item,
          start: "top 80%",
        }
      });
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="agents" className="relative py-32 bg-background overflow-hidden border-t border-white/5">
      {/* Decorative center line with glow */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-emerald-500/50 to-transparent hidden md:block opacity-20" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="text-center mb-32 space-y-6">
          <Badge variant="outline" className="text-blue-500 border-blue-500/20 font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/5">
            Architecture Stack
          </Badge>
          <h2 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter leading-none">
            System <span className="text-emerald-500 italic">Architecture.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xl leading-relaxed font-medium">
            A modular, layered approach to autonomous intelligence. Every level is optimized for performance, scalability, and seamless agentic collaboration.
          </p>
        </div>

        <div className="space-y-40 md:space-y-0 relative">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            const Asset = layer.asset;
            return (
              <div 
                key={layer.id} 
                className={cn(
                  "layer-item flex flex-col md:flex-row items-center gap-12 md:gap-32 py-20",
                  i % 2 !== 0 && "md:flex-row-reverse"
                )}
              >
                {/* Content */}
                <div className="layer-content flex-1 space-y-8 text-center md:text-left">
                  <div className={cn(
                    "inline-flex p-5 rounded-2xl border shadow-2xl transition-transform hover:scale-110 duration-500",
                    layer.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/10" : "border-blue-500/20 bg-blue-500/5 text-blue-400 shadow-blue-500/10"
                  )}>
                    <Icon size={40} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                        {layer.title}
                    </h3>
                    <p className="text-muted-foreground text-xl leading-relaxed max-w-lg mx-auto md:mx-0 font-medium">
                        {layer.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {layer.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="px-3 py-1 text-[10px] font-mono text-slate-400 border-white/5 bg-white/5 uppercase tracking-widest font-bold">
                            {tag}
                        </Badge>
                    ))}
                  </div>
                </div>

                {/* Visual Connector / Placeholder */}
                <div className="flex-1 flex justify-center items-center">
                    <div className={cn(
                        "relative w-72 h-72 md:w-96 md:h-96 rounded-3xl border border-dashed transition-all duration-1000 group/asset overflow-hidden",
                        layer.color === "emerald" ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]" : "border-blue-500/30 bg-blue-500/5 shadow-[0_0_50px_rgba(59,130,246,0.1)]"
                    )}>
                        {/* Parallax Asset Background */}
                        <div className="layer-asset absolute inset-0 opacity-20 scale-150 grayscale group-hover/asset:grayscale-0 transition-all duration-1000">
                            <Asset color={layer.color as "emerald" | "blue"} />
                        </div>

                        <div className="absolute inset-6 rounded-3xl border border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-Inner">
                             <div className={cn(
                                "w-full h-full opacity-20 absolute inset-0 transition-opacity duration-1000 group-hover/asset:opacity-40",
                                layer.color === "emerald" ? "bg-[radial-gradient(circle_at_center,#10b981_0,transparent_70%)]" : "bg-[radial-gradient(circle_at_center,#3b82f6_0,transparent_70%)]"
                             )} />
                             {/* Main Center Asset */}
                             <div className="w-40 h-40 relative z-10 transition-transform duration-1000 group-hover/asset:scale-110">
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

