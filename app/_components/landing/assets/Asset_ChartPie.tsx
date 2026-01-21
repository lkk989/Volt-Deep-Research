"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_ChartPie = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // Rotate outer segments
      gsap.to(".pie-segment-outer", {
        rotation: 360,
        transformOrigin: "center",
        duration: 20,
        repeat: -1,
        ease: "none",
        stagger: 0.1
      });

      // Pulse inner segments
      gsap.to(".pie-segment-inner", {
        scale: 1.05,
        transformOrigin: "center",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const strokeColor = color === "emerald" ? "#10b981" : "#3b82f6";
  const fillColor = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Ring Segments */}
      <circle cx="50" cy="50" r="40" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.2" />
      
      <path className="pie-segment-outer" d="M50 10 A40 40 0 0 1 90 50" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      <path className="pie-segment-outer" d="M50 90 A40 40 0 0 1 10 50" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" transform="rotate(180 50 50)" />

      {/* Inner Pie Slices (Abstracted) */}
      <path className="pie-segment-inner" d="M50 50 L50 20 A30 30 0 0 1 80 50 Z" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="1" />
      <path className="pie-segment-inner" d="M50 50 L20 50 A30 30 0 0 1 50 20 Z" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
      <path className="pie-segment-inner" d="M50 50 L50 80 A30 30 0 0 1 20 50 Z" fill={fillColor} fillOpacity="0.1" stroke={strokeColor} strokeWidth="0.5" />
      
      {/* Center Dot */}
      <circle cx="50" cy="50" r="4" fill={fillColor} />
    </svg>
  );
});

Asset_ChartPie.displayName = "Asset_ChartPie";
