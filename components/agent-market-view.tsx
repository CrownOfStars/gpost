"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  ArrowLeft,
  Bot,
  Code2,
  Eye,
  FileText,
  Search as SearchIcon,
  Wrench,
  X,
  Globe,
  Terminal,
  FileCode,
  Braces,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Agent as ApiAgent, type Skill as ApiSkill, type Provider, type LLM } from "@/lib/api"

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Orchestrator: Bot,
  "Code Generation": Code2,
  "Code Review": Eye,
  "Information Retrieval": SearchIcon,
  Summarization: FileText,
  default: Bot,
}

const SKILL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  websearch: Globe,
  "code-interpreter": Terminal,
  "file-reader": FileCode,
  "json-parser": Braces,
  "semantic-search": SearchIcon,
}

function getIconForRole(role: string) {
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
  icon: React.ComponentType<{ className?: string }>
  skillIds: string[]
}

function toDisplayAgent(a: ApiAgent): AgentDisplay {
  const Icon = getIconForRole(a.role || "")
  const modelLabel = a.model?.remote_id || a.model_name || "—"
  return {
    id: a.id,
    name: a.name,
    role: a.role || "assistant",
    modelId: a.model_id || null,
    providerId: a.model?.provider_id || null,
    modelLabel,
    temperature: a.temperature ?? 0.7,
    prompt: a.system_prompt || "",
    icon: Icon,
    skillIds: a.skills?.map((s) => s.id) ?? [],
  }
}

interface SkillOption {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

function AgentCard({
  agent,
  onSelect,
}: {
  agent: AgentDisplay
  onSelect: (agent: AgentDisplay) => void
}) {
  const Icon = agent.icon
  return (
    <button
      onClick={() => onSelect(agent)}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/70"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{agent.name}</span>
        <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
        <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">
          {agent.prompt || "No system prompt"}
        </p>
      </div>
    </button>
  )
}

function AgentDetail({
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
  const [name, setName] = useState(agent.name)
  const [role, setRole] = useState(agent.role)
  const [providerId, setProviderId] = useState<string>(agent.providerId || "")
  const [modelId, setModelId] = useState<string>(agent.modelId || "")
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

  const handleProviderChange = (pid: string) => {
    setProviderId(pid)
    setModelId("")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        name,
        role,
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
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to agents"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{agent.name}</h2>
          <span className="text-xs text-muted-foreground">{agent.role}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="agent-name">
              Agent Name
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="agent-role">
              Role
            </label>
            <input
              id="agent-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Orchestrator, Code Generation"
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="provider-select">
              Provider
            </label>
            <select
              id="provider-select"
              value={providerId}
              onChange={(e) => handleProviderChange(e.target.value)}
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
              <option value="">Select model (refresh in API Keys first)</option>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="system-prompt">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="Define the agent's behavior and instructions..."
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
    </div>
  )
}

function CreateAgentForm({
  providers,
  llms,
  onClose,
  onCreated,
}: {
  providers: Provider[]
  llms: LLM[]
  onClose: () => void
  onCreated: (agent: AgentDisplay) => void
}) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("assistant")
  const [providerId, setProviderId] = useState("")
  const [modelId, setModelId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [creating, setCreating] = useState(false)

  const providerLlms = llms.filter((l) => l.provider_id === providerId)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const created = await api.post<ApiAgent>("/api/agents", {
        name,
        role,
        model_id: modelId || null,
        system_prompt: prompt,
        skill_ids: [],
      })
      onCreated(toDisplayAgent(created))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">Create New Agent</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close form"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-agent-name">
              Agent Name
            </label>
            <input
              id="new-agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Router Agent"
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-agent-role">
              Role
            </label>
            <input
              id="new-agent-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Orchestrator"
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-provider">
              Provider
            </label>
            <select
              id="new-provider"
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
            <label className="text-xs font-medium text-foreground" htmlFor="new-model">
              LLM Model
            </label>
            <select
              id="new-model"
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
            <label className="text-xs font-medium text-foreground" htmlFor="new-agent-prompt">
              System Prompt
            </label>
            <textarea
              id="new-agent-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Define the agent's behavior..."
              className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Agent"}
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
    </div>
  )
}

export function AgentMarketView() {
  const [agents, setAgents] = useState<AgentDisplay[]>([])
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [llms, setLlms] = useState<LLM[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentDisplay | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, skillsRes, providersRes, llmsRes] = await Promise.all([
        api.get<ApiAgent[]>("/api/agents"),
        api.get<ApiSkill[]>("/api/skills"),
        api.get<Provider[]>("/api/providers"),
        api.get<LLM[]>("/api/llms"),
      ])
      setAgents(agentsRes.map(toDisplayAgent))
      setSkills(
        skillsRes.map((s) => ({
          id: s.id,
          name: s.name,
          icon: SKILL_ICONS[s.name.toLowerCase().replace(/\s+/g, "-")] || Wrench,
        }))
      )
      setProviders(providersRes)
      setLlms(llmsRes)
    } catch {
      setAgents([])
      setSkills([])
      setProviders([])
      setLlms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async (updates: Partial<AgentDisplay>) => {
    if (!selectedAgent) return
    await api.put(`/api/agents/${selectedAgent.id}`, {
      name: updates.name ?? selectedAgent.name,
      role: updates.role ?? selectedAgent.role,
      model_id: updates.modelId ?? selectedAgent.modelId,
      temperature: updates.temperature ?? selectedAgent.temperature,
      system_prompt: updates.prompt ?? selectedAgent.prompt,
      skill_ids: updates.skillIds ?? selectedAgent.skillIds,
    })
    setAgents((prev) =>
      prev.map((a) => (a.id === selectedAgent.id ? { ...a, ...updates } : a))
    )
    setSelectedAgent((prev) => (prev ? { ...prev, ...updates } : null))
  }

  if (loading) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading agents...</span>
      </section>
    )
  }

  if (creating) {
    return (
      <section className="flex flex-1 flex-col bg-background" aria-label="Create Agent">
        <CreateAgentForm
          providers={providers}
          llms={llms}
          onClose={() => setCreating(false)}
          onCreated={(agent) => {
            setAgents((prev) => [agent, ...prev])
            setCreating(false)
            setSelectedAgent(agent)
          }}
        />
      </section>
    )
  }

  if (selectedAgent) {
    return (
      <section className="flex flex-1 flex-col bg-background" aria-label="Agent Detail">
        <AgentDetail
          agent={selectedAgent}
          skills={skills}
          providers={providers}
          llms={llms}
          onBack={() => setSelectedAgent(null)}
          onSave={handleSave}
        />
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="Agent Market">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Agent Market</h1>
          <p className="text-xs text-muted-foreground">Configure agent system prompts, models & skills</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Create Agent
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onSelect={setSelectedAgent} />
          ))}
          {agents.length === 0 && (
            <p className="text-sm text-muted-foreground">No agents yet. Create one to get started.</p>
          )}
        </div>
      </div>
    </section>
  )
}
