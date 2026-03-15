'use client'

import { useChat } from '@ai-sdk/react'
import {
	DefaultChatTransport,
	generateId,
	safeValidateUIMessages,
	type UIMessage,
} from 'ai'
import { ChatPanel } from '../../_components/chat-panel'
import { ChatHeader } from '../../_components/chat-header'
import { ChatInput } from '../../_components/chat-input'
import { ChatMessages } from '../../_components/chat-messages'
import { ChatAdvancedOptions } from '../../_components/chat-advanced-options'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
	useVoltAgent,
	useVoltConversationMessages,
} from '@/hooks/use-voltagent'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { Spinner } from '@/components/ui/spinner'
import {
	getVoltAgentChatEndpoint,
	getVoltAgentChatResumeEndpoint,
} from '@/lib/voltagent-client'
import {
	buildChatRequestOptions,
	countActiveAdvancedChatOptions,
	DEFAULT_ADVANCED_CHAT_OPTIONS,
	type AdvancedChatOptions,
} from '../../_components/chat-options'

export default function AgentChatPage() {
	const router = useRouter()
	const params = useParams<{ agentId: string }>()
	const activeAgentId = decodeURIComponent(params.agentId)
	const [chatId, setChatId] = useState(() => generateId())
	const [selectedModel, setSelectedModel] = useState('')
	const [showWebPreview, setShowWebPreview] = useState(false)
	const [knownModels, setKnownModels] = useState<string[]>([])
	const [advancedOptions, setAdvancedOptions] =
		useState<AdvancedChatOptions>(DEFAULT_ADVANCED_CHAT_OPTIONS)
	const userId = 'user-1'
	const activeOptionCount = useMemo(
		() => countActiveAdvancedChatOptions(advancedOptions),
		[advancedOptions]
	)

	const { data: activeAgent } = useVoltAgent(activeAgentId)
	const { data: conversationMessages = [], isLoading: isMessagesLoading } =
		useVoltConversationMessages(chatId, userId, activeAgentId)

	const handleNewChat = useCallback(() => {
		setChatId(generateId())
	}, [])

	const handleDeleteChat = useCallback(() => {
		console.log('Delete conversation:', chatId)
	}, [chatId])

	const handleAgentChange = useCallback(
		(nextAgentId: string) => {
			setSelectedModel('')
			setChatId(generateId())
			router.push(`/dashboard/chat/${encodeURIComponent(nextAgentId)}`)
		},
		[router]
	)

	const allMessages = useMemo(
		() => conversationMessages,
		[conversationMessages]
	)

	const { messages, setMessages, sendMessage, regenerate, status, error, stop } =
		useChat({
			id: chatId,
			messages: allMessages,
			resume: true,
			transport: new DefaultChatTransport({
				api: getVoltAgentChatEndpoint(activeAgentId),
				prepareSendMessagesRequest: ({
					id,
					messages: outgoingMessages,
				}) => {
					const lastMessage =
						outgoingMessages[outgoingMessages.length - 1]

					return {
						body: {
							input: [lastMessage],
							options: buildChatRequestOptions({
								activeAgentId,
								conversationId: id,
								userId,
								selectedModel,
								advancedOptions,
							}),
						},
					}
				},
				prepareReconnectToStreamRequest: ({ id }) => ({
					api: getVoltAgentChatResumeEndpoint(
						activeAgentId,
						id,
						userId
					),
				}),
			}),
			onError: (chatError: Error) => {
				console.error('Chat error:', chatError)
			},
		})

	const handleAdvancedOptionChange = useCallback(
		<K extends keyof AdvancedChatOptions>(
			key: K,
			value: AdvancedChatOptions[K]
		) => {
			setAdvancedOptions((current) => ({
				...current,
				[key]: value,
			}))
		},
		[]
	)

	const handleResetAdvancedOptions = useCallback(() => {
		setAdvancedOptions(DEFAULT_ADVANCED_CHAT_OPTIONS)
	}, [])

	useEffect(() => {
		setMessages(allMessages)
	}, [allMessages, setMessages])

	useEffect(() => {
		const validateLoadedMessages = async () => {
			const result = await safeValidateUIMessages<UIMessage>({
				messages: allMessages,
			})

			if (result.success) {
				setMessages(result.data)
			}
		}

		void validateLoadedMessages()
	}, [allMessages, setMessages])

	const handlePromptClick = useCallback(
		(suggestion: string) => {
			void sendMessage({ text: suggestion })
		},
		[sendMessage]
	)

	const handleSubmit = useCallback(
		async (message: PromptInputMessage) => {
			const trimmedText = message.text.trim()

			if (trimmedText.length === 0 && message.files.length === 0) {
				return
			}

			if (trimmedText.length > 0 && message.files.length > 0) {
				await sendMessage({ text: trimmedText, files: message.files })
				return
			}

			if (trimmedText.length > 0) {
				await sendMessage({ text: trimmedText })
				return
			}

			await sendMessage({ files: message.files })
		},
		[sendMessage]
	)

	const handleRegenerate = useCallback(
		(messageId: string) => {
			void regenerate({ messageId })
		},
		[regenerate]
	)

	useEffect(() => {
		const modelsFromMessages = collectModelIdsFromMessages(messages)
		const agentModel = activeAgent?.model ?? ''

		setKnownModels(
			uniquePreserveOrder([
				selectedModel,
				agentModel,
				...modelsFromMessages,
			])
		)
	}, [activeAgent?.model, messages, selectedModel])

	useEffect(() => {
		if (selectedModel.trim().length > 0) {
			return
		}

		const latestAssistantModel =
			findLatestAssistantModelId(messages) ?? activeAgent?.model

		if (latestAssistantModel) {
			setSelectedModel(latestAssistantModel)
		}
	}, [activeAgent?.model, messages, selectedModel])

	return (
		<div className="flex h-full flex-col">
			<ChatHeader
				activeAgentId={activeAgentId}
				chatId={chatId}
				userId={userId}
				selectedModel={selectedModel}
				activeOptionCount={activeOptionCount}
				onAgentChange={handleAgentChange}
				onNewChat={handleNewChat}
				onDelete={handleDeleteChat}
			/>
			<div className="flex min-h-0 flex-1">
				<div className="flex min-h-0 flex-1 flex-col">
					{isMessagesLoading && (
						<div className="flex items-center gap-2 border-b bg-muted/20 px-6 py-2 text-xs text-muted-foreground">
							<Spinner className="size-3" />
							<span>Loading conversation…</span>
						</div>
					)}

					<ChatMessages
						messages={messages}
						status={status}
						error={error}
						onSuggestionClick={handlePromptClick}
						onRegenerate={handleRegenerate}
					/>

					<div className="border-t xl:hidden">
						<ChatAdvancedOptions
							options={advancedOptions}
							activeOptionCount={activeOptionCount}
							onChange={handleAdvancedOptionChange}
							onReset={handleResetAdvancedOptions}
							className="m-4"
						/>
					</div>

					<ChatInput
						onSubmit={handleSubmit}
						status={status}
						onStop={stop}
						selectedModel={selectedModel}
						defaultModelId={activeAgent?.model}
						onModelChange={setSelectedModel}
						modelOptions={knownModels}
						showWebPreview={showWebPreview}
						onWebPreviewToggle={setShowWebPreview}
					/>
				</div>
				<ChatPanel
					activeAgentId={activeAgentId}
					chatId={chatId}
					userId={userId}
					selectedModel={selectedModel}
					advancedOptions={advancedOptions}
					activeOptionCount={activeOptionCount}
					onAdvancedOptionChange={handleAdvancedOptionChange}
					onResetAdvancedOptions={handleResetAdvancedOptions}
				/>
			</div>
		</div>
	)
}

function uniquePreserveOrder(values: string[]): string[] {
	const seen = new Set<string>()
	const result: string[] = []

	for (const value of values) {
		const trimmed = value.trim()
		if (trimmed.length === 0 || seen.has(trimmed)) {
			continue
		}

		seen.add(trimmed)
		result.push(trimmed)
	}

	return result
}

function collectModelIdsFromMessages(messages: UIMessage[]): string[] {
	const result: string[] = []

	for (const message of messages) {
		if (message.role !== 'assistant') {
			continue
		}

		const modelId = extractModelId(message.metadata)
		if (modelId) {
			result.push(modelId)
		}
	}

	return result
}

function findLatestAssistantModelId(messages: UIMessage[]): string | undefined {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index]
		if (message?.role !== 'assistant') {
			continue
		}

		const modelId = extractModelId(message.metadata)
		if (modelId) {
			return modelId
		}
	}

	return undefined
}

function extractModelId(metadata: unknown): string | undefined {
	if (!metadata || typeof metadata !== 'object') {
		return undefined
	}

	const record = metadata as Record<string, unknown>
	const { model } = record
	if (!model || typeof model !== 'object') {
		return undefined
	}

	const modelRecord = model as Record<string, unknown>
	const { id } = modelRecord
	return typeof id === 'string' && id.trim().length > 0 ? id : undefined
}
