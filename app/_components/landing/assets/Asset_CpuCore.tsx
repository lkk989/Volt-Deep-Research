"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_CpuCore = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // Rotate outer ring
      gsap.to(".ring-outer", {
        rotation: 360,
        transformOrigin: "center",
        duration: 20,
        repeat: -1,
        ease: "none",
      });

      // Rotate inner ring (counter)
      gsap.to(".ring-inner", {
        rotation: -360,
        transformOrigin: "center",
        duration: 15,
        repeat: -1,
        ease: "none",
      });

      // Pulse core
      gsap.to(".core-pulse", {
        scale: 1.1,
        opacity: 0.8,
        transformOrigin: "center",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
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
      {/* Outer Ring */}
      <g className="ring-outer opacity-50">
        <circle cx="50" cy="50" r="45" stroke={strokeColor} strokeWidth="1" strokeDasharray="10 5" />
        <circle cx="50" cy="50" r="48" stroke={strokeColor} strokeWidth="0.5" strokeOpacity="0.3" />
        <path d="M50 2 A48 48 0 0 1 98 50" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M50 98 A48 48 0 0 1 2 50" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Inner Ring */}
      <g className="ring-inner opacity-70">
        <circle cx="50" cy="50" r="30" stroke={strokeColor} strokeWidth="2" strokeDasharray="20 10" />
        <rect x="48" y="10" width="4" height="10" fill={fillColor} />
        <rect x="48" y="80" width="4" height="10" fill={fillColor} />
        <rect x="10" y="48" width="10" height="4" fill={fillColor} />
        <rect x="80" y="48" width="10" height="4" fill={fillColor} />
      </g>

      {/* Core */}
      <g className="core-pulse">
        <circle cx="50" cy="50" r="15" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="2" />
        <circle cx="50" cy="50" r="8" fill={fillColor} />
      </g>
    </svg>
  );
});

Asset_CpuCore.displayName = "Asset_CpuCore";
