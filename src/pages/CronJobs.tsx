import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { StatCard } from '@/components/shared/StatCard'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatCountdown } from '@/lib/utils'
import { Search, RefreshCw, Trash2, Clock } from 'lucide-react'

interface CronJob {
  id: string
  name: string
  queue: string
  pattern: string
  next: number
  count: number
}

interface CronResponse {
  total: number
  queues: number
  nextExecution: number | null
  totalExecutions: number
  jobs: CronJob[]
}

interface CronJobsProps {
  live: boolean
}

const queueColors: Record<string, string> = {
  'report-generation': 'bg-pink-500',
  'image-resize': 'bg-purple-500',
  'payment-processing': 'bg-teal-500',
  'email-notifications': 'bg-orange-500',
  'analytics-events': 'bg-blue-500',
}

export function CronJobs({ live }: CronJobsProps) {
  const [search, setSearch] = useState('')
  const [selectedQueue, setSelectedQueue] = useState('')
  const [countdown, setCountdown] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cron'],
    queryFn: () => apiClient.get<CronResponse>('/api/cron'),
    refetchInterval: live ? 2000 : false,
  })

  useEffect(() => {
    if (data?.nextExecution && data.nextExecution > 0) {
      const interval = setInterval(() => {
        setCountdown(formatCountdown(data.nextExecution! - Date.now() + Date.now() - (Date.now() - 1000)))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [data?.nextExecution])

  const filteredJobs = data?.jobs?.filter(job => {
    if (selectedQueue && job.queue !== selectedQueue) return false
    if (search && !job.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const uniqueQueues = [...new Set(data?.jobs?.map(j => j.queue) || [])]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cron Jobs</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Crons" value={data?.total || 0} valueColor="accent" />
        <StatCard label="Queues" value={data?.queues || 0} />
        <StatCard label="Next Execution" value={countdown || 'N/A'} valueColor="info" />
        <StatCard label="Total Executions" value={data?.totalExecutions || 0} />
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                <SelectTrigger className="w-[200px]">
                  {selectedQueue || 'All Queues'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Queues</SelectItem>
                  {uniqueQueues.map(queue => (
                    <SelectItem key={queue} value={queue}>{queue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredJobs?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No cron jobs found
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_150px_200px_150px_100px_80px] gap-4 text-sm text-muted-foreground font-medium px-2 py-1">
                <div>Name</div>
                <div>Queue</div>
                <div>Schedule</div>
                <div>Next Run</div>
                <div>Executions</div>
                <div>Actions</div>
              </div>
              {filteredJobs?.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-[1fr_150px_200px_150px_100px_80px] gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="font-mono text-sm">{job.name}</div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs text-white ${queueColors[job.queue] || 'bg-gray-500'}`}>
                      {job.queue}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">{job.pattern || 'N/A'}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {job.next ? new Date(job.next).toLocaleString() : 'N/A'}
                  </div>
                  <div className="font-mono text-sm">{job.count}</div>
                  <div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
