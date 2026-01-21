import { LandingNavbar } from "../_components/landing/LandingNavbar";
import { LandingFooter } from "../_components/landing/LandingFooter";
import { AboutTimeline } from "../_components/about/AboutTimeline";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <LandingNavbar />
      
      {/* Hero */}
      <section className="pt-32 pb-24 border-b border-white/5">
        <div className="container mx-auto px-4 text-center space-y-8">
            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter">
                Our <span className="text-emerald-500 italic">Manifesto.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                We believe in a future where intelligence is modular, autonomous, and accessible. Mastervolt is the architecture for that future.
            </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
                { title: "Modularity First", desc: "Agents should be swappable, composable, and specialized." },
                { title: "Semantic Persistence", desc: "AI is only as good as the context it remembers." },
                { title: "Human Oversight", desc: "The Director orchestrates, but humans define the mission." }
            ].map(v => (
                <div key={v.title} className="p-8 rounded-3xl border border-white/5 bg-white/5 space-y-4">
                    <h3 className="text-2xl font-bold text-emerald-400">{v.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-32 bg-white/[0.01]">
        <div className="container mx-auto px-4">
            <div className="text-center mb-32 space-y-4">
                <h2 className="text-4xl font-bold text-white">The Journey.</h2>
                <p className="text-slate-500">From a single script to a global engine.</p>
            </div>
            <AboutTimeline />
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container mx-auto px-4 text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-4xl md:text-6xl font-bold text-white">Join the Mission.</h2>
                <p className="text-slate-400">We are always looking for researchers, engineers, and visionaries to help us push the boundaries of agentic orchestration.</p>
            </div>
            <button className="px-12 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                CONTACT_COMMAND
            </button>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
