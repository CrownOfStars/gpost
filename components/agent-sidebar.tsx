"use client"

import { useState } from "react"
import { ArrowLeft, Bot, Search as SearchIcon, Code2, Eye, FileText, Globe, Terminal, FileCode as FileCodeIcon, Braces, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillOption {
  id: string
  name: string
  icon: React.ElementType
}

const availableSkills: SkillOption[] = [
  { id: "websearch", name: "WebSearch", icon: Globe },
  { id: "code-interpreter", name: "CodeInterpreter", icon: Terminal },
  { id: "file-reader", name: "FileReader", icon: FileCodeIcon },
  { id: "json-parser", name: "JSONParser", icon: Braces },
  { id: "semantic-search", name: "SemanticSearch", icon: Search },
]

interface Agent {
  id: string
  name: string
  role: string
  model: string
  temperature: number
  prompt: string
  icon: React.ElementType
  status: "active" | "idle"
}

const agents: Agent[] = [
  {
    id: "1",
    name: "Router Agent",
    role: "Orchestrator",
    model: "gpt-4o",
    temperature: 0.1,
    prompt: "You are the Router agent. Analyze user queries and delegate to the appropriate specialized agent.",
    icon: Bot,
    status: "active",
  },
  {
    id: "2",
    name: "Coder Agent",
    role: "Code Generation",
    model: "gpt-4o",
    temperature: 0.2,
    prompt: "You are a senior software engineer. Write clean, efficient code with proper error handling.",
    icon: Code2,
    status: "active",
  },
  {
    id: "3",
    name: "Reviewer Agent",
    role: "Code Review",
    model: "gpt-4o-mini",
    temperature: 0.3,
    prompt: "You review code for bugs, security issues, and best practices. Be thorough but concise.",
    icon: Eye,
    status: "idle",
  },
  {
    id: "4",
    name: "Search Agent",
    role: "Information Retrieval",
    model: "gpt-4o-mini",
    temperature: 0.0,
    prompt: "Search the codebase and documentation to find relevant information for the team.",
    icon: SearchIcon,
    status: "active",
  },
  {
    id: "5",
    name: "Summary Agent",
    role: "Summarization",
    model: "gpt-4o-mini",
    temperature: 0.5,
    prompt: "Synthesize findings from other agents into a clear, actionable summary for the user.",
    icon: FileText,
    status: "idle",
  },
]

function AgentList({ onSelectAgent }: { onSelectAgent: (agent: Agent) => void }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 pb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent Team</h2>
      </div>
      <ul className="flex flex-col" role="list" aria-label="Agent team">
        {agents.map((agent) => (
          <li key={agent.id}>
            <button
              onClick={() => onSelectAgent(agent)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/70"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <agent.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
        ))}
      </ul>
    </div>
  )
}

function AgentConfig({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const [model, setModel] = useState(agent.model)
  const [temperature, setTemperature] = useState(agent.temperature)
  const [prompt, setPrompt] = useState(agent.prompt)
  const [equippedSkills, setEquippedSkills] = useState<Set<string>>(
    new Set(["websearch", "code-interpreter"])
  )

  const toggleSkill = (skillId: string) => {
    setEquippedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) {
        next.delete(skillId)
      } else {
        next.add(skillId)
      }
      return next
    })
  }

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
          <agent.icon className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
          <span className="text-xs text-muted-foreground">{agent.role}</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="model-select">Model</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-8 rounded-md border border-border bg-card px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="claude-3.5-sonnet">claude-3.5-sonnet</option>
            <option value="claude-3-haiku">claude-3-haiku</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground" htmlFor="temp-range">Temperature</label>
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
          <label className="text-xs font-medium text-foreground" htmlFor="system-prompt">System Prompt</label>
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
            {availableSkills.map((skill) => {
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
                      isEquipped
                        ? "border-primary bg-primary"
                        : "border-border bg-background"
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
                  <SkillIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      isEquipped ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isEquipped ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {skill.name}
                  </span>
                </button>
              )
            })}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {equippedSkills.size} of {availableSkills.length} skills equipped
          </span>
        </div>
      </div>
    </div>
  )
}

export function AgentSidebar() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  return (
    <aside className="flex w-[280px] flex-col border-l border-border bg-background pt-4" aria-label="Agent panel">
      {selectedAgent ? (
        <AgentConfig agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      ) : (
        <AgentList onSelectAgent={setSelectedAgent} />
      )}
    </aside>
  )
}
