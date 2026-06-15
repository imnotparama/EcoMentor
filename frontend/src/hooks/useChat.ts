import { useState, useCallback } from 'react'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/api/types'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastToolsCalled, setLastToolsCalled] = useState<string[]>([])

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const history = await chatApi.getHistory()
      setMessages(history)
    } catch {
      setError('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    setIsSending(true)
    setError(null)
    setLastToolsCalled([])

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const response = await chatApi.sendMessage(content)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.user_message,
        response.assistant_message,
      ])
      setLastToolsCalled(response.tools_called ?? [])
    } catch (err: unknown) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }, [])

  const clearHistory = useCallback(async () => {
    await chatApi.clearHistory()
    setMessages([])
    setLastToolsCalled([])
  }, [])

  return { messages, isLoading, isSending, error, lastToolsCalled, loadHistory, sendMessage, clearHistory }
}
