"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_Shield = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
        gsap.to(".shield-segment", {
            rotation: 360,
            transformOrigin: "center",
            duration: 10,
            repeat: -1,
            ease: "none",
            stagger: 0.1
        });
        
        gsap.to(".shield-core", {
            opacity: 0.4,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const colorHex = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="shield-segment opacity-80">
        <path d="M50 10 L85 30 V60 L50 90 L15 60 V30 Z" stroke={colorHex} strokeWidth="1" />
      </g>
      <g className="shield-segment opacity-60 scale-90 origin-center">
        <path d="M50 15 L80 32 V58 L50 85 L20 58 V32 Z" stroke={colorHex} strokeWidth="1" strokeDasharray="4 4" />
      </g>
      
      <circle className="shield-core" cx="50" cy="50" r="15" fill={colorHex} fillOpacity="0.1" />
      <path d="M45 50 L50 55 L60 40" stroke={colorHex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

Asset_Shield.displayName = "Asset_Shield";
