'use client'

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
}

export function ArtifactPanel({
    isOpen,
    onClose,
    title = 'Artifact',
    description,
    content = '',
    language = 'typescript',
    type = 'code',
}: ArtifactPanelProps) {
    if (!isOpen) return null

    return (
        <div className="h-full w-[400px] border-l bg-background transition-all duration-300 ease-in-out">
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
                        <ArtifactActions>
                            <ArtifactAction
                                tooltip="Copy content"
                                icon={CopyIcon}
                                onClick={() =>
                                    navigator.clipboard.writeText(content)
                                }
                            />
                            <ArtifactAction
                                tooltip="Download"
                                icon={DownloadIcon}
                            />
                            <ArtifactAction
                                tooltip="Regenerate"
                                icon={RefreshCwIcon}
                            />
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
