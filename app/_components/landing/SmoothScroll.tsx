"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Production-grade Smooth Scroll implementation using Lenis and GSAP ScrollTrigger.
 * Synchronizes the two for cohesive animation performance.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Register ScrollTrigger within the useGSAP context for auto-cleanup
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis with production-grade settings
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.1,
      lerp: 0.1, // Smooth interpolation
    });

    // Manually handle the Lenis scroll event to update ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Integrate Lenis with GSAP's ticker for highest precision
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0); // Essential for sync

    // Animate the progress bar
    gsap.to("#scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        scrub: 0.3,
        start: "top top",
        end: "bottom bottom",
      },
    });

    return () => {
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      {/* Scroll Progress Indicator - v4 simplified styling */}
      <div 
        id="scroll-progress"
        className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left bg-emerald-500 scale-x-0 will-change-transform" 
      />
      {children}
    </div>
  );
}
