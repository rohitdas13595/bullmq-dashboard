import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { QueueHealthCard } from '@/components/shared/QueueHealthCard'
import { useOverview } from '@/hooks/useOverview'
import { formatRelativeTime } from '@/lib/utils'
import { Server, HardDrive, Clock, ChevronRight } from 'lucide-react'

interface OverviewProps {
  live: boolean
}

export function Overview({ live }: OverviewProps) {
  const { data, isLoading, error } = useOverview(live)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Failed to load overview data</p>
          <p className="text-sm text-muted-foreground mt-1">
            Make sure Redis and the API server are running
          </p>
        </CardContent>
      </Card>
    )
  }

  const { serverStatus, redisHost, redisMemoryMb, uptime, stats, queueHealth, recentActivity } = data

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={serverStatus} />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4" />
                <span className="font-mono">{redisHost}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>{redisMemoryMb} MB</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{uptime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-6 gap-4">
        <StatCard label="Completed" value={stats.completed} valueColor="success" />
        <StatCard label="Failed" value={stats.failed} valueColor="danger" />
        <StatCard label="Waiting" value={stats.waiting} valueColor="warning" />
        <StatCard label="Active" value={stats.active} valueColor="info" />
        <StatCard label="Error Rate" value={stats.errorRate} valueColor="danger" />
        <StatCard label="DLQ" value={stats.dlq} valueColor="danger" />
      </div>

      <div className="grid grid-cols-6 gap-4">
        <StatCard label="Push/sec" value={stats.pushPerSec} valueColor="accent" />
        <StatCard label="Pull/sec" value={stats.pullPerSec} valueColor="accent" />
        <StatCard label="Queues" value={stats.queues} valueColor="accent" />
        <StatCard label="Total Pushed" value={stats.totalPushed} valueColor="accent" />
        <StatCard label="API Keys" value={stats.apiKeys} />
        <StatCard label="Uptime" value={uptime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Queue Health</CardTitle>
            <Link
              to="/queues"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {queueHealth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No queues found
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {queueHealth.slice(0, 6).map((queue) => (
                  <QueueHealthCard
                    key={queue.name}
                    name={queue.name}
                    status={queue.status}
                    waiting={queue.waiting}
                    active={queue.active}
                    completed={queue.completed}
                    failed={queue.failed}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            <Link
              to="/jobs"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={activity.status as 'completed' | 'failed' | 'waiting' | 'active'}
                      />
                      <span className="text-muted-foreground font-mono text-xs">
                        {activity.queue}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
