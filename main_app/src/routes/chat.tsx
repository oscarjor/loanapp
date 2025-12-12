import { createFileRoute } from '@tanstack/react-router'
import { Chat } from '../components/Chat'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AI Loan Assistant</h1>
        <p className="mt-2 text-sm text-gray-700">
          Chat with our AI assistant to create loan applications and request valuations.
        </p>
      </div>

      {/* Chat Interface */}
      <Chat />
    </div>
  )
}
