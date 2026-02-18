"use client"

import { X } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { api, type GraphConfig, type GraphNode } from "@/lib/api"

interface TopologyModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
  sessionTitle?: string
}

interface NodeConfig {
  id: string
  label: string
  sublabel: string
  x: number
  y: number
  type: "start" | "agent" | "end"
}

const DEFAULT_NODES: NodeConfig[] = [
  { id: "start", label: "User Input", sublabel: "Entry Point", x: 400, y: 40, type: "start" },
  { id: "router", label: "Router Agent", sublabel: "Orchestrator", x: 400, y: 150, type: "agent" },
  { id: "coder", label: "Coder Agent", sublabel: "Code Gen", x: 220, y: 280, type: "agent" },
  { id: "reviewer", label: "Reviewer Agent", sublabel: "Code Review", x: 580, y: 280, type: "agent" },
  { id: "summary", label: "Summary Agent", sublabel: "Synthesis", x: 400, y: 400, type: "end" },
]

const DEFAULT_EDGES: [string, string][] = [
  ["start", "router"],
  ["router", "coder"],
  ["router", "reviewer"],
  ["coder", "summary"],
  ["reviewer", "summary"],
]

function toNodeConfig(n: GraphNode): NodeConfig {
  return {
    id: n.id,
    label: n.label ?? n.id,
    sublabel: n.sublabel ?? "",
    x: n.x ?? 400,
    y: n.y ?? 100,
    type: (n.type as "start" | "agent" | "end") ?? "agent",
  }
}

function parseEdges(edges: GraphConfig["edges"]): [string, string][] {
  if (!Array.isArray(edges)) return []
  return edges.map((e) => {
    if (Array.isArray(e)) return e as [string, string]
    if (typeof e === "object" && e !== null && "from" in e && "to" in e)
      return [(e as { from: string; to: string }).from, (e as { from: string; to: string }).to]
    return ["", ""]
  })
}

function TopologyNode({ node }: { node: NodeConfig }) {
  const isAccent = node.type === "start" || node.type === "end"
  return (
    <g>
      <rect
        x={node.x - 70}
        y={node.y}
        width={140}
        height={52}
        rx={8}
        className={isAccent ? "fill-node-accent" : "fill-node-bg"}
        stroke={isAccent ? "var(--node-accent)" : "var(--node-border)"}
        strokeWidth={1}
      />
      <text
        x={node.x}
        y={node.y + 22}
        textAnchor="middle"
        className="fill-node-foreground text-xs font-medium"
        style={{ fontSize: 12 }}
      >
        {node.label}
      </text>
      <text
        x={node.x}
        y={node.y + 38}
        textAnchor="middle"
        className="text-[10px]"
        style={{ fontSize: 10, fill: "var(--edge-color)" }}
      >
        {node.sublabel}
      </text>
    </g>
  )
}

export function TopologyModal({ isOpen, onClose, sessionId, sessionTitle }: TopologyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [nodes, setNodes] = useState<NodeConfig[]>(DEFAULT_NODES)
  const [edges, setEdges] = useState<[string, string][]>(DEFAULT_EDGES)
  const [loading, setLoading] = useState(false)

  const fetchGraph = useCallback(async () => {
    if (!sessionId) {
      setNodes(DEFAULT_NODES)
      setEdges(DEFAULT_EDGES)
      return
    }
    try {
      setLoading(true)
      const data = await api.get<GraphConfig>(`/api/sessions/${sessionId}/graph`)
      const nodeList = Array.isArray(data?.nodes) && data.nodes.length > 0
        ? data.nodes.map(toNodeConfig)
        : DEFAULT_NODES
      const edgeList = Array.isArray(data?.edges) && data.edges.length > 0
        ? parseEdges(data.edges)
        : DEFAULT_EDGES
      setNodes(nodeList)
      setEdges(edgeList)
    } catch {
      setNodes(DEFAULT_NODES)
      setEdges(DEFAULT_EDGES)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (isOpen) fetchGraph()
  }, [isOpen, fetchGraph])

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

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return { cx: 0, cy: 0 }
    return { cx: node.x, cy: node.y + 26 }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto h-auto w-auto max-w-3xl rounded-xl border border-node-border bg-[oklch(0.1_0_0)] p-0 backdrop:bg-overlay-bg"
      aria-label="Agent Topology"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-node-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-node-foreground">Agent Workflow Topology</h2>
            <p className="text-xs text-edge-color mt-0.5">
              {sessionTitle || sessionId ? `${sessionTitle || "Session"} pipeline` : "Select a session"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-edge-color transition-colors hover:bg-node-bg hover:text-node-foreground"
            aria-label="Close topology"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-xs text-muted-foreground">Loading graph...</span>
            </div>
          ) : (
            <svg
              viewBox="0 0 800 480"
              className="w-full"
              role="img"
              aria-label="Agent workflow graph"
            >
              {edges.map(([fromId, toId]) => {
                if (!fromId || !toId) return null
                const from = getNodeCenter(fromId)
                const to = getNodeCenter(toId)
                const midY = (from.cy + to.cy) / 2
                return (
                  <path
                    key={`${fromId}-${toId}`}
                    d={`M ${from.cx} ${from.cy + 26} C ${from.cx} ${midY}, ${to.cx} ${midY}, ${to.cx} ${to.cy - 26}`}
                    fill="none"
                    stroke="var(--edge-color)"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                  />
                )
              })}
              {edges.map(([, toId]) => {
                if (!toId) return null
                const to = getNodeCenter(toId)
                return (
                  <circle
                    key={`dot-${toId}`}
                    cx={to.cx}
                    cy={to.cy - 26}
                    r={3}
                    className="fill-node-accent"
                  />
                )
              })}
              {nodes.map((node) => (
                <TopologyNode key={node.id} node={node} />
              ))}
            </svg>
          )}
        </div>

        <div className="flex gap-6 border-t border-node-border px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm bg-node-accent" />
            <span className="text-[11px] text-edge-color">Entry / Exit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm bg-node-bg border border-node-border" />
            <span className="text-[11px] text-edge-color">Agent Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 border-t border-dashed border-edge-color" />
            <span className="text-[11px] text-edge-color">Data Flow</span>
          </div>
        </div>
      </div>
    </dialog>
  )
}
