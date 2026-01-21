import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Terminal, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MastervoltLogo } from "./assets/MastervoltLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { label: "Platform", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Docs", href: "/documentation" },
];

export function LandingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          
          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-2 group">
             <div className="relative h-10 w-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md group-hover:bg-emerald-500/40 transition-all" />
                <MastervoltLogo className="w-8 h-8" color="emerald" />
             </div>
             <span className="font-mono text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
               Mastervolt
             </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                        "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg group",
                        isActive ? "text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    {isActive && (
                        <motion.div
                            layoutId="navbar-indicator"
                            className="absolute inset-0 bg-white/5 rounded-lg border border-white/5"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                )
              })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Link href="https://github.com/ssdeanx/Mastervolt-Deep-Research" target="_blank" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                  <Terminal size={14} />
                  <span>GitHub</span>
              </Link>
               <Button variant="default" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  CONSOLE_LOGIN
               </Button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-24 px-6 md:hidden"
            >
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
                     <Button className="w-full bg-emerald-600 mt-4 h-12 text-lg">
                        Launch Console
                     </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
