"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowLeft,
  Bot,
  Search as SearchIcon,
  Code2,
  Eye,
  FileText,
  Globe,
  Terminal,
  FileCode as FileCodeIcon,
  Braces,
  Search,
  Wrench,
  Plus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Agent as ApiAgent, type Skill as ApiSkill, type SessionAgent, type Provider, type LLM } from "@/lib/api"

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  Orchestrator: Bot,
  "Code Generation": Code2,
  "Code Review": Eye,
  "Information Retrieval": SearchIcon,
  Summarization: FileText,
  default: Bot,
}

function getIconForAgent(agent: ApiAgent) {
  const role = agent.role || ""
  return ROLE_ICONS[role] || ROLE_ICONS.default
}

interface AgentDisplay {
  id: string
  name: string
  role: string
  modelId: string | null
  providerId: string | null
  modelLabel: string
  temperature: number
  prompt: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  status: "active" | "idle"
  skillIds: string[]
}

function toDisplayAgent(a: ApiAgent): AgentDisplay {
  const Icon = getIconForAgent(a)
  return {
    id: a.id,
    name: a.name,
    role: a.role || "assistant",
    modelId: a.model_id || null,
    providerId: a.model?.provider_id || null,
    modelLabel: a.model?.remote_id || a.model_name || "—",
    temperature: a.temperature ?? 0.7,
    prompt: a.system_prompt || "",
    icon: Icon,
    status: "active",
    skillIds: a.skills?.map((s) => s.id) ?? [],
  }
}

interface SkillOption {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const BUILTIN_SKILL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  websearch: Globe,
  "code-interpreter": Terminal,
  "file-reader": FileCodeIcon,
  "json-parser": Braces,
  "semantic-search": Search,
}

function AgentList({
  agents,
  onSelectAgent,
  onAddAgent,
  canAdd,
}: {
  agents: AgentDisplay[]
  onSelectAgent: (agent: AgentDisplay) => void
  onAddAgent: () => void
  canAdd: boolean
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Agent Team
        </h2>
        {canAdd && (
          <button
            onClick={onAddAgent}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Add agent to session"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <ul className="flex flex-col" role="list" aria-label="Agent team">
        {agents.map((agent) => {
          const Icon = agent.icon
          return (
            <li key={agent.id}>
              <button
                onClick={() => onSelectAgent(agent)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/70"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{agent.name}</span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        agent.status === "active" ? "bg-emerald-500" : "bg-border"
                      )}
                      aria-label={agent.status === "active" ? "Active" : "Idle"}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{agent.role}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {agents.length === 0 && canAdd && (
        <p className="px-4 py-3 text-xs text-muted-foreground">No agents in this session. Click + to add.</p>
      )}
    </div>
  )
}

function AddAgentDialog({
  isOpen,
  onClose,
  agents,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  agents: AgentDisplay[]
  onSelect: (agent: AgentDisplay) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) dialog.showModal()
    else dialog.close()
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener("close", handleClose)
    return () => dialog.removeEventListener("close", handleClose)
  }, [onClose])

  if (!isOpen) return null
  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto h-auto max-h-[80vh] w-full max-w-md rounded-xl border border-border bg-background p-0 backdrop:bg-black/50"
      aria-label="Add agent to session"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Add Agent to Session</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents in market. Create one in Agent Market first.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {agents.map((agent) => {
                const Icon = agent.icon
                return (
                  <li key={agent.id}>
                    <button
                      onClick={() => onSelect(agent)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground">{agent.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{agent.role}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}

function AgentConfig({
  agent,
  skills,
  providers,
  llms,
  onBack,
  onSave,
}: {
  agent: AgentDisplay
  skills: SkillOption[]
  providers: Provider[]
  llms: LLM[]
  onBack: () => void
  onSave: (updates: Partial<AgentDisplay>) => Promise<void>
}) {
  const [providerId, setProviderId] = useState(agent.providerId || "")
  const [modelId, setModelId] = useState(agent.modelId || "")
  const [temperature, setTemperature] = useState(agent.temperature)
  const [prompt, setPrompt] = useState(agent.prompt)
  const [equippedSkills, setEquippedSkills] = useState<Set<string>>(new Set(agent.skillIds))
  const [saving, setSaving] = useState(false)

  const providerLlms = llms.filter((l) => l.provider_id === providerId)

  const toggleSkill = (skillId: string) => {
    setEquippedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        modelId: modelId || null,
        providerId: providerId || null,
        temperature,
        prompt,
        skillIds: Array.from(equippedSkills),
      })
    } finally {
      setSaving(false)
    }
  }

  const Icon = agent.icon
  return (
    <div className="flex flex-col">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 pb-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden="true" />
        Back to team
      </button>
      <div className="flex items-center gap-3 px-4 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
          <span className="text-xs text-muted-foreground">{agent.role}</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="provider-select">
            Provider
          </label>
          <select
            id="provider-select"
            value={providerId}
            onChange={(e) => {
              setProviderId(e.target.value)
              setModelId("")
            }}
            className="h-8 rounded-md border border-border bg-card px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="model-select">
            LLM Model
          </label>
          <select
            id="model-select"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            disabled={!providerId}
            className="h-8 rounded-md border border-border bg-card px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            <option value="">Select model</option>
            {providerLlms.map((llm) => (
              <option key={llm.id} value={llm.id}>
                {llm.remote_id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground" htmlFor="temp-range">
              Temperature
            </label>
            <span className="text-xs font-mono text-muted-foreground">{temperature.toFixed(1)}</span>
          </div>
          <input
            id="temp-range"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="system-prompt">
            System Prompt
          </label>
          <textarea
            id="system-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-foreground">Equipped Skills</label>
          <div className="flex flex-col gap-0.5 rounded-md border border-border bg-card overflow-hidden">
            {skills.map((skill) => {
              const isEquipped = equippedSkills.has(skill.id)
              const SkillIcon = skill.icon
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    isEquipped ? "bg-primary/[0.06]" : "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isEquipped ? "border-primary bg-primary" : "border-border bg-background"
                    )}
                  >
                    {isEquipped && (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <SkillIcon className={cn("h-3.5 w-3.5", isEquipped ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isEquipped ? "text-foreground" : "text-muted-foreground")}>
                    {skill.name}
                  </span>
                </button>
              )
            })}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {equippedSkills.size} of {skills.length} skills equipped
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

interface AgentSidebarProps {
  sessionId?: string | null
}

export function AgentSidebar({ sessionId }: AgentSidebarProps) {
  const [allAgents, setAllAgents] = useState<AgentDisplay[]>([])
  const [sessionAgents, setSessionAgents] = useState<AgentDisplay[]>([])
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [llms, setLlms] = useState<LLM[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentDisplay | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, skillsRes, providersRes, llmsRes] = await Promise.all([
        api.get<ApiAgent[]>("/api/agents"),
        api.get<ApiSkill[]>("/api/skills"),
        api.get<Provider[]>("/api/providers"),
        api.get<LLM[]>("/api/llms"),
      ])
      const agentsMap = new Map(agentsRes.map((a) => [a.id, toDisplayAgent(a)]))
      setAllAgents(Array.from(agentsMap.values()))
      setProviders(providersRes)
      setLlms(llmsRes)
      setSkills(
        skillsRes.map((s) => ({
          id: s.id,
          name: s.name,
          icon: BUILTIN_SKILL_ICONS[s.name.toLowerCase().replace(/\s+/g, "-")] || Wrench,
        }))
      )

      if (sessionId) {
        const sessAgents = await api.get<SessionAgent[]>(`/api/sessions/${sessionId}/agents`)
        const resolved = sessAgents
          .map((sa) => agentsMap.get(sa.original_agent_id))
          .filter((a): a is AgentDisplay => a != null)
        setSessionAgents(resolved)
      } else {
        setSessionAgents([])
      }
    } catch {
      setAllAgents([])
      setSessionAgents([])
      setSkills([])
      setProviders([])
      setLlms([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddAgent = async (agent: AgentDisplay) => {
    if (!sessionId) return
    try {
      await api.post(`/api/sessions/${sessionId}/agents`, {
        original_agent_id: agent.id,
      })
      setAddDialogOpen(false)
      fetchData()
    } catch {
      // could show toast
    }
  }

  const handleSave = async (updates: Partial<AgentDisplay>) => {
    if (!selectedAgent) return
    await api.put(`/api/agents/${selectedAgent.id}`, {
      name: selectedAgent.name,
      role: selectedAgent.role,
      model_id: updates.modelId ?? selectedAgent.modelId,
      temperature: updates.temperature ?? selectedAgent.temperature,
      system_prompt: updates.prompt ?? selectedAgent.prompt,
      skill_ids: updates.skillIds ?? selectedAgent.skillIds,
    })
    setAllAgents((prev) =>
      prev.map((a) => (a.id === selectedAgent.id ? { ...a, ...updates } : a))
    )
    setSessionAgents((prev) =>
      prev.map((a) => (a.id === selectedAgent.id ? { ...a, ...updates } : a))
    )
    setSelectedAgent((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const displayAgents = sessionId ? sessionAgents : allAgents
  const canAdd = Boolean(sessionId)

  if (loading) {
    return (
      <aside className="flex w-[280px] flex-col border-l border-border bg-background pt-4" aria-label="Agent panel">
        <div className="flex flex-1 items-center justify-center p-4">
          <span className="text-xs text-muted-foreground">Loading agents...</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-[280px] flex-col border-l border-border bg-background pt-4" aria-label="Agent panel">
      {selectedAgent ? (
        <AgentConfig
          agent={selectedAgent}
          skills={skills}
          providers={providers}
          llms={llms}
          onBack={() => setSelectedAgent(null)}
          onSave={handleSave}
        />
      ) : (
        <>
          <AgentList
            agents={displayAgents}
            onSelectAgent={setSelectedAgent}
            onAddAgent={() => setAddDialogOpen(true)}
            canAdd={canAdd}
          />
          <AddAgentDialog
            isOpen={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            agents={allAgents.filter((a) => !sessionAgents.some((sa) => sa.id === a.id))}
            onSelect={handleAddAgent}
          />
        </>
      )}
    </aside>
  )
}
