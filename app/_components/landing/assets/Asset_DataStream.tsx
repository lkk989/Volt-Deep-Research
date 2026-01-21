"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AssetProps {
  className?: string;
  color?: "emerald" | "blue";
}

export const Asset_DataStream = React.memo(({ className, color = "emerald" }: AssetProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // Falling bits
      gsap.utils.toArray(".data-bit").forEach((bit: any, i) => {
        gsap.to(bit, {
          y: 100,
          duration: gsap.utils.random(1, 3),
          repeat: -1,
          ease: "none",
          delay: gsap.utils.random(0, 2),
          onRepeat: () => {
             gsap.set(bit, { y: -10, opacity: gsap.utils.random(0.3, 1) });
          }
        });
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  const colorHex = color === "emerald" ? "#10b981" : "#3b82f6";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn("w-full h-full overflow-hidden", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
        {/* Grid Background */}
        <defs>
            <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={colorHex} strokeWidth="0.5" strokeOpacity="0.1"/>
            </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#smallGrid)" />

        {/* Data Bits */}
        {Array.from({ length: 12 }).map((_, i) => (
            <text
                key={i}
                className="data-bit font-mono text-[8px]"
                x={10 + i * 8}
                y={-10}
                fill={colorHex}
                opacity="0"
            >
                {Math.random() > 0.5 ? "1" : "0"}
            </text>
        ))}
         {Array.from({ length: 8 }).map((_, i) => (
            <rect
                key={`rect-${i}`}
                className="data-bit"
                x={15 + i * 10}
                y={-10}
                width="2"
                height="6"
                fill={colorHex}
                opacity="0"
            />
        ))}
    </svg>
  );
});

Asset_DataStream.displayName = "Asset_DataStream";
