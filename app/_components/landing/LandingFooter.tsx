"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { MastervoltLogo } from "./assets/MastervoltLogo";

export function LandingFooter() {
  return (
    <footer className="bg-black border-t border-white/5 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 relative flex items-center justify-center">
                  <MastervoltLogo className="w-8 h-8" color="emerald" />
               </div>
               <span className="font-mono text-xl font-bold tracking-tight text-white">
                 Mastervolt
               </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              The enterprise-grade multi-agent orchestration engine. 
              Designed for deep research, autonomous trading, and complex data synthesis.
            </p>
            <div className="flex gap-4">
              <SocialLink href="#" icon={Github} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Linkedin} />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-white tracking-wide">PLATFORM</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Agents</Link></li>
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Workflows</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
              <li><Link href="/docs" className="hover:text-emerald-400 transition-colors">API Reference</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white tracking-wide">COMPANY</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-600 font-mono">
            © 2026 MASTERVOLT LABS. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-8 text-xs font-mono text-slate-600 uppercase tracking-widest">
             <Link href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon }: { href: string, icon: any }) {
  return (
    <Link href={href} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300">
      <Icon size={18} />
    </Link>
  );
}
