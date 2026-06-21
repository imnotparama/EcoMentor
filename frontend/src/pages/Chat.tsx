import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import AgentThinkingPanel from '@/components/AgentThinkingPanel'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

const SUGGESTED_PROMPTS = [
  "What's my biggest carbon contributor?",
  "How do I reduce my electricity footprint?",
  "Compare my footprint to others in my city",
  "Give me a 30-day reduction plan",
  "What eco-challenge should I do next?",
  "How does my food diet impact emissions?",
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 12px rgba(63,185,80,0.4)',
      }}>
        <Bot size={16} color="#0D1117" />
      </div>
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '4px 16px 16px 16px',
        padding: '0.75rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--primary)',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Chat() {
  const { messages, isLoading, isSending, error, lastToolsCalled, loadHistory, sendMessage, clearHistory } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    document.title = 'AI Coach — EcoMentor AI'
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isSending) return
    setInput('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', maxHeight: 900 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(63,185,80,0.35)',
            }}>
              <Bot size={18} color="#0D1117" />
            </div>
            AI Sustainability Coach
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Powered by Claude Sonnet 4 · Uses real tool-calls to ground answers in your data
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="btn btn-secondary btn-sm"
          aria-label="Clear chat history"
          title="Clear chat history"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingRight: '0.25rem' }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Welcome message if no history */}
        {messages.length === 0 && !isLoading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, padding: '2rem', textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 0 40px rgba(63,185,80,0.35)',
              animation: 'floatUp 3s ease-in-out infinite',
            }}>
              <Bot size={36} color="#0D1117" />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Ask Your AI Sustainability Coach</h2>
            <p style={{ maxWidth: 480, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              I have access to your actual carbon footprint data and can compare it to India &amp; global averages.
              Ask me anything about your sustainability journey.
            </p>

            {/* Agentic badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.25)',
              borderRadius: 20, padding: '0.3rem 0.75rem', marginBottom: '2rem',
              fontSize: '0.75rem', color: 'var(--primary)',
            }}>
              <Sparkles size={12} />
              True agentic AI — calls real tools to fetch YOUR data
            </div>

            {/* Suggested prompts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem', width: '100%', maxWidth: 560 }}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="suggested-prompt-btn"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(63,185,80,0.08)'
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'
                  }}
                >
                  <Sparkles size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actual messages */}
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                padding: '0.375rem 0',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '0.625rem',
                maxWidth: '82%',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--accent), var(--primary))'
                    : 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: msg.role === 'assistant' ? '0 0 8px rgba(63,185,80,0.3)' : 'none',
                }}>
                  {msg.role === 'user'
                    ? <User size={15} color="#0D1117" />
                    : <Bot size={15} color="#0D1117" />}
                </div>

                {/* Bubble */}
                <div style={{
                  background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--surface-2)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(88,166,255,0.3)' : 'var(--border)'}`,
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '0.875rem 1rem',
                }}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content" style={{ fontSize: '0.875rem' }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {msg.content}
                    </p>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.375rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Agent thinking panel after last assistant message */}
            {msg.role === 'assistant' && idx === messages.length - 1 && lastToolsCalled.length > 0 && (
              <div style={{ paddingLeft: '2.5rem' }}>
                <AgentThinkingPanel tools={lastToolsCalled} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator with Agent Thinking */}
        {isSending && (
          <div>
            <TypingIndicator />
            <div style={{ paddingLeft: '2.5rem' }}>
              <AgentThinkingPanel tools={[]} isLoading />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem', background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', margin: '0.5rem 0' }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '1rem',
        marginTop: '1rem',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              className="form-input form-textarea"
              placeholder="Ask about your carbon footprint, get reduction tips, or request a sustainability plan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              rows={2}
              maxLength={4000}
              aria-label="Message input"
              style={{ resize: 'none', paddingRight: '1rem', minHeight: 60, maxHeight: 160 }}
            />
          </div>
          <motion.button
            whileHover={!input.trim() || isSending ? undefined : { scale: 1.03 }}
            whileTap={!input.trim() || isSending ? undefined : { scale: 0.97 }}
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="btn btn-primary"
            aria-label="Send message"
            id="btn-send-chat"
            style={{ height: 60, paddingLeft: '1.25rem', paddingRight: '1.25rem', flexShrink: 0 }}
          >
            {isSending ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length}/4000</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
