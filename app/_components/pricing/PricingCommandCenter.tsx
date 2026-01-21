"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Terminal, Zap, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Standard",
    id: "standard",
    price: "$0",
    description: "For individual researchers and experimenters.",
    icon: Zap,
    features: [
      "Up to 5 concurrent agents",
      "Standard LLM access (Gemini Flash)",
      "Shared vector memory",
      "100 tasks / month",
      "Community support"
    ],
    color: "slate",
    cta: "INITIATE_FREE"
  },
  {
    name: "Pro Swarm",
    id: "pro",
    price: "$49",
    description: "For professional analysts and trading enthusiasts.",
    icon: Shield,
    features: [
      "Up to 25 concurrent agents",
      "Priority LLM access (Gemini Pro)",
      "Dedicated semantic memory",
      "Unlimited tasks",
      "Custom tool integration",
      "Priority support"
    ],
    color: "emerald",
    recommended: true,
    cta: "UPGRADE_TO_PRO"
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: "Custom",
    description: "Full-scale orchestration for high-stakes domains.",
    icon: Crown,
    features: [
      "Unlimited agent swarms",
      "Multi-model routing (Gemini + OpenAI)",
      "On-prem LibSQL persistence",
      "White-labeled console",
      "24/7 Mission Control Support",
      "Custom A2A protocols"
    ],
    color: "blue",
    cta: "CONTACT_OPERATIONS"
  }
];

export function PricingCommandCenter() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="space-y-16">
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex gap-1">
          {["monthly", "yearly"].map((cycle) => (
            <Button
              key={cycle}
              size="sm"
              variant={billingCycle === cycle ? "default" : "ghost"}
              onClick={() => setBillingCycle(cycle as any)}
              aria-pressed={billingCycle === cycle}
              className={cn("px-6 py-2 rounded-lg text-xs font-mono transition-all duration-300", billingCycle === cycle ? "shadow-lg" : "")}
            >
              {cycle.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
                <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={cn(
                        "relative flex flex-col p-8 rounded-3xl border transition-all duration-500",
                        plan.recommended 
                            ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] z-10" 
                            : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                >
                    {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold font-mono tracking-widest uppercase">
                            Recommended
                        </div>
                    )}

                    <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                plan.color === "emerald" ? "bg-emerald-500/20 text-emerald-400" : 
                                plan.color === "blue" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white"
                            )}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{plan.id}_v2.0</p>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            {plan.price !== "Custom" && <span className="text-slate-500 text-sm">/month</span>}
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>

                        <div className="space-y-3 pt-4">
                            {plan.features.map(feature => (
                                <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12">
                        <Button 
                            className={cn(
                                "w-full h-12 font-mono text-xs font-bold tracking-widest transition-all",
                                plan.recommended 
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            )}
                        >
                            {plan.cta}
                        </Button>
                    </div>
                </motion.div>
            )
        })}
      </div>

      {/* Terminal Footer */}
      <div className="p-6 rounded-2xl border border-white/5 bg-black/50 backdrop-blur-sm space-y-3 font-mono">
        <div className="flex items-center gap-2 text-xs text-emerald-500">
            <Terminal size={14} />
            <span>SHELL_OUTPUT: QUOTA_ESTIMATOR</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-relaxed">
            [INFO] All plans include standard encryption and SOC2 compliance. Yearly billing includes 2 months free. <br/>
            [WARN] Enterprise custom protocols require 48h lead time for orchestration setup.
        </div>
      </div>
    </div>
  );
}
