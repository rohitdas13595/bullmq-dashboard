import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils'

interface QueueHealthCardProps {
  name: string
  status: 'active' | 'paused'
  waiting: number
  active: number
  completed: number
  failed: number
  className?: string
}

export function QueueHealthCard({
  name,
  status,
  waiting,
  active,
  completed,
  failed,
  className,
}: QueueHealthCardProps) {
  return (
    <Link to={`/queues/${name}`}>
      <Card className={cn('bg-card border-border hover:bg-muted/50 transition-colors cursor-pointer', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-primary">{name}</span>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <p className="text-warning font-semibold">{waiting}</p>
              <p className="text-muted-foreground">W</p>
            </div>
            <div className="text-center">
              <p className="text-info font-semibold">{active}</p>
              <p className="text-muted-foreground">A</p>
            </div>
            <div className="text-center">
              <p className="text-success font-semibold">{completed}</p>
              <p className="text-muted-foreground">C</p>
            </div>
            <div className="text-center">
              <p className="text-destructive font-semibold">{failed}</p>
              <p className="text-muted-foreground">F</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
