# Active Context: Mastervolt Deep Research

## Current Focus

**Landing Page Overhaul & UI/UX Optimization** - Developing a high-performance, interactive landing page demonstrating agent orchestration and research capabilities.

## Recent Changes

### 2026-01-21

- **Landing Page Overhaul**: Significant update to hero, feature, and showcase components.
- **Scroll Sync**: Integrated Lenis smooth scrolling with GSAP ScrollTrigger for production-grade animations.
- **Interactive UI**: Added `use-magnetic.ts` hook for interactive cursor behaviors.
- **Component Refinement**: Production-grade implementations of `MissionControlHero`, `DomainSwitcher`, `OrchestrationLayers`, and `StyleNodeEditor`.
- **Infrastructure**: Standardized on Tailwind v4 patterns and `@gsap/react` for complex orchestrations.

### 2025-11-27

- Initialized Memory Bank structure with core files
- Synced `copilot-rules.md` with project security policies
- Created `projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`

## Active Decisions

### 1. Frontend Animation Stack

- **GSAP + @gsap/react**: Primary engine for complex, high-performance UI animations.
- **Lenis**: Used for smooth scrolling, synchronized with GSAP ScrollTrigger via the global ticker.
- **Tailwind v4**: Utilizing the latest CSS-first approach for styling and utility management.

### 2. UI Primitive Strategy

- **Interactive Hooks**: Custom hooks like `use-magnetic` for consistent interactive polish.
- **Node-based Visualization**: Using `@xyflow/react` for visualizing agent orchestration and data flows.

### 3. Memory Bank Structure

- Using `/memory-bank/` folder for global context
- Feature-specific context goes in `/memory-bank/<feature>/`
- Following Kiro-Lite workflow: PRD → Design → Tasks → Code

### 4. Agent Configuration

- Director agent supervises all sub-agents
- Each agent has specialized tools and memory
- Using Gemini 2.5 Flash as primary model

## Next Steps

1. [ ] Verify all agents are properly configured
2. [ ] Test workflow execution end-to-end
3. [ ] Add evaluation experiments
4. [ ] Document API endpoints

## Current Blockers

*None at this time

## Open Questions

1. Should we add more MCP server integrations?
2. What additional toolkits would improve research quality?
3. How should we handle long-running research tasks?

## Session Notes

- Memory Bank is now active and synchronized with codebase
- All core files created and ready for use
- Ready for `/start feature <name>` commands

---

*Last Updated: 2026-01-21
