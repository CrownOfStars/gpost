"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  title: string
  subtitle: string
  timestamp: string
}

const sessions: Session[] = [
  { id: "1", title: "Debug Session #402", subtitle: "Fixing auth middleware", timestamp: "2m ago" },
  { id: "2", title: "Code Review #389", subtitle: "Review PR for payments", timestamp: "15m ago" },
  { id: "3", title: "Research Agent", subtitle: "Market analysis pipeline", timestamp: "1h ago" },
  { id: "4", title: "Deploy Pipeline #77", subtitle: "CI/CD optimization", timestamp: "3h ago" },
  { id: "5", title: "Data Migration", subtitle: "Schema v2 planning", timestamp: "5h ago" },
  { id: "6", title: "API Design #201", subtitle: "REST to GraphQL", timestamp: "1d ago" },
]

interface SessionListProps {
  activeSessionId: string
  onSessionSelect: (id: string) => void
}

export function SessionList({ activeSessionId, onSessionSelect }: SessionListProps) {
  return (
    <aside className="flex w-[250px] flex-col border-r border-border bg-background">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search sessions..."
            className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search sessions"
          />
        </div>
      </div>
      <div className="px-3 pb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sessions</span>
      </div>
      <ul className="flex-1 overflow-y-auto" role="listbox" aria-label="Chat sessions">
        {sessions.map((session) => {
          const isActive = activeSessionId === session.id
          return (
            <li key={session.id} role="option" aria-selected={isActive}>
              <button
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/[0.08] border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent hover:bg-muted/70"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium truncate", isActive ? "text-foreground" : "text-foreground/80")}>
                    {session.title}
                  </span>
                  <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">{session.timestamp}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{session.subtitle}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
