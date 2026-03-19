import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type Status = 'active' | 'waiting' | 'completed' | 'failed' | 'delayed' | 'paused' | 'online' | 'offline'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'info', label: string }> = {
  active: { variant: 'info', label: 'Active' },
  waiting: { variant: 'warning', label: 'Waiting' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'destructive', label: 'Failed' },
  delayed: { variant: 'secondary', label: 'Delayed' },
  paused: { variant: 'secondary', label: 'Paused' },
  online: { variant: 'success', label: 'Online' },
  offline: { variant: 'destructive', label: 'Offline' },
}

const dotColors: Record<Status, string> = {
  active: 'bg-info',
  waiting: 'bg-warning',
  completed: 'bg-success',
  failed: 'bg-destructive',
  delayed: 'bg-muted-foreground',
  paused: 'bg-muted-foreground',
  online: 'bg-success',
  offline: 'bg-destructive',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[status])} />
      {config.label}
    </Badge>
  )
}
