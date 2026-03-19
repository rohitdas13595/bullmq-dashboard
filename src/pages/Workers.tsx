import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface Worker {
  id: string
  queue: string
  status: string
  jobsProcessed: number
  startedAt: string
}

interface WorkersResponse {
  workers: Worker[]
  total: number
}

interface WorkersProps {
  live: boolean
}

export function Workers({ live }: WorkersProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: () => apiClient.get<WorkersResponse>('/api/workers'),
    refetchInterval: live ? 2000 : false,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workers</h1>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Workers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.workers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active workers
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_150px_100px_150px_150px] gap-4 text-sm text-muted-foreground font-medium px-2 py-1">
                <div>Worker ID</div>
                <div>Queue</div>
                <div>Status</div>
                <div>Jobs Processed</div>
                <div>Started At</div>
              </div>
              {data?.workers.map((worker) => (
                <div
                  key={worker.id}
                  className="grid grid-cols-[1fr_150px_100px_150px_150px] gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="font-mono text-sm">{worker.id}</div>
                  <div className="font-mono text-sm">{worker.queue}</div>
                  <div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="font-mono text-sm">{worker.jobsProcessed}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(worker.startedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
