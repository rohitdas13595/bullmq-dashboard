import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  live: boolean
  onToggleLive: () => void
}

export function AppShell({ children, live, onToggleLive }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar live={live} onToggleLive={onToggleLive} />
      <main className={cn("pl-[220px] pt-14 min-h-screen")}>
        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
