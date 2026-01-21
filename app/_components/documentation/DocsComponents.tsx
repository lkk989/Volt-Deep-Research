"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Terminal, Code2, BookOpen, ChevronRight, Search, Zap, Network } from "lucide-react";
import Link from "next/link";

const DOCS_NAV = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "Introduction", href: "#intro" },
      { title: "Installation", href: "#install" },
      { title: "Quick Start Swarm", href: "#quickstart" },
    ]
  },
  {
    title: "Core Concepts",
    icon: Terminal,
    items: [
      { title: "The Director", href: "#director" },
      { title: "Specialized Agents", href: "#agents" },
      { title: "Semantic Memory", href: "#memory" },
      { title: "A2A Protocols", href: "#a2a" },
    ]
  },
  {
    title: "API Reference",
    icon: Code2,
    items: [
      { title: "Agent Config", href: "#api-agent" },
      { title: "Workflow SDK", href: "#api-workflow" },
      { title: "Toolkit Schema", href: "#api-toolkit" },
    ]
  }
];

export function DocsSidebar({ activeSection }: { activeSection: string }) {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                    type="text" 
                    placeholder="Search docs..." 
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                />
            </div>
        </div>
        
        <ScrollArea className="flex-1 px-2 pb-8">
            <div className="space-y-6 pt-2">
                {DOCS_NAV.map(group => {
                    const Icon = group.icon;
                    return (
                        <div key={group.title} className="space-y-3 px-2">
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                <Icon size={12} />
                                {group.title}
                            </div>
                            <div className="space-y-1 border-l border-white/5 ml-1.5">
                                {group.items.map(item => (
                                    <Link 
                                        key={item.href} 
                                        href={item.href}
                                        className={cn(
                                            "block py-2 pl-4 text-xs transition-all border-l -ml-px",
                                            activeSection === item.href.slice(1) 
                                                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" 
                                                : "border-transparent text-slate-400 hover:text-white hover:border-white/20"
                                        )}
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    </aside>
  );
}

export function DocCard({ title, text, icon: Icon }: any) {
    return (
        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 space-y-3 hover:border-white/20 transition-all group">
            <div className="text-emerald-500 group-hover:scale-110 transition-transform"><Icon size={20} /></div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
        </div>
    )
}
