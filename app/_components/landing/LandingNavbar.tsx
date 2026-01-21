'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Terminal, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { MastervoltLogo } from "./assets/MastervoltLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/base/navigation-menu";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/base/sheet";

const NAV_ITEMS = [
  { label: "Platform", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Docs", href: "/documentation" },
];

import { Badge } from "@/components/ui/badge";
import { useMagnetic } from "@/hooks/use-magnetic";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function LandingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const magneticLogoRef = useMagnetic(0.2);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
    });
  }, { scope: containerRef });

  return (
    <>
      <nav ref={containerRef} className="fixed top-0 left-0 right-0 z-100 border-b border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-500">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
          
          {/* Logo Area */}
          <div ref={magneticLogoRef as any}>
            <Link href="/" className="flex items-center gap-3 group shrink-0">
               <div className="relative h-12 w-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/40 transition-all duration-500 scale-150" />
                  <MastervoltLogo className="w-10 h-10 relative z-10" color="emerald" />
               </div>
               <div className="flex flex-col">
                 <span className="font-mono text-xl font-black tracking-tighter text-white group-hover:text-emerald-400 transition-colors uppercase italic">
                   Mastervolt
                 </span>
                 <span className="text-[8px] font-mono text-emerald-500/60 font-bold tracking-[0.3em] -mt-1 uppercase">Deep_Research</span>
               </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink
                          href={item.href}
                          className={cn(
                            "relative px-5 py-2.5 text-xs font-bold font-mono uppercase tracking-widest rounded-xl transition-all duration-300",
                            isActive 
                              ? "text-white bg-white/10 border border-white/10" 
                              : "text-slate-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {item.label}
                          {isActive && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
                          )}
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
              <ThemeToggle />
              
              <Link href="https://github.com/ssdeanx/Mastervolt-Deep-Research" target="_blank" className="text-[10px] font-mono font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
                  <Terminal size={14} className="text-emerald-500" />
                  <span>GitHub</span>
              </Link>

              <div className="h-4 w-px bg-white/10" />

              <Button asChild variant="ghost" size="sm" className="text-slate-300 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-white/5">
                <Link href="/login">Log_in</Link>
              </Button>

              <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-black italic tracking-widest border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] h-10 px-6 rounded-xl transition-all hover:scale-105">
                <Link href="/signup">SIGN_UP</Link>
              </Button>
          </div>

          {/* Mobile Toggle using Sheet primitive */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2 text-slate-400 hover:text-white" aria-label="Open menu">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </SheetTrigger>

            <SheetContent side="top" className="bg-black/95 backdrop-blur-xl pt-24 px-6 md:hidden">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-bold text-white flex items-center justify-between border-b border-white/10 pb-4"
                  >
                    {item.label}
                    <ChevronRight className="text-emerald-500" />
                  </Link>
                ))}

                <div className="flex flex-col gap-4">
                  <Button asChild className="w-full bg-emerald-600 mt-2 h-12 text-lg">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full h-12 text-lg">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button className="w-full bg-emerald-600 mt-4 h-12 text-lg">Launch Console</Button>
                </div>
              </div>
              </SheetContent>
            </Sheet>
          </div>
      </nav>
    </>
  );
}
