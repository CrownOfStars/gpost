"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  Globe,
  Calculator,
  CloudSun,
  Database,
  FileJson,
  Wrench,
  X,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Tool as ApiTool } from "@/lib/api"

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "google-search-api": Globe,
  calculator: Calculator,
  "weather-fetcher": CloudSun,
  "sql-query": Database,
  "json-transform": FileJson,
}

export interface Tool {
  id: string
  name: string
  description: string
  schema: string
  implementation: string
  icon: React.ComponentType<{ className?: string }>
  builtIn: boolean
}

function schemaToString(s: unknown): string {
  if (typeof s === "string") return s
  if (s && typeof s === "object") return JSON.stringify(s, null, 2)
  return "{}"
}

function toDisplay(t: ApiTool): Tool {
  const baseId = t.name.toLowerCase().replace(/\s+/g, "-")
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    schema: schemaToString(t.schema),
    implementation: "",
    icon: TOOL_ICONS[baseId] ?? Wrench,
    builtIn: false,
  }
}

function ToolListPanel({
  tools,
  selectedToolId,
  onSelect,
  onNewTool,
  searchQuery,
  onSearchChange,
}: {
  tools: Tool[]
  selectedToolId: string | null
  onSelect: (tool: Tool) => void
  onNewTool: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search tools"
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Tools
        </span>
        <button
          onClick={onNewTool}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="New tool"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto" role="listbox" aria-label="Tool list">
        {filtered.map((tool) => {
          const isActive = selectedToolId === tool.id
          const Icon = tool.icon
          return (
            <li key={tool.id} role="option" aria-selected={isActive}>
              <button
                onClick={() => onSelect(tool)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/[0.08] border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent hover:bg-muted/70"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium truncate",
                      isActive ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {tool.name}
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {tool.description.slice(0, 50)}
                    {tool.description.length > 50 ? "..." : ""}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">No tools found</li>
        )}
      </ul>
    </aside>
  )
}

function ToolEditor({
  tool,
  onDelete,
  onSave,
}: {
  tool: Tool
  onDelete: (id: string) => void
  onSave: (updates: Partial<Tool>) => Promise<void>
}) {
  const [name, setName] = useState(tool.name)
  const [description, setDescription] = useState(tool.description)
  const [schema, setSchema] = useState(tool.schema)
  const [saving, setSaving] = useState(false)
  const Icon = tool.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ name, description, schema })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="Tool editor">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{tool.name}</h2>
            <span className="text-xs text-muted-foreground">
              {tool.builtIn ? "Built-in Tool" : "Custom Tool"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(tool.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
            aria-label={`Delete ${tool.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="tool-name">
              Tool Name
            </label>
            <input
              id="tool-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="tool-description">
              Description
            </label>
            <textarea
              id="tool-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="tool-schema">
              Schema / Parameters
            </label>
            <textarea
              id="tool-schema"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={10}
              spellCheck={false}
              className="rounded-md border border-border bg-[oklch(0.14_0_0)] px-4 py-3 font-mono text-xs leading-relaxed text-[oklch(0.85_0_0)] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function NewToolForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (tool: Tool) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schema, setSchema] = useState('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      let schemaObj: Record<string, unknown> = {}
      try {
        schemaObj = JSON.parse(schema)
      } catch {
        schemaObj = {}
      }
      const created = await api.post<ApiTool>("/api/tools", {
        name,
        description,
        schema: schemaObj,
      })
      onCreated(toDisplay(created))
    } finally {
      setCreating(false)
    }
  }

  return (
    <section
      className="flex flex-1 flex-col bg-background"
      aria-label="Create new tool"
    >
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <h2 className="text-sm font-semibold text-foreground">Create New Tool</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close form"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-tool-name">
              Tool Name
            </label>
            <input
              id="new-tool-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Slack Notifier"
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-tool-desc">
              Description
            </label>
            <textarea
              id="new-tool-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this tool do?"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-tool-schema">
              Schema / Parameters
            </label>
            <textarea
              id="new-tool-schema"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={8}
              spellCheck={false}
              className="rounded-md border border-border bg-[oklch(0.14_0_0)] px-4 py-3 font-mono text-xs leading-relaxed text-[oklch(0.85_0_0)] placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Tool"}
            </button>
            <button
              onClick={onClose}
              className="h-8 rounded-md border border-border px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ToolEmptyState({ onNewTool }: { onNewTool: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Wrench className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Select a tool to edit</h2>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Choose a tool from the list or create a new one to define its schema and implementation.
        </p>
        <button
          onClick={onNewTool}
          className="mt-1 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New Tool
        </button>
      </div>
    </section>
  )
}

export function ToolsView() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTools = useCallback(async () => {
    try {
      const data = await api.get<ApiTool[]>("/api/tools")
      setTools(data.map(toDisplay))
    } catch {
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const handleDelete = async (id: string) => {
    await api.delete(`/api/tools/${id}`)
    setTools((prev) => prev.filter((t) => t.id !== id))
    if (selectedTool?.id === id) setSelectedTool(null)
  }

  const handleSave = async (updates: Partial<Tool>) => {
    if (!selectedTool) return
    let schemaObj: Record<string, unknown> = {}
    try {
      schemaObj = JSON.parse(updates.schema ?? selectedTool.schema)
    } catch {
      schemaObj = {}
    }
    await api.put(`/api/tools/${selectedTool.id}`, {
      name: updates.name ?? selectedTool.name,
      description: updates.description ?? selectedTool.description,
      schema: schemaObj,
    })
    setTools((prev) =>
      prev.map((t) => (t.id === selectedTool.id ? { ...t, ...updates } : t))
    )
    setSelectedTool((prev) => (prev ? { ...prev, ...updates } : null))
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading tools...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ToolListPanel
        tools={tools}
        selectedToolId={selectedTool?.id ?? null}
        onSelect={(tool) => {
          setCreating(false)
          setSelectedTool(tool)
        }}
        onNewTool={() => {
          setSelectedTool(null)
          setCreating(true)
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {creating ? (
        <NewToolForm
          onClose={() => setCreating(false)}
          onCreated={(tool) => {
            setTools((prev) => [...prev, tool])
            setCreating(false)
            setSelectedTool(tool)
          }}
        />
      ) : selectedTool ? (
        <ToolEditor
          tool={selectedTool}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      ) : (
        <ToolEmptyState
          onNewTool={() => {
            setSelectedTool(null)
            setCreating(true)
          }}
        />
      )}
    </div>
  )
}
