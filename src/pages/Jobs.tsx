import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { JobDetailSheet } from '@/components/shared/JobDetailSheet'
import { useJobs, useDeleteJob, useBulkDeleteJobs, type Job } from '@/hooks/useJobs'
import { formatRelativeTime } from '@/lib/utils'
import { Search, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface JobsProps {
  live: boolean
}

export function Jobs({ live }: JobsProps) {
  const [selectedQueue, setSelectedQueue] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [detailJob, setDetailJob] = useState<Job | null>(null)

  const { data, isLoading, refetch } = useJobs({
    queue: selectedQueue || undefined,
    status: status || undefined,
    search: search || undefined,
    page,
    limit: 20,
  }, live)

  const deleteJob = useDeleteJob()
  const bulkDelete = useBulkDeleteJobs()

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await deleteJob.mutateAsync(jobId)
      toast.success('Job deleted')
      refetch()
    } catch {
      toast.error('Failed to delete job')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedJobs.length} jobs?`)) return
    try {
      await bulkDelete.mutateAsync(selectedJobs)
      toast.success(`${selectedJobs.length} jobs deleted`)
      setSelectedJobs([])
      refetch()
    } catch {
      toast.error('Failed to delete jobs')
    }
  }

  const toggleSelect = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )
  }

  const toggleSelectAll = () => {
    if (!data?.jobs) return
    if (selectedJobs.length === data.jobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(data.jobs.map(j => j.id!).filter(Boolean))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
      </div>

      {data?.stats && (
        <div className="grid grid-cols-7 gap-4">
          <StatCard label="Total" value={data.stats.total} />
          <StatCard label="Waiting" value={data.stats.waiting} valueColor="warning" />
          <StatCard label="Active" value={data.stats.active} valueColor="info" />
          <StatCard label="Completed" value={data.stats.completed} valueColor="success" />
          <StatCard label="Failed" value={data.stats.failed} valueColor="danger" />
          <StatCard label="Error Rate" value={data.stats.errorRate} valueColor="danger" />
          <StatCard label="Avg Duration" value={data.stats.avgDuration ? `${data.stats.avgDuration}ms` : 'N/A'} />
        </div>
      )}

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
                </SelectContent>
              </Select>

              <Tabs value={status} onValueChange={setStatus}>
                <TabsList>
                  <TabsTrigger value="">All</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {selectedJobs.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <span className="text-sm">{selectedJobs.length} selected</span>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No jobs found
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_150px_100px_100px_100px_100px_80px] gap-4 text-sm text-muted-foreground font-medium px-2 py-1">
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedJobs.length === data?.jobs.length && data!.jobs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </div>
                  <div>Job ID</div>
                  <div>Queue</div>
                  <div>Status</div>
                  <div>Attempts</div>
                  <div>Created</div>
                  <div>Duration</div>
                  <div>Actions</div>
                </div>
                {data?.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="grid grid-cols-[40px_1fr_150px_100px_100px_100px_100px_80px] gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id!)}
                        onChange={() => toggleSelect(job.id!)}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <Link
                        to="#"
                        onClick={() => setDetailJob(job)}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {job.id}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.queue || 'N/A'}
                    </div>
                    <div>
                      <StatusBadge status={(status || 'waiting') as 'waiting' | 'active' | 'completed' | 'failed'} />
                    </div>
                    <div className="font-mono text-sm">
                      {job.attemptsMade || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelativeTime(job.timestamp)}
                    </div>
                    <div className="text-sm">
                      {job.processedOn && job.finishedOn
                        ? `${job.finishedOn - job.processedOn}ms`
                        : 'N/A'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDetailJob(job)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(job.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data?.total || 0)} of {data?.total}
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
                    disabled={(page * 20) >= (data?.total || 0)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <JobDetailSheet job={detailJob} onClose={() => setDetailJob(null)} />
    </div>
  )
}
