import { LandingNavbar } from "../_components/landing/LandingNavbar";
import { LandingFooter } from "../_components/landing/LandingFooter";
import { BentoGridFeatures } from "../_components/features/BentoGridFeatures";

export default function FeaturesPage() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <LandingNavbar />
      
      {/* Header */}
      <section className="pt-32 pb-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-mono">
                CORE_CAPABILITIES // PLATFORM_V2
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Engineering <br />
                <span className="text-emerald-500">Autonomous Edge.</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
                A modular orchestration engine designed for high-stakes intelligence gathering and dynamic multi-agent collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
            <BentoGridFeatures />
        </div>
      </section>

      {/* Technical Detail Section */}
      <section className="py-24 bg-white/5 border-y border-white/5">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Dynamic Swarm <br/> Re-Configuration.</h2>
                <p className="text-slate-400 leading-relaxed">
                    Unlike static agent pipelines, Mastervolt utilizes a real-time topology engine. The Director evaluates incoming data streams and re-wires the agent network on-the-fly to optimize for accuracy, speed, or cost-efficiency.
                </p>
                <div className="space-y-4">
                    {["Low-latency state synchronization", "Cross-agent recursive reasoning", "Self-healing tool execution"].map(item => (
                        <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
            <div className="aspect-square rounded-3xl bg-black border border-white/10 p-8 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl" />
                <div className="text-emerald-500/20 font-mono text-[8px] absolute inset-4 overflow-hidden leading-none break-all select-none">
                    {Array.from({ length: 2000 }).map(() => Math.random() > 0.5 ? "1" : "0").join("")}
                </div>
                <div className="relative z-10 text-center space-y-4">
                    <div className="text-4xl font-mono font-bold text-white tracking-tighter">0.42ms</div>
                    <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Topology_Sync_Latency</div>
                </div>
            </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
