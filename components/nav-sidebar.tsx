"use client"

import { MessageSquare, Store, BarChart3, Cpu, KeyRound, Code, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: MessageSquare, label: "Chat", id: "chat" },
  { icon: Code, label: "Skills", id: "skills" },
  { icon: Wrench, label: "Tool Registry", id: "tools" },
  { icon: KeyRound, label: "API Keys", id: "apikeys" },
  { icon: Store, label: "Agent Market", id: "market" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
] as const

interface NavSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function NavSidebar({ activeTab, onTabChange }: NavSidebarProps) {
  return (
    <aside className="flex w-16 flex-col items-center bg-nav-bg py-4" role="navigation" aria-label="Main navigation">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nav-active mb-8">
        <Cpu className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-nav-active"
                  : "text-nav-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </button>
          )
        })}
      </nav>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
        A
      </div>
    </aside>
  )
}
