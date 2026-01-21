import { ChatPanel } from '../_components/chat-panel'
import { nanoid } from 'nanoid'

export default function ChatPage() {
    const chatId = nanoid()
    const userId = 'user-1' // Replace with actual user ID from auth

    return <ChatPanel chatId={chatId} userId={userId} initialMessages={[]} />
}
