/**
 * API client for GPost Agent Orchestration backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

// --- API Types (aligned with backend schemas) ---

export interface Tool {
  id: string
  name: string
  description?: string
  schema?: Record<string, unknown>
  credential_config?: Record<string, unknown>
  created_at: string
}

export interface Skill {
  id: string
  name: string
  description?: string
  prompt?: string
  code?: string
  created_at: string
  tools: Tool[]
}

export interface Agent {
  id: string
  name: string
  role?: string
  avatar?: string
  description?: string
  model_id?: string
  model_provider?: string
  model_name?: string
  model?: LLM
  temperature?: number
  system_prompt?: string
  created_at: string
  skills: Skill[]
}

export interface Provider {
  id: string
  name: string
  base_url?: string
  api_key?: string
  is_active: boolean
}

export interface LLM {
  id: string
  provider_id: string
  remote_id: string
  is_llm: boolean
}

export interface Message {
  id: string
  session_id: string
  role: string
  content: string
  agent_id?: string
  thought_process?: string | unknown[]
  msg_type?: string
  parent_id?: string
  created_at: string
}

export interface SessionAgent {
  id: string
  session_id: string
  original_agent_id: string
  override_system_prompt?: string
  override_model?: string
  memory_context?: string | Record<string, unknown>
}

export interface Session {
  id: string
  title?: string
  user_id?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface SessionDetail extends Session {
  messages: Message[]
  session_agents: SessionAgent[]
}

export interface GraphNode {
  id: string
  label?: string
  sublabel?: string
  x?: number
  y?: number
  type?: "start" | "agent" | "end"
}

export interface GraphConfig {
  nodes: GraphNode[]
  edges: [string, string][] | { from: string; to: string }[]
}
