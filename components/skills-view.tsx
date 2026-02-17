"use client"

import { useState } from "react"
import { Plus, ArrowLeft, Globe, Terminal, FileCode, Braces, Search, Wrench, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { globalTools } from "@/components/tools-view"

export interface Skill {
  id: string
  name: string
  description: string
  code: string
  icon: React.ElementType
  builtIn: boolean
}

export const globalSkills: Skill[] = [
  {
    id: "websearch",
    name: "WebSearch",
    description: "Search the web for real-time information and return structured results.",
    code: `async function webSearch(query: string): Promise<SearchResult[]> {\n  const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);\n  return response.json();\n}`,
    icon: Globe,
    builtIn: true,
  },
  {
    id: "code-interpreter",
    name: "CodeInterpreter",
    description: "Execute code in a sandboxed environment and return stdout/stderr.",
    code: `async function codeInterpreter(code: string, lang: string): Promise<ExecResult> {\n  const response = await fetch('/api/execute', {\n    method: 'POST',\n    body: JSON.stringify({ code, lang }),\n  });\n  return response.json();\n}`,
    icon: Terminal,
    builtIn: true,
  },
  {
    id: "file-reader",
    name: "FileReader",
    description: "Read file contents from the project workspace by path.",
    code: `async function fileReader(path: string): Promise<FileContent> {\n  const response = await fetch(\`/api/files?path=\${encodeURIComponent(path)}\`);\n  return response.json();\n}`,
    icon: FileCode,
    builtIn: true,
  },
  {
    id: "json-parser",
    name: "JSONParser",
    description: "Parse, validate, and transform JSON data with schema validation.",
    code: `function jsonParser(input: string, schema?: JSONSchema): ParseResult {\n  const parsed = JSON.parse(input);\n  if (schema) validate(parsed, schema);\n  return { data: parsed, valid: true };\n}`,
    icon: Braces,
    builtIn: true,
  },
  {
    id: "semantic-search",
    name: "SemanticSearch",
    description: "Vector similarity search across embedded documents and code.",
    code: `async function semanticSearch(query: string, topK: number = 5): Promise<Match[]> {\n  const embedding = await embed(query);\n  return vectorDB.query(embedding, topK);\n}`,
    icon: Search,
    builtIn: true,
  },
]

function SkillCard({
  skill,
  onSelect,
}: {
  skill: Skill
  onSelect: (skill: Skill) => void
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
          {skill.description}
        </p>
      </div>
    </button>
  )
}

function SkillDetail({ skill, onBack }: { skill: Skill; onBack: () => void }) {
  const [code, setCode] = useState(skill.code)
  const [description, setDescription] = useState(skill.description)
  const Icon = skill.icon

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
            <button className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Save Changes
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

function CreateSkillForm({ onClose, onCreated }: { onClose: () => void; onCreated: (skill: Skill) => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [code, setCode] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return
    const newSkill: Skill = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      description,
      code,
      icon: Wrench,
      builtIn: false,
    }
    onCreated(newSkill)
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
              disabled={!name.trim()}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Create Skill
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
  const [skills, setSkills] = useState<Skill[]>(globalSkills)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [creating, setCreating] = useState(false)

  if (creating) {
    return (
      <section className="flex flex-1 flex-col bg-background" aria-label="Create Skill">
        <CreateSkillForm
          onClose={() => setCreating(false)}
          onCreated={(skill) => {
            setSkills((prev) => [...prev, skill])
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
        <SkillDetail skill={selectedSkill} onBack={() => setSelectedSkill(null)} />
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
        </div>
      </div>
    </section>
  )
}
