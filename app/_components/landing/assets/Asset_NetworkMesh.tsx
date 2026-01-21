"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_NetworkMesh = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Use deterministic fixed nodes for SSR to avoid any randomness in server-rendered markup.
  const INITIAL_NODES = [
    { x: 38.673, y: 20.543, r: 3.297, id: 0 },
    { x: 32.171, y: 24.921, r: 3.595, id: 1 },
    { x: 51.881, y: 35.518, r: 4.368, id: 2 },
    { x: 26.408, y: 40.077, r: 3.435, id: 3 },
    { x: 37.881, y: 77.099, r: 5.021, id: 4 },
    { x: 33.879, y: 45.992, r: 3.581, id: 5 },
  ];

  const [nodes, setNodes] = useState(INITIAL_NODES);

  useEffect(() => {
    // Only randomize positions on the client after mount to keep SSR output consistent.
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: Number((n.x + (Math.random() - 0.5) * 20).toFixed(3)),
        y: Number((n.y + (Math.random() - 0.5) * 20).toFixed(3)),
        r: Number((3 + Math.random() * 3).toFixed(3)),
      }))
    );
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
