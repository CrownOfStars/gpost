"use client"

import { useState, useCallback } from "react"
import { NavSidebar } from "@/components/nav-sidebar"
import { SessionList } from "@/components/session-list"
import { ChatArea } from "@/components/chat-area"
import { AgentSidebar } from "@/components/agent-sidebar"
import { TopologyModal } from "@/components/topology-modal"
import { ApiKeysView } from "@/components/api-keys-view"
import { SkillsView } from "@/components/skills-view"
import { ToolsView } from "@/components/tools-view"

export default function Page() {
  const [activeTab, setActiveTab] = useState("chat")
  const [activeSessionId, setActiveSessionId] = useState("1")
  const [topologyOpen, setTopologyOpen] = useState(false)

  const handleOpenTopology = useCallback(() => setTopologyOpen(true), [])
  const handleCloseTopology = useCallback(() => setTopologyOpen(false), [])

  const showSessionList = activeTab === "chat"
  const showAgentSidebar = activeTab === "chat"

  return (
    <div className="flex h-screen overflow-hidden">
      <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      {showSessionList && (
        <SessionList activeSessionId={activeSessionId} onSessionSelect={setActiveSessionId} />
      )}

      {activeTab === "chat" && <ChatArea onViewTopology={handleOpenTopology} />}
      {activeTab === "apikeys" && <ApiKeysView />}
      {activeTab === "skills" && <SkillsView />}
      {activeTab === "tools" && <ToolsView />}

      {showAgentSidebar && <AgentSidebar />}
      <TopologyModal isOpen={topologyOpen} onClose={handleCloseTopology} />
    </div>
  )
}
