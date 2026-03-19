import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  valueColor?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'accent'
  subtext?: string
  className?: string
}

const colorClasses = {
  default: 'text-foreground',
  success: 'text-success',
  danger: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
  accent: 'text-primary',
}

export function StatCard({ label, value, valueColor = 'default', subtext, className }: StatCardProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-2xl font-bold', colorClasses[valueColor])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}
