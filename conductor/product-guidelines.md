# Product Guidelines: Mastervolt Landing Page

## 1. Brand Voice & Tone
- **Technical Authority:** Use precise language that reflects engineering excellence. Avoid fluff; focus on architecture, performance, and orchestration logic.
- **Visionary Outlook:** Balance technicality with an inspiring look at the future of agentic workflows. Mastervolt isn't just a tool; it's the engine for the next generation of AI applications.

## 2. Visual Identity
- **Color Palette (Cyber-Phosphor):** 
  - Primary Background: Pure Black (`#000000`).
  - Primary Accent: Neon Emerald/Volt Green (`#10b981` / `--emerald-500`).
  - Secondary Accents: Muted Slate/Gray for borders and secondary text.
- **Typography:** Use the existing Geist Sans and Mono fonts. Emphasize Mono for technical data and Geist Sans for headings.

## 3. Design Principles
- **Glassmorphism:** All "Mission Control" panels should use semi-transparent backgrounds with subtle blurs and thin, high-contrast borders (`border-white/10` or `border-emerald-500/20`).
- **Reactive Interaction (GSAP):** Animations must feel "alive." Use persistent parallax on mouse move and scroll-triggered transformations to make the UI feel reactive to the user's presence.
- **Modular Composition:** Build large, section-based components (`Hero`, `FeatureSection`, `NodeGraph`) in `./app/_components/landing` that compose existing `shadcn/ui` primitives without modifying the core primitives themselves.

## 4. Animation Standards (GSAP)
- **Fluidity:** Avoid jerky transitions. All scroll-based animations should use GSAP's `ScrollTrigger` with `scrub` values to ensure they sync perfectly with the user's scroll speed.
- **Micro-interactions:** Buttons and interactive cards should have subtle GSAP-powered hover states (e.g., slight glow increases or terminal-style text flickering).
