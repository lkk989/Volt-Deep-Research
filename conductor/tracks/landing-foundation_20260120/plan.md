# Implementation Plan - Initialize Landing Page Foundation

## Phase 1: Setup & Configuration
- [x] Task: Create Directory Structure
    - [x] Create `./app/_components/landing` directory.
    - [x] Create `./app/_components/landing/ui` for landing-specific primitives.
- [x] Task: Configure Design Tokens
    - [x] Verify `global.css` for "Cyber-Phosphor" variables.
    - [x] Add missing variables if necessary (e.g., specific neon shades).

## Phase 2: Hero Component Construction
- [x] Task: Build Hero Layout
    - [x] Create `MissionControlHero.tsx` in landing components.
    - [x] Implement the basic grid/layout for the Mission Control dashboard.
    - [x] Apply "Glassmorphism" styles using Tailwind classes.
- [x] Task: Add Static UI Elements
    - [x] Add placeholder "Status Indicators" (e.g., System Online, Agents Active).
    - [x] Add "Data Stream" visual placeholders (text logs or simple graphs).

## Phase 3: GSAP Animation Integration
- [x] Task: Initialize GSAP
    - [x] Ensure `gsap` and `@gsap/react` are installed.
    - [x] Create a `useGsapContext` hook or utility if needed for cleanup.
- [x] Task: Implement "Descent" Animation
    - [x] Add `ScrollTrigger` logic to the Hero component.
    - [x] Animate opacity and Y-translation of Hero elements on scroll to simulate depth.

## Phase 4: Integration & Verification
- [x] Task: Mount Hero
    - [x] Import and render `MissionControlHero` in the main `app/page.tsx`.
- [x] Task: Manual Verification
    - [x] Verify responsiveness.
    - [x] Verify animation smoothness.
    - [x] Verify color palette accuracy.

## Phase 5: Advanced Landing Components (xyflow)
- [x] Task: Implement Domain Switcher
    - [x] Create `DomainSwitcher.tsx` with interactive xyflow graph.
    - [x] Implement Research, Trading, and Data Analysis domain sets.
- [x] Task: Implement Orchestration Layers
    - [x] Create `OrchestrationLayers.tsx` with GSAP scroll-triggered reveals.
- [x] Task: Implement Surprise Style Editor
    - [x] Create `StyleNodeEditor.tsx` allowing real-time CSS variable manipulation via node connections.
