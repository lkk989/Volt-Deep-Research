"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const MastervoltLogo = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // Pulse animation
      gsap.to(".logo-pulse", {
        opacity: 0.8,
        scale: 1.1,
        transformOrigin: "center",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Circuit path dash animation
      gsap.to(".logo-circuit", {
        strokeDashoffset: -20,
        duration: 3,
        repeat: -1,
        ease: "linear"
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const primaryColor = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon Container */}
      <path 
        d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z" 
        stroke={primaryColor} 
        strokeWidth="2" 
        fill="none" 
        className="opacity-50"
      />
      
      {/* Inner Hexagon with Fill */}
      <path 
        d="M50 15 L80 30 V70 L50 85 L20 70 V30 Z" 
        fill={primaryColor} 
        fillOpacity="0.1" 
        stroke="none"
      />

      {/* Volt/Pulse Mark */}
      <path 
        className="logo-pulse"
        d="M45 35 L55 35 L40 65 L65 50 L55 50 L70 20 Z" 
        fill={primaryColor}
        stroke="black"
        strokeWidth="1"
      />

      {/* Circuit Nodes */}
      <circle cx="10" cy="25" r="2" fill={primaryColor} className="opacity-80" />
      <circle cx="90" cy="75" r="2" fill={primaryColor} className="opacity-80" />
      <circle cx="50" cy="95" r="2" fill={primaryColor} className="opacity-80" />

      {/* Circuit Lines */}
      <path 
        className="logo-circuit"
        d="M10 25 L30 35 M90 75 L70 65 M50 95 L50 75" 
        stroke={primaryColor} 
        strokeWidth="1" 
        strokeDasharray="4 2"
        strokeOpacity="0.5"
      />
    </svg>
  );
});

MastervoltLogo.displayName = "MastervoltLogo";
