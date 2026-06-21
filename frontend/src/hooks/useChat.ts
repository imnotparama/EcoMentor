import { useState, useCallback } from 'react'
import { useAsyncResource } from './useAsyncResource'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/api/types'

export function useChat() {
  const [isSending, setIsSending] = useState(false)
  const [lastToolsCalled, setLastToolsCalled] = useState<string[]>([])

  const { data: messages, isLoading, execute, setData, error: loadError } = useAsyncResource<ChatMessage[]>(
    () => chatApi.getHistory(),
    []
  )

  const loadHistory = useCallback(async () => {
    try {
      await execute()
    } catch {
      // Error handled by useAsyncResource
    }
  }, [execute])

  const [sendError, setSendError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    setIsSending(true)
    setSendError(null)
    setLastToolsCalled([])

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setData((prev) => [...(prev || []), tempUserMsg])

    try {
      const response = await chatApi.sendMessage(content)
      setData((prev) => [
        ...(prev || []).filter((m) => m.id !== tempUserMsg.id),
        response.user_message,
        response.assistant_message,
      ])
      setLastToolsCalled(response.tools_called ?? [])
    } catch (err: unknown) {
      setData((prev) => (prev || []).filter((m) => m.id !== tempUserMsg.id))
      setSendError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }, [setData])

  const clearHistory = useCallback(async () => {
    await chatApi.clearHistory()
    setData([])
    setLastToolsCalled([])
  }, [setData])

  return { messages: messages || [], isLoading, isSending, error: loadError || sendError, lastToolsCalled, loadHistory, sendMessage, clearHistory }
}
