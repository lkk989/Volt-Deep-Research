"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { MastervoltLogo } from "./assets/MastervoltLogo";

export function LandingFooter() {
  return (
    <footer className="bg-black border-t border-white/5 py-24 md:py-48 relative overflow-hidden">
      {/* Footer background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-linear-to-t from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-12">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
                  <MastervoltLogo className="w-10 h-10 relative z-10" color="emerald" />
               </div>
               <div className="flex flex-col">
                 <span className="font-mono text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                   Mastervolt
                 </span>
                 <span className="text-[10px] font-mono text-emerald-500 font-bold tracking-[0.4em] uppercase">Deep_Research_Labs</span>
               </div>
            </div>
            <p className="text-muted-foreground text-xl max-w-md leading-relaxed font-medium">
              The enterprise-grade multi-agent orchestration engine. 
              Designed for deep research, autonomous trading, and complex data synthesis.
            </p>
            <div className="flex gap-6">
              <SocialLink href="#" icon={Github} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Linkedin} />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-8">
            <h4 className="font-black text-foreground tracking-[0.3em] text-[10px] uppercase border-b border-white/10 pb-4 inline-block">PLATFORM</h4>
            <ul className="space-y-5 text-sm font-mono font-bold text-slate-500">
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> AGENTS</Link></li>
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> WORKFLOWS</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> PRICING</Link></li>
              <li><Link href="/docs" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> DOCUMENTATION</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="font-black text-foreground tracking-[0.3em] text-[10px] uppercase border-b border-white/10 pb-4 inline-block">COMPANY</h4>
            <ul className="space-y-5 text-sm font-mono font-bold text-slate-500">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> ABOUT_US</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> UPDATES_LOG</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> OPEN_ROLES</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 bg-emerald-500 hidden group-hover:block rounded-full" /> CONTACT_SECURE</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
            © 2026 MASTERVOLT LABS <span className="text-emerald-500/50 mx-2">//</span> SECURED BY <span className="text-emerald-500">VOLTAGENT_CORE</span>
          </div>
          <div className="flex gap-12 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em]">
             <Link href="#" className="hover:text-emerald-500 transition-all">Privacy_Policy</Link>
             <Link href="#" className="hover:text-emerald-500 transition-all">Terms_of_Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


import { Button } from "@/components/ui/button";

function SocialLink({ href, icon: Icon }: { href: string, icon: any }) {
  return (
    <Button asChild variant="ghost" size="icon">
      <Link href={href} className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300" aria-label="Social link">
        <Icon size={18} />
      </Link>
    </Button>
  );
}
