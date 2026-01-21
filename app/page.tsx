import { LandingNavbar } from "./_components/landing/LandingNavbar";
import { MissionControlHero } from "./_components/landing/MissionControlHero";
import { DomainSwitcher } from "./_components/landing/DomainSwitcher";
import { OrchestrationLayers } from "./_components/landing/OrchestrationLayers";
import { StyleNodeEditor } from "./_components/landing/StyleNodeEditor";
import { LandingFooter } from "./_components/landing/LandingFooter";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <LandingNavbar />
      
      <MissionControlHero />
      
      <DomainSwitcher />
      
      <OrchestrationLayers />
      
      <StyleNodeEditor />

      <LandingFooter />
    </main>
  );
}
