"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  ArrowLeft,
  Globe,
  Terminal,
  FileCode,
  Braces,
  Search,
  Wrench,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Skill as ApiSkill } from "@/lib/api"

const SKILL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  websearch: Globe,
  "code-interpreter": Terminal,
  "file-reader": FileCode,
  "json-parser": Braces,
  "semantic-search": Search,
}

interface SkillDisplay {
  id: string
  name: string
  description: string
  code: string
  icon: React.ComponentType<{ className?: string }>
  builtIn: boolean
}

function toDisplay(s: ApiSkill): SkillDisplay {
  const baseId = s.name.toLowerCase().replace(/\s+/g, "-")
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    code: s.code ?? s.prompt ?? "",
    icon: SKILL_ICONS[baseId] ?? Wrench,
    builtIn: false,
  }
}

function SkillCard({
  skill,
  onSelect,
}: {
  skill: SkillDisplay
  onSelect: (skill: SkillDisplay) => void
}) {
  const Icon = skill.icon
  return (
    <button
      onClick={() => onSelect(skill)}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/70"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{skill.name}</span>
          {skill.builtIn && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Built-in
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {skill.description || "No description"}
        </p>
      </div>
    </button>
  )
}

function SkillDetail({
  skill,
  onBack,
  onSave,
}: {
  skill: SkillDisplay
  onBack: () => void
  onSave: (updates: Partial<SkillDisplay>) => Promise<void>
}) {
  const [code, setCode] = useState(skill.code)
  const [description, setDescription] = useState(skill.description)
  const [saving, setSaving] = useState(false)
  const Icon = skill.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ code, description })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to skills"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{skill.name}</h2>
          <span className="text-xs text-muted-foreground">
            {skill.builtIn ? "Built-in Skill" : "Custom Skill"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="skill-description">
              Description
            </label>
            <textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="skill-code">
              Implementation
            </label>
            <textarea
              id="skill-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
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
            <button
              onClick={onBack}
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

function CreateSkillForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (skill: SkillDisplay) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [code, setCode] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const created = await api.post<ApiSkill>("/api/skills", {
        name,
        description,
        code,
        tool_ids: [],
      })
      onCreated(toDisplay(created))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">Create New Skill</h2>
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
            <label className="text-xs font-medium text-foreground" htmlFor="new-skill-name">
              Skill Name
            </label>
            <input
              id="new-skill-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ImageGenerator"
              className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-skill-desc">
              Description
            </label>
            <textarea
              id="new-skill-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this skill do?"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="new-skill-code">
              Implementation
            </label>
            <textarea
              id="new-skill-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="async function mySkill(input: string): Promise<Result> {&#10;  // ...&#10;}"
              className="rounded-md border border-border bg-[oklch(0.14_0_0)] px-4 py-3 font-mono text-xs leading-relaxed text-[oklch(0.85_0_0)] placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Skill"}
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

export function SkillsView() {
  const [skills, setSkills] = useState<SkillDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<SkillDisplay | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchSkills = useCallback(async () => {
    try {
      const data = await api.get<ApiSkill[]>("/api/skills")
      setSkills(data.map(toDisplay))
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleSave = async (updates: Partial<SkillDisplay>) => {
    if (!selectedSkill) return
    await api.put(`/api/skills/${selectedSkill.id}`, {
      name: selectedSkill.name,
      description: updates.description ?? selectedSkill.description,
      code: updates.code ?? selectedSkill.code,
      tool_ids: [],
    })
    setSkills((prev) =>
      prev.map((s) => (s.id === selectedSkill.id ? { ...s, ...updates } : s))
    )
    setSelectedSkill((prev) => (prev ? { ...prev, ...updates } : null))
  }

  if (loading) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading skills...</span>
      </section>
    )
  }

  if (creating) {
    return (
      <section className="flex flex-1 flex-col bg-background" aria-label="Create Skill">
        <CreateSkillForm
          onClose={() => setCreating(false)}
          onCreated={(skill) => {
            setSkills((prev) => [skill, ...prev])
            setCreating(false)
            setSelectedSkill(skill)
          }}
        />
      </section>
    )
  }

  if (selectedSkill) {
    return (
      <section className="flex flex-1 flex-col bg-background" aria-label="Skill Detail">
        <SkillDetail
          skill={selectedSkill}
          onBack={() => setSelectedSkill(null)}
          onSave={handleSave}
        />
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="Skill Library">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Skill Library</h1>
          <p className="text-xs text-muted-foreground">Global system skills available to agents</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Create New Skill
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onSelect={setSelectedSkill} />
          ))}
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills yet. Create one to get started.</p>
          )}
        </div>
      </div>
    </section>
  )
}
