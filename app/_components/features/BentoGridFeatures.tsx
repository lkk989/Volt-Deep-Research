"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Asset_CpuCore } from "../landing/assets/Asset_CpuCore";
import { Asset_NetworkMesh } from "../landing/assets/Asset_NetworkMesh";
import { Asset_DataStream } from "../landing/assets/Asset_DataStream";
import { Asset_Shield } from "../landing/assets/Asset_Shield";
import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Autonomous Orchestration",
    description: "The Director agent decomposes complex objectives into executable tasks for specialized sub-agents.",
    asset: Asset_CpuCore,
    className: "md:col-span-2 md:row-span-2",
    color: "emerald"
  },
  {
    title: "Semantic Memory",
    description: "Persistent context across sessions using vector embeddings and LibSQL.",
    asset: Asset_Shield,
    className: "md:col-span-1 md:row-span-1",
    color: "blue"
  },
  {
    title: "Dynamic Swarms",
    description: "Agents self-organize into mission-specific topologies based on real-time data.",
    asset: Asset_NetworkMesh,
    className: "md:col-span-1 md:row-span-2",
    color: "emerald"
  },
  {
    title: "Live Data Streams",
    description: "Real-time extraction and synthesis of web data, market feeds, and custom APIs.",
    asset: Asset_DataStream,
    className: "md:col-span-1 md:row-span-1",
    color: "blue"
  },
  {
    title: "Secure Handoffs",
    description: "Encrypted agent-to-agent communication protocols ensure data integrity.",
    asset: Asset_Shield,
    className: "md:col-span-1 md:row-span-1",
    color: "emerald"
  }
];

export function BentoGridFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 h-full">
      {FEATURES.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          viewport={{ once: true }}
          className={cn(
            "relative group overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 flex flex-col justify-between hover:border-white/10 transition-all duration-500",
            feature.className
          )}
        >
          {/* Asset Background */}
          <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
             <feature.asset color={feature.color as "emerald" | "blue"} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className={cn(
                "h-12 w-12 rounded-2xl border flex items-center justify-center",
                feature.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-blue-500/20 bg-blue-500/10 text-blue-400"
            )}>
                <feature.asset className="w-8 h-8" color={feature.color as "emerald" | "blue"} />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className={cn("h-1.5 w-1.5 rounded-full", feature.color === "emerald" ? "bg-emerald-500" : "bg-blue-500")} />
            System_Component // {feature.color}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
