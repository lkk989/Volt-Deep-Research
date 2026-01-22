'use client'

import React, { useState } from 'react'
import {
    Artifact,
    ArtifactAction,
    ArtifactActions,
    ArtifactClose,
    ArtifactContent,
    ArtifactDescription,
    ArtifactHeader,
    ArtifactTitle,
} from '@/components/ai-elements/artifact'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { Button } from '@/components/ui/button'
import { CopyIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react'

interface ArtifactPanelProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    content?: string
    language?: string
    type?: 'code' | 'markdown' | 'text'
    onUse?: () => void
    onDownload?: (fileName?: string) => void
    onRegenerate?: () => void
}

function getExtension(language: string | undefined, type: string) {
    if (type === 'markdown') return 'md'
    const map: Record<string, string> = {
        typescript: 'ts',
        javascript: 'js',
        python: 'py',
        go: 'go',
        java: 'java',
        html: 'html',
        css: 'css',
        json: 'json',
    }
    if (!language) return 'txt'
    const key = language.toLowerCase()
    return map[key] ?? key.split(/[\s/+-]/)[0] ?? 'txt'
}

export function ArtifactPanel({
    isOpen,
    onClose,
    title = 'Artifact',
    description,
    content = '',
    language = 'typescript',
    type = 'code',
    onUse,
    onDownload,
    onRegenerate,
}: ArtifactPanelProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (e) {
            console.error('Copy failed', e)
        }
    }

    const handleDownload = () => {
        if (onDownload) return onDownload(`${title}.${getExtension(language, type)}`)

        const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const ext = getExtension(language, type)
        a.href = url
        a.download = `${title || 'artifact'}.${ext}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const handleRegenerate = () => {
        if (onRegenerate) return onRegenerate()
        console.warn('Regenerate action not provided')
    }

    const handleUse = async () => {
        if (onUse) return onUse()
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
            onClose()
        } catch (e) {
            console.error('Use (copy) failed', e)
        }
    }

    return (
        <div className="h-full w-100 border-l bg-background transition-all duration-300 ease-in-out">
            <Artifact className="h-full border-0 rounded-none shadow-none">
                <ArtifactHeader>
                    <div className="flex flex-col gap-1">
                        <ArtifactTitle>{title}</ArtifactTitle>
                        {description && (
                            <ArtifactDescription>
                                {description}
                            </ArtifactDescription>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={handleUse} className="mr-1">
                            Use
                        </Button>
                        <ArtifactActions>
                            <ArtifactAction
                                tooltip={copied ? 'Copied!' : 'Copy content'}
                                icon={CopyIcon}
                                onClick={handleCopy}
                            />
                            <ArtifactAction tooltip="Download" icon={DownloadIcon} onClick={handleDownload} />
                            <ArtifactAction tooltip="Regenerate" icon={RefreshCwIcon} onClick={handleRegenerate} />
                        </ArtifactActions>
                        <ArtifactClose onClick={onClose} />
                    </div>
                </ArtifactHeader>
                <ArtifactContent className="p-0">
                    {type === 'code' ? (
                        <div className="h-full overflow-auto p-4">
                            <CodeBlock
                                code={content}
                                language={language as any}
                                showLineNumbers
                                className="min-h-full border-0"
                            />
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none p-4">
                            {/* Placeholder for Markdown rendering if needed, or just text */}
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                                {content}
                            </pre>
                        </div>
                    )}
                </ArtifactContent>
            </Artifact>
        </div>
    )
}
