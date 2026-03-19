import { useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Sun, Moon, RefreshCw, ChevronRight } from 'lucide-react'

interface TopBarProps {
  live: boolean
  onToggleLive: () => void
}

const breadcrumbMap: Record<string, string> = {
  '': 'Overview',
  'queues': 'Queues',
  'jobs': 'Jobs',
  'dlq': 'Dead Letter Queue',
  'cron': 'Cron Jobs',
  'workers': 'Workers',
  'metrics': 'Metrics',
  'alerts': 'Alerts',
  'logs': 'Logs',
  'settings': 'Settings',
}

export function TopBar({ live, onToggleLive }: TopBarProps) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const label = breadcrumbMap[segment] || segment
    return { path, label }
  })

  return (
    <header className="fixed top-0 left-[220px] right-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Badge
            variant={live ? 'success' : 'secondary'}
            className={cn(
              'gap-1.5 cursor-pointer',
              live && 'animate-pulse-live'
            )}
            onClick={onToggleLive}
          >
            <span className={cn('h-2 w-2 rounded-full', live ? 'bg-success-foreground' : 'bg-muted-foreground')} />
            {live ? 'Live' : 'Paused'}
          </Badge>

          <Button variant="ghost" size="icon" onClick={onToggleLive}>
            <RefreshCw className={cn('h-4 w-4', live && 'animate-spin')} />
          </Button>

          <Button variant="ghost" size="icon">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-sm font-medium">A</span>
          </div>
        </div>
      </div>
    </header>
  )
}
