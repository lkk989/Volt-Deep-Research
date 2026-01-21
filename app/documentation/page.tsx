"use client";

import { LandingNavbar } from "../_components/landing/LandingNavbar";
import { LandingFooter } from "../_components/landing/LandingFooter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Zap, Network } from "lucide-react";
import { useState } from "react";
import { DocsSidebar, DocCard } from "../_components/documentation/DocsComponents";

export default function DocumentationPage() {
  const [activeSection] = useState("intro");

  return (
    <main className="flex min-h-screen flex-col bg-black">
      <LandingNavbar />
      
      <div className="flex-1 flex pt-16">
        <DocsSidebar activeSection={activeSection} />

        {/* Content */}
        <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
                <div className="container max-w-4xl mx-auto px-6 py-12 space-y-20">
                    
                    {/* Intro */}
                    <section id="intro" className="space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold text-white tracking-tight">Introduction</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Mastervolt is a multi-agent orchestration framework designed for the "Autonomous Edge." It provides the architectural primitives needed to build, coordinate, and scale specialized AI swarms with shared semantic memory.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DocCard 
                                title="Why Orchestration?" 
                                text="Single agents struggle with context depth and tool complexity. Orchestration distributes load."
                                icon={Network}
                            />
                            <DocCard 
                                title="The Core Goal" 
                                text="Seamlessly bridge high-level intent with low-level execution via recursive reasoning."
                                icon={Zap}
                            />
                        </div>
                    </section>

                    {/* Installation */}
                    <section id="install" className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Installation</h2>
                        <p className="text-slate-400">Install the core package and its required peer dependencies via NPM.</p>
                        
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-sm group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 text-[10px]">SHELL // NPM</span>
                                <button className="text-[10px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">COPY_CMD</button>
                            </div>
                            <div className="text-emerald-400">
                                npm install @voltagent/core @voltagent/libsql
                            </div>
                        </div>
                    </section>

                    {/* Director */}
                    <section id="director" className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">The Director Agent</h2>
                        <p className="text-slate-400 leading-relaxed">
                            The Director is the central node of any Mastervolt swarm. It doesn't perform tasks directly; instead, it analyzes the objective, selects the appropriate sub-agents, and manages the execution flow.
                        </p>
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <ChevronRight size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Stateful Decision Making</h4>
                                <p className="text-sm text-slate-500">The Director maintains a global state map of the entire operation, allowing for self-correction if a sub-agent fails.</p>
                            </div>
                        </div>
                    </section>

                    {/* Footer spacer */}
                    <div className="h-20" />
                </div>
            </ScrollArea>
        </div>
      </div>

      <LandingFooter />
    </main>
  );
}