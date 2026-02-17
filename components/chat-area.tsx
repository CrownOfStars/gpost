"use client"

import { useState, useRef, useEffect } from "react"
import { Send, GitGraph, Bot, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type MessageType = "user" | "agent" | "system" | "thought"

interface Message {
  id: string
  type: MessageType
  content: string
  agentName?: string
  thoughtContent?: string
}

const mockMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content: "Can you debug the authentication middleware? It's returning 401 for valid tokens.",
  },
  {
    id: "2",
    type: "system",
    content: "Orchestrator invoked DebugAgent",
  },
  {
    id: "3",
    type: "thought",
    content: "",
    thoughtContent:
      "1. Analyzing the auth middleware at /middleware/auth.ts\n2. Token validation uses jwt.verify() with HS256\n3. Found issue: token expiry check uses seconds but Date.now() returns ms\n4. The comparison `exp < Date.now()` always evaluates true\n5. Fix: change to `exp < Math.floor(Date.now() / 1000)`",
    agentName: "DebugAgent",
  },
  {
    id: "4",
    type: "agent",
    content:
      "I found the bug. In your auth middleware, the token expiry comparison is incorrect. `exp` from JWT is in seconds, but `Date.now()` returns milliseconds. Change the check to:\n\n```\nif (exp < Math.floor(Date.now() / 1000)) {\n  throw new TokenExpiredError()\n}\n```\n\nThis will fix the false 401 responses for valid tokens.",
    agentName: "DebugAgent",
  },
  {
    id: "5",
    type: "user",
    content: "Great catch. Can you also check if there are any other timestamp-related issues in the codebase?",
  },
  {
    id: "6",
    type: "system",
    content: "Orchestrator invoked SearchTool",
  },
  {
    id: "7",
    type: "thought",
    content: "",
    thoughtContent:
      "1. Searching codebase for Date.now() comparisons with JWT fields\n2. Found 3 files with similar patterns\n3. /utils/session.ts - same issue on line 42\n4. /handlers/refresh.ts - correctly uses seconds\n5. /cron/cleanup.ts - uses Date.now() directly with DB timestamps (epoch ms) - OK",
    agentName: "SearchAgent",
  },
  {
    id: "8",
    type: "agent",
    content:
      "I scanned the full codebase and found one more instance of the same bug in `/utils/session.ts` at line 42. The refresh handler and cron cleanup are both correct. I recommend applying the same fix to session.ts.",
    agentName: "SearchAgent",
  },
]

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
  onViewTopology: () => void
}

export function ChatArea({ onViewTopology }: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="Chat area">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <h1 className="text-sm font-semibold text-foreground">Debug Session #402</h1>
        <button
          onClick={onViewTopology}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <GitGraph className="h-3.5 w-3.5" aria-hidden="true" />
          View Topology
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="flex flex-col gap-4">
          {mockMessages.map((msg) => {
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

      {/* Input */}
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
              }
            }}
          />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={!inputValue.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
