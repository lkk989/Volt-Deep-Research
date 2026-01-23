import * as React from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/**
 * 2026 High-Performance Animated Icons
 * Features: Variable stroke weights, geometric precision, and GSAP interaction hooks.
 */

interface IconProps {
    className?: string
    animate?: boolean
}

export function MastervoltLogo({ className, animate }: IconProps) {
    const rootRef = React.useRef<SVGSVGElement>(null)

    useGSAP(() => {
        if (!animate || !rootRef.current) return
        
        const tl = gsap.timeline({ repeat: -1 })
        tl.to(rootRef.current.querySelector('.core-orb'), {
            scale: 1.2,
            opacity: 0.8,
            duration: 2,
            ease: "sine.inOut",
            yoyo: true
        })
        tl.to(rootRef.current.querySelector('.outer-shell'), {
            rotate: 90,
            duration: 10,
            ease: "none",
        }, 0)
    }, { scope: rootRef, dependencies: [animate] })

    return (
        <svg
            ref={rootRef}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M16 2L6 8V24L16 30L26 24V8L16 2Z"
                className="outer-shell stroke-emerald-500"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 10L12 16L16 15L16 22L20 16L16 17L16 10Z"
                fill="currentColor"
                className="text-emerald-500"
            />
            <circle
                cx="16"
                cy="16"
                r="4"
                className="core-orb fill-emerald-500/20"
            />
        </svg>
    )
}

export function NavOverviewIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14H21M17.5 11V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export function NavChatIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M8 9H16M8 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C10.4533 21 8.9977 20.6101 7.72676 19.9232L3 21L4.0768 16.2732C3.3899 15.0023 3 13.5467 3 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function NavResearchIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="11" cy="11" r="3" className="fill-emerald-500/20" />
            <path d="M11 8V11L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export function NavWorkflowIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="16" y="16" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5H13C14.1046 5 15 5.89543 15 7V17C15 18.1046 15.8954 19 17 19H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    )
}

export function NavReportsIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M7 18H17M7 14H17M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V8.41421C19 7.88378 18.7893 7.37507 18.4142 7L15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H7C5.89543 3 5 3.89543 5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function NavAgentsIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 2V4M12 20V22M4 12H2M22 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 11H9.01M15 11H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export function NavMemoryIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 4V20M15 4V20M4 9H20M4 15H20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    )
}

export function NavObservabilityIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function NavLogsIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M4 6H20M4 10H20M4 14H14M4 18H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 14L21 17L18 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function NavSettingsIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    )
}
