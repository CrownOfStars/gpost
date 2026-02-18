"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Session } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

interface SessionListProps {
  activeSessionId: string
  onSessionSelect: (id: string, title?: string) => void
}

export function SessionList({ activeSessionId, onSessionSelect }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      setError(null)
      const data = await api.get<Session[]>("/api/sessions")
      setSessions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (loading || sessions.length === 0) return
    const exists = sessions.some((s) => s.id === activeSessionId)
    if (!exists) {
      const first = sessions[0]
      onSessionSelect(first?.id ?? "", first?.title)
    }
  }, [loading, sessions, activeSessionId, onSessionSelect])

  const handleCreateSession = async () => {
    try {
      setCreating(true)
      const newSession = await api.post<Session>("/api/sessions", {
        title: "New Session",
        user_id: "default_user",
        status: "active",
      })
      setSessions((prev) => [newSession, ...prev])
      onSessionSelect(newSession.id, newSession.title)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session")
    } finally {
      setCreating(false)
    }
  }

  const filtered = sessions.filter((s) =>
    (s.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <aside className="flex w-[250px] flex-col border-r border-border bg-background">
        <div className="flex flex-1 items-center justify-center p-4">
          <span className="text-xs text-muted-foreground">Loading sessions...</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-[250px] flex-col border-r border-border bg-background">
      <div className="p-3">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search sessions"
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sessions
        </span>
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="New session"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {error && (
        <div className="px-3 pb-2">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}
      <ul className="flex-1 overflow-y-auto" role="listbox" aria-label="Chat sessions">
        {filtered.map((session) => {
          const isActive = activeSessionId === session.id
          const timestamp = session.updated_at
            ? formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })
            : ""
          return (
            <li key={session.id} role="option" aria-selected={isActive}>
              <button
                onClick={() => onSessionSelect(session.id, session.title)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/[0.08] border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent hover:bg-muted/70"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {session.title || "Untitled"}
                  </span>
                  <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                    {timestamp}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {session.status || "active"}
                </span>
              </button>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">
            No sessions. Click + to create.
          </li>
        )}
      </ul>
    </aside>
  )
}
