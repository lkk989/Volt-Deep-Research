"use client";

import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useRef } from "react";
import { Badge } from "@/components/ui/badge";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MILESTONES = [
  {
    year: "2024",
    title: "The Genesis",
    description: "Mastervolt was born as a specialized tool for deep research in energy markets, leveraging the first VoltAgent prototypes.",
    color: "emerald"
  },
  {
    year: "2025",
    title: "Swarm Intelligence",
    description: "Released the Director-Swarm architecture, enabling multi-agent coordination across disparate data sources.",
    color: "blue"
  },
  {
    year: "2026",
    title: "Global Orchestration",
    description: "Today, Mastervolt scales across research, trading, and engineering, powering the next generation of autonomous apps.",
    color: "emerald"
  }
];

export function AboutTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    const items = gsap.utils.toArray<HTMLElement>(".timeline-item");

    items.forEach((item: HTMLElement) => {
      gsap.from(item, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative space-y-24">
      {/* Central Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-white/10 to-transparent hidden md:block" />

      {MILESTONES.map((m, i) => (
        <div key={m.year} className={cn(
          "timeline-item flex flex-col md:flex-row items-center gap-8 md:gap-0",
          i % 2 !== 0 && "md:flex-row-reverse"
        )}>
          {/* Content */}
          <div className="flex-1 text-center md:text-left md:px-12">
            <Badge variant="ghost" className={cn("px-4 py-1 text-xs font-mono mb-4", m.color === "emerald" ? "text-emerald-400" : "text-blue-400")}>{m.year}</Badge>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">{m.title}</h3>
            <p className="text-slate-400 leading-relaxed max-w-md mx-auto md:mx-0">
              {m.description}
            </p>
          </div>

          {/* Dot */}
          <div className="relative z-10 w-12 h-12 flex items-center justify-center">
            <div className={cn(
              "h-4 w-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]",
              m.color === "emerald" ? "bg-emerald-500" : "bg-blue-500"
            )} />
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden md:block" />
        </div>
      ))}
    </div>
  );
}
