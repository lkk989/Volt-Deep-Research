"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_ChartBar = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".bar").forEach((bar: any) => {
        gsap.to(bar, {
          scaleY: "random(0.2, 1)",
          transformOrigin: "bottom",
          duration: "random(0.5, 1.5)",
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: "random(0, 0.5)"
        });
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const fillColor = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid Lines */}
      <line x1="10" y1="90" x2="90" y2="90" stroke={fillColor} strokeOpacity="0.2" strokeWidth="1" />
      <line x1="10" y1="70" x2="90" y2="70" stroke={fillColor} strokeOpacity="0.1" strokeWidth="0.5" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={fillColor} strokeOpacity="0.1" strokeWidth="0.5" />
      <line x1="10" y1="30" x2="90" y2="30" stroke={fillColor} strokeOpacity="0.1" strokeWidth="0.5" />

      {/* Bars */}
      <rect className="bar" x="20" y="30" width="10" height="60" rx="2" fill={fillColor} fillOpacity="0.8" />
      <rect className="bar" x="35" y="50" width="10" height="40" rx="2" fill={fillColor} fillOpacity="0.4" />
      <rect className="bar" x="50" y="20" width="10" height="70" rx="2" fill={fillColor} fillOpacity="0.9" />
      <rect className="bar" x="65" y="40" width="10" height="50" rx="2" fill={fillColor} fillOpacity="0.5" />
      <rect className="bar" x="80" y="60" width="10" height="30" rx="2" fill={fillColor} fillOpacity="0.3" />
    </svg>
  );
});

Asset_ChartBar.displayName = "Asset_ChartBar";
