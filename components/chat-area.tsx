"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, GitGraph, Bot, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type SessionDetail, type Message } from "@/lib/api"

type MessageType = "user" | "agent" | "system" | "thought"

interface DisplayMessage {
  id: string
  type: MessageType
  content: string
  agentName?: string
  thoughtContent?: string
}

function thoughtContentFromMessage(m: Message): string | undefined {
  const tp = m.thought_process
  if (!tp) return undefined
  if (typeof tp === "string") return tp
  if (Array.isArray(tp)) {
    const parts = tp.map((p: unknown) => (p && typeof p === "object" && "text" in p) ? String((p as { text: string }).text) : String(p))
    return parts.join("\n")
  }
  return undefined
}

function messagesToDisplay(messages: Message[]): DisplayMessage[] {
  const out: DisplayMessage[] = []
  for (const m of messages) {
    const thought = thoughtContentFromMessage(m)
    if (m.role === "user") {
      out.push({ id: m.id, type: "user", content: m.content })
    } else if (m.role === "assistant") {
      if (thought) {
        out.push({ id: m.id + "-thought", type: "thought", content: "", thoughtContent: thought })
      }
      out.push({ id: m.id, type: "agent", content: m.content, agentName: "Assistant" })
    }
  }
  return out
}

function ThoughtBlock({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-thought-foreground hover:text-foreground transition-colors group"
        aria-expanded={isOpen}
      >
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
        <span className="font-medium">Reasoning Trace</span>
        {!isOpen && <span className="text-muted-foreground">{"click to expand"}</span>}
      </button>
      {isOpen && (
        <div className="mt-2 rounded-md border border-border bg-thought-bg p-3">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-thought-foreground">
            {content}
          </pre>
        </div>
      )}
    </div>
  )
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end px-4">
      <div className="max-w-md rounded-2xl rounded-br-sm bg-chat-user px-4 py-2.5">
        <p className="text-sm leading-relaxed text-chat-user-foreground">{content}</p>
      </div>
    </div>
  )
}

function AgentMessage({ content, agentName }: { content: string; agentName?: string }) {
  return (
    <div className="flex gap-3 px-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-xl">
        {agentName && (
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{agentName}</span>
        )}
        <div className="rounded-2xl rounded-bl-sm bg-chat-agent border border-border px-4 py-2.5">
          <p className="text-sm leading-relaxed text-chat-agent-foreground whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  )
}

function SystemEvent({ content }: { content: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[11px] text-system-event">{content}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

interface ChatAreaProps {
  sessionId: string | null
  sessionTitle?: string
  onViewTopology: () => void
}

export function ChatArea({ sessionId, sessionTitle, onViewTopology }: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<SessionDetail>(`/api/sessions/${sessionId}`)
      setSession(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session")
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.messages])

  const handleSend = async () => {
    const msg = inputValue.trim()
    if (!msg || !sessionId) return
    try {
      setSending(true)
      setInputValue("")
      await api.post("/api/chat/send", { session_id: sessionId, message: msg })
      await fetchSession()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const displayMessages = session?.messages ? messagesToDisplay(session.messages) : []

  if (!sessionId) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center bg-background" aria-label="Chat area">
        <p className="text-sm text-muted-foreground">Select a session or create a new one</p>
      </section>
    )
  }

  if (loading && !session) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center bg-background" aria-label="Chat area">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="Chat area">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <h1 className="text-sm font-semibold text-foreground">{sessionTitle || session?.title || "Chat"}</h1>
        <button
          onClick={onViewTopology}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <GitGraph className="h-3.5 w-3.5" aria-hidden="true" />
          View Topology
        </button>
      </header>

      {error && (
        <div className="border-b border-border bg-destructive/10 px-5 py-2">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-6">
        <div className="flex flex-col gap-4">
          {displayMessages.map((msg) => {
            switch (msg.type) {
              case "user":
                return <UserMessage key={msg.id} content={msg.content} />
              case "agent":
                return <AgentMessage key={msg.id} content={msg.content} agentName={msg.agentName} />
              case "system":
                return <SystemEvent key={msg.id} content={msg.content} />
              case "thought":
                return msg.thoughtContent ? (
                  <ThoughtBlock key={msg.id} content={msg.thoughtContent} />
                ) : null
              default:
                return null
            }
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Message input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
