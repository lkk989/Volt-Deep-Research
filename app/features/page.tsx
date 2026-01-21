import { LandingNavbar } from "../_components/landing/LandingNavbar";
import { LandingFooter } from "../_components/landing/LandingFooter";
import { BentoGridFeatures } from "../_components/features/BentoGridFeatures";

import { Badge } from "@/components/ui/badge";

export default function FeaturesPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />
      
      {/* Header */}
      <section className="pt-40 pb-20 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl space-y-8">
            <Badge variant="ghost" className="px-3 py-1 text-emerald-400 text-xs font-mono border-emerald-500/20 bg-emerald-500/5">
                CORE_CAPABILITIES // PLATFORM_V2
            </Badge>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-foreground">
                Engineering <br />
                <span className="text-emerald-500">Autonomous Edge.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                A modular orchestration engine designed for high-stakes intelligence gathering and dynamic multi-agent collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24">
        <BentoGridFeatures />
      </section>

      {/* Technical Detail Section */}
      <section className="py-32 bg-white/5 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Dynamic Swarm <br/> Re-Configuration.</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Unlike static agent pipelines, Mastervolt utilizes a real-time topology engine. The Director evaluates incoming data streams and re-wires the agent network on-the-fly to optimize for accuracy, speed, or cost-efficiency.
                </p>
                <div className="space-y-6">
                    {["Low-latency state synchronization", "Cross-agent recursive reasoning", "Self-healing tool execution"].map(item => (
                        <div key={item} className="flex items-center gap-4 text-slate-300">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-lg font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="aspect-square rounded-3xl bg-black border border-white/10 p-12 relative overflow-hidden flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl opacity-50" />
                <div className="text-emerald-500/20 font-mono text-[8px] absolute inset-6 overflow-hidden leading-none break-all select-none opacity-40">
                    {"0".repeat(2000)}
                </div>
                <div className="relative z-10 text-center space-y-6">
                    <div className="text-6xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">0.42ms</div>
                    <Badge variant="ghost" className="text-emerald-500 font-mono uppercase tracking-[0.3em] bg-emerald-500/5">Topology_Sync_Latency</Badge>
                </div>
            </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
