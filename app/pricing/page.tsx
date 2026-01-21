import { LandingNavbar } from "../_components/landing/LandingNavbar";
import { LandingFooter } from "../_components/landing/LandingFooter";
import { PricingCommandCenter } from "../_components/pricing/PricingCommandCenter";

export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <LandingNavbar />
      
      {/* Header */}
      <section className="pt-32 pb-24 text-center">
        <div className="container mx-auto px-4 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Scale Your <br />
                <span className="text-emerald-500">Agent Swarm.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-xl mx-auto">
                Simple, transparent pricing for teams building the future of autonomous intelligence. No hidden tokens, just performance.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
            <PricingCommandCenter />
        </div>
      </section>

      {/* FAQ / Trust */}
      <section className="py-24 border-t border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl font-bold text-white">Security & Reliability.</h2>
                <p className="text-slate-500">Enterprise standards are at our core.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { title: "SOC2 Type II", desc: "Rigorous security controls and auditing." },
                    { title: "Data Isolation", desc: "Each organization gets dedicated memory environments." },
                    { title: "SLA Guaranteed", desc: "99.99% uptime for orchestration critical paths." }
                ].map(item => (
                    <div key={item.title} className="space-y-3">
                        <h4 className="font-bold text-emerald-400">{item.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
