"use client";

import React, { useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_NetworkMesh = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Generate random nodes deterministically
  const nodes = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      r: 3 + Math.random() * 3,
      id: i
    }));
  }, []);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // Drift nodes
      gsap.utils.toArray(".mesh-node").forEach((node: any) => {
        gsap.to(node, {
          x: "random(-10, 10)",
          y: "random(-10, 10)",
          duration: "random(2, 4)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // Pulse connections
      gsap.to(".mesh-link", {
        strokeOpacity: 0.8,
        duration: 1,
        stagger: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
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
      {/* Links (simplified: connecting first 3 to others) */}
      <g className="opacity-30">
        {nodes.slice(0, 3).map((n1, i) => 
            nodes.slice(3).map((n2, j) => (
                <line 
                    key={`${i}-${j}`}
                    className="mesh-link"
                    x1={n1.x} y1={n1.y} 
                    x2={n2.x} y2={n2.y} 
                    stroke={colorHex} 
                    strokeWidth="0.5" 
                    strokeOpacity="0.2"
                />
            ))
        )}
      </g>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <circle
          key={i}
          className="mesh-node"
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={colorHex}
          fillOpacity="0.8"
        />
      ))}
    </svg>
  );
});

Asset_NetworkMesh.displayName = "Asset_NetworkMesh";
