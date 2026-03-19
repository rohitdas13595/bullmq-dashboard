import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface LiveIndicatorProps {
  live: boolean
  className?: string
}

export function LiveIndicator({ live, className }: LiveIndicatorProps) {
  return (
    <Badge
      variant={live ? 'success' : 'secondary'}
      className={cn(
        'gap-1.5 cursor-pointer',
        live && 'animate-pulse-live',
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', live ? 'bg-success-foreground' : 'bg-muted-foreground')} />
      {live ? 'Live' : 'Paused'}
    </Badge>
  )
}
