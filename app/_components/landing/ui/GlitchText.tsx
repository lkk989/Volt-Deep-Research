"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function GlitchText({ children, className }: { children: string; className?: string }) {
  const [glitchText, setGlitchText] = useState(children);
  const chars = "!@#$%^&*()_+{}:<>?|1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const triggerGlitch = () => {
    let iterations = 0;
    const interval = setInterval(() => {
      setGlitchText((prev) =>
        prev
          .split("")
          .map((char, index) => {
            if (index < iterations) {
              return children[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iterations >= children.length) {
        clearInterval(interval);
      }

      iterations += 1 / 3;
    }, 30);
  };

  return (
    <span 
      className={cn("font-mono", className)}
      onMouseEnter={triggerGlitch}
    >
      {glitchText}
    </span>
  );
}
