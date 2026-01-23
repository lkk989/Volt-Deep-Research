import * as React from 'react'

/**
 * Mastervolt Custom Icons
 * Optimized for high-end professional dashboard UI.
 */

export function MastervoltLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M16 2L6 8V24L16 30L26 24V8L16 2Z"
                className="stroke-emerald-500"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 30V16L6 10"
                className="stroke-emerald-500/50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 16L26 10"
                className="stroke-emerald-500/50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 7L12 14L16 13L16 25L20 18L16 19L16 7Z"
                fill="currentColor"
                className="text-emerald-500"
            />
            <circle cx="16" cy="16" r="14" className="stroke-emerald-500/10" strokeWidth="0.5" />
        </svg>
    )
}

export function ResearchIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M21 21L16.65 16.65"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M8 11L10 13L14 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
    )
}

export function AgentIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M12 2V4M12 20V22M4 12H2M22 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="11" r="1" fill="currentColor" />
            <circle cx="14" cy="11" r="1" fill="currentColor" />
            <path d="M10 14H14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M5 8L7 10M17 14L19 16M5 16L7 14M17 10L19 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
    )
}

export function WorkflowIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 6H12C13.1046 6 14 6.89543 14 8V12C14 13.1046 14.8954 14 16 14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 12L20 14L18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
        </svg>
    )
}

export function MemoryIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M4 6H20M4 10H20M4 14H20M4 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 8H15M9 12H15M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="8" r="0.5" fill="currentColor" />
            <circle cx="18" cy="12" r="0.5" fill="currentColor" />
            <circle cx="18" cy="16" r="0.5" fill="currentColor" />
        </svg>
    )
}
