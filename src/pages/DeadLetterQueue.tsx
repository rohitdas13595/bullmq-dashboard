import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDLQOverview, useDLQJobs, useRetryDLQJob, useRetryAllDLQ, usePurgeDLQ } from '@/hooks/useDLQ'
import { formatRelativeTime } from '@/lib/utils'
import { Search, RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface DeadLetterQueueProps {
  live: boolean
}

export function DeadLetterQueue({ live }: DeadLetterQueueProps) {
  const [selectedQueue, setSelectedQueue] = useState('')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: overview, isLoading: loadingOverview } = useDLQOverview(live)
  const { data: dlqJobs, isLoading: loadingJobs, refetch } = useDLQJobs(selectedQueue, {
    sort,
    search: search || undefined,
    page,
    limit: 20,
  }, live)

  const retryJob = useRetryDLQJob()
  const retryAll = useRetryAllDLQ()
  const purgeDLQ = usePurgeDLQ()

  const handleRetryJob = async (jobId: string) => {
    if (!selectedQueue) return
    try {
      await retryJob.mutateAsync({ queue: selectedQueue, jobId })
      toast.success('Job retried')
      refetch()
    } catch {
      toast.error('Failed to retry job')
    }
  }

  const handleRetryAll = async () => {
    if (!selectedQueue) return
    if (!confirm('Are you sure you want to retry all jobs in this queue?')) return
    try {
      await retryAll.mutateAsync(selectedQueue)
      toast.success('All jobs retried')
      refetch()
    } catch {
      toast.error('Failed to retry jobs')
    }
  }

  const handlePurge = async () => {
    if (!selectedQueue) return
    if (!confirm('Are you sure you want to purge all jobs in the DLQ? This cannot be undone.')) return
    try {
      await purgeDLQ.mutateAsync(selectedQueue)
      toast.success('DLQ purged')
      refetch()
    } catch {
      toast.error('Failed to purge DLQ')
    }
  }

  const healthColor = overview?.health === 'Healthy' ? 'success' 
    : overview?.health === 'High' ? 'danger' 
    : 'warning'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dead Letter Queue</h1>
      </div>

      {loadingOverview ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="Total in DLQ" 
            value={overview?.total || 0} 
            valueColor={healthColor}
            subtext={`Health: ${overview?.health || 'Unknown'}`}
          />
          <StatCard label="Top Reason" value={overview?.topReason || 'None'} />
          <StatCard label="Pending Retry" value={overview?.pendingRetry || 0} valueColor="warning" />
          <StatCard label="Failure Types" value={overview?.failureTypes || 0} />
        </div>
      )}

      {overview?.failureDistribution && overview.failureDistribution.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Failure Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.failureDistribution.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-mono w-1/3 truncate">{item.reason}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive"
                      style={{ width: `${(item.count / (overview?.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {overview?.byQueue && Object.keys(overview.byQueue).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">DLQ by Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(overview.byQueue).map(([queue, count]) => (
                <button
                  key={queue}
                  onClick={() => setSelectedQueue(queue)}
                  className={`px-3 py-1 rounded-full text-sm font-mono transition-colors ${
                    selectedQueue === queue
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {queue}: {count}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedQueue} onValueChange={(v) => { setSelectedQueue(v); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  {selectedQueue || 'Select a queue...'}
                </SelectTrigger>
                <SelectContent>
                  {overview?.byQueue && Object.keys(overview.byQueue).map(queue => (
                    <SelectItem key={queue} value={queue}>{queue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[150px]">
                  {sort === 'newest' ? 'Newest First' : 'Oldest First'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by job ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                  disabled={!selectedQueue}
                />
              </div>
            </div>

            {selectedQueue && (
              <div className="flex items-center gap-2">
                <Button onClick={handleRetryAll} disabled={retryAll.isPending} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry All
                </Button>
                <Button onClick={handlePurge} disabled={purgeDLQ.isPending} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purge All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!selectedQueue ? (
            <p className="text-center text-muted-foreground py-8">
              Select a queue to view DLQ jobs
            </p>
          ) : loadingJobs ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : dlqJobs?.jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No jobs in DLQ for this queue
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_200px_100px_100px_100px_80px] gap-4 text-sm text-muted-foreground font-medium px-2 py-1">
                  <div>Job ID</div>
                  <div>Error</div>
                  <div>Attempts</div>
                  <div>Failed At</div>
                  <div>Reason</div>
                  <div>Actions</div>
                </div>
                {dlqJobs?.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="grid grid-cols-[1fr_200px_100px_100px_100px_80px] gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-mono text-sm text-primary">
                        {job.id}
                      </span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground" title={job.failedReason || 'N/A'}>
                      {job.failedReason || 'N/A'}
                    </div>
                    <div className="font-mono text-sm">{job.attemptsMade || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelativeTime(job.timestamp)}
                    </div>
                    <div>
                      <StatusBadge status="failed" />
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryJob.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, dlqJobs?.total || 0)} of {dlqJobs?.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page * 20) >= (dlqJobs?.total || 0)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
