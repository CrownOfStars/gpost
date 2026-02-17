"use client"

import { useState } from "react"
import { Eye, EyeOff, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Provider {
  id: string
  name: string
  shortName: string
  apiKey: string
  baseUrl: string
  verified: boolean | null
}

const initialProviders: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    shortName: "OAI",
    apiKey: "sk-proj-****************************a4Qz",
    baseUrl: "https://api.openai.com/v1",
    verified: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    shortName: "ANT",
    apiKey: "sk-ant-****************************vX8m",
    baseUrl: "https://api.anthropic.com",
    verified: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    shortName: "GEM",
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    verified: null,
  },
  {
    id: "groq",
    name: "Groq",
    shortName: "GRQ",
    apiKey: "",
    baseUrl: "https://api.groq.com/openai/v1",
    verified: null,
  },
]

function ProviderCard({
  provider,
  onUpdate,
  onDelete,
}: {
  provider: Provider
  onUpdate: (id: string, updates: Partial<Provider>) => void
  onDelete: (id: string) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const [localKey, setLocalKey] = useState(provider.apiKey)
  const [localUrl, setLocalUrl] = useState(provider.baseUrl)
  const [verifying, setVerifying] = useState(false)

  const handleVerify = () => {
    setVerifying(true)
    setTimeout(() => {
      onUpdate(provider.id, {
        apiKey: localKey,
        baseUrl: localUrl,
        verified: localKey.length > 0,
      })
      setVerifying(false)
    }, 800)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
            {provider.shortName}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
            <span className="text-xs text-muted-foreground">{provider.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider.verified === true && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
          {provider.verified === false && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Invalid
            </span>
          )}
          <button
            onClick={() => onDelete(provider.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
            aria-label={`Remove ${provider.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor={`key-${provider.id}`}>
            API Key
          </label>
          <div className="relative">
            <input
              id={`key-${provider.id}`}
              type={showKey ? "text" : "password"}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your API key..."
              className="h-8 w-full rounded-md border border-border bg-background px-3 pr-9 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor={`url-${provider.id}`}>
            Base URL
          </label>
          <input
            id={`url-${provider.id}`}
            type="url"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleVerify}
            disabled={verifying || !localKey.trim()}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            {verifying ? "Verifying..." : "Save & Verify"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ApiKeysView() {
  const [providers, setProviders] = useState(initialProviders)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newShort, setNewShort] = useState("")

  const handleUpdate = (id: string, updates: Partial<Provider>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const handleDelete = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id))
  }

  const handleAddProvider = () => {
    if (!newName.trim()) return
    const id = newName.toLowerCase().replace(/\s+/g, "-")
    setProviders((prev) => [
      ...prev,
      {
        id,
        name: newName,
        shortName: newShort || newName.slice(0, 3).toUpperCase(),
        apiKey: "",
        baseUrl: "",
        verified: null,
      },
    ])
    setNewName("")
    setNewShort("")
    setShowAddForm(false)
  }

  return (
    <section className="flex flex-1 flex-col bg-background" aria-label="API Key Management">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="text-sm font-semibold text-foreground">API Key Management</h1>
          <p className="text-xs text-muted-foreground">Configure LLM provider credentials</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Provider
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {showAddForm && (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-5">
              <h3 className="text-sm font-medium text-foreground mb-3">New Provider</h3>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="new-provider-name">
                      Provider Name
                    </label>
                    <input
                      id="new-provider-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Mistral AI"
                      className="h-8 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex w-24 flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="new-provider-short">
                      Abbreviation
                    </label>
                    <input
                      id="new-provider-short"
                      type="text"
                      value={newShort}
                      onChange={(e) => setNewShort(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="MIS"
                      maxLength={4}
                      className="h-8 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProvider}
                    disabled={!newName.trim()}
                    className="h-7 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewName("")
                      setNewShort("")
                    }}
                    className="h-7 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
