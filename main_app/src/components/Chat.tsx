import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from './Button'

export function Chat() {
  const [inputValue, setInputValue] = useState('')
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    void sendMessage({ text: inputValue })
    setInputValue('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loan Valuation Assistant
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Hi! I'm here to help you create a loan application and get a property valuation.
              Just tell me about your property and I'll guide you through the process.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                )}
                <div className="whitespace-pre-wrap">
                  {message.parts?.map((part, index) => {
                    if (part.type === 'text') {
                      return <span key={index}>{part.text}</span>
                    }
                    if (part.type.startsWith('tool-')) {
                      const toolPart = part as { type: string; toolCallId: string; toolName?: string; result?: unknown }
                      if (toolPart.result && typeof toolPart.result === 'object' && 'message' in toolPart.result) {
                        return (
                          <div key={index} className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <div className="font-semibold text-green-700 text-sm mb-1">
                              {toolPart.toolName === 'create_loan_application' && '✅ Loan Application Created'}
                              {toolPart.toolName === 'request_valuation' && '✅ Valuation Completed'}
                            </div>
                            <div className="text-sm text-gray-700">{String((toolPart.result as { message: string }).message)}</div>
                          </div>
                        )
                      }
                    }
                    return null
                  })}
                </div>
              </div>

            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} variant="primary">
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
