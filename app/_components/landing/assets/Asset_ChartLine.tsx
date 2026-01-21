"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_ChartLine = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
        // Animate path drawing
        const path = document.querySelector(".chart-path") as SVGPathElement;
        const length = path.getTotalLength();
        
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 2,
            repeat: -1,
            ease: "power2.inOut",
            yoyo: true
        });

        // Move head dot along path
        gsap.to(".chart-head", {
            motionPath: {
                path: ".chart-path",
                align: ".chart-path",
                alignOrigin: [0.5, 0.5]
            },
            duration: 2,
            repeat: -1,
            ease: "power2.inOut",
            yoyo: true
        });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const strokeColor = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeOpacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" opacity="0.5"/>

      {/* Path */}
      <path 
        className="chart-path"
        d="M10 80 Q 30 70, 40 50 T 70 30 T 90 20" 
        stroke={strokeColor} 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
      />

      {/* Head Dot */}
      <circle className="chart-head" r="4" fill={strokeColor} stroke="black" strokeWidth="2" />
      
      {/* Area under curve (static) */}
      <path d="M10 80 Q 30 70, 40 50 T 70 30 T 90 20 V 90 H 10 Z" fill={strokeColor} fillOpacity="0.1" />
    </svg>
  );
});

Asset_ChartLine.displayName = "Asset_ChartLine";
