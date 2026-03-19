import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useRetryJob, useDeleteJob, type Job } from '@/hooks/useJobs'
import { toast } from 'sonner'
import { RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface JobDetailSheetProps {
  job: Job | null
  onClose: () => void
}

export function JobDetailSheet({ job, onClose }: JobDetailSheetProps) {
  const [showData, setShowData] = useState(false)
  const [showStacktrace, setShowStacktrace] = useState(false)

  const retryJob = useRetryJob()
  const deleteJob = useDeleteJob()

  const handleRetry = async () => {
    if (!job?.id) return
    try {
      await retryJob.mutateAsync(job.id)
      toast.success('Job retried')
      onClose()
    } catch {
      toast.error('Failed to retry job')
    }
  }

  const handleDelete = async () => {
    if (!job?.id) return
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await deleteJob.mutateAsync(job.id)
      toast.success('Job deleted')
      onClose()
    } catch {
      toast.error('Failed to delete job')
    }
  }

  if (!job) return null

  return (
    <Sheet open={!!job} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{job.id}</span>
          </SheetTitle>
          <SheetDescription>
            Job Details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{job.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Queue</p>
              <p className="font-mono text-sm">{job.queue || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attempts</p>
              <p className="font-medium">{job.attemptsMade || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-medium">
                {typeof job.progress === 'number' ? `${job.progress}%` : typeof job.progress === 'object' ? 'Object' : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium text-sm">
                {new Date(job.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="font-medium text-sm">
                {job.processedOn ? new Date(job.processedOn).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finished</p>
              <p className="font-medium text-sm">
                {job.finishedOn ? new Date(job.finishedOn).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium text-sm">
                {job.processedOn && job.finishedOn
                  ? `${job.finishedOn - job.processedOn}ms`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {job.failedReason && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Error Message</p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="font-mono text-sm text-destructive">{job.failedReason}</p>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowData(!showData)}
              className="flex items-center gap-2 text-sm font-medium mb-1"
            >
              Data
              {showData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showData && (
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(job.data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {job.returnvalue !== undefined && job.returnvalue !== null && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Return Value</p>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(job.returnvalue, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {job.stacktrace && job.stacktrace.length > 0 && (
            <div>
              <button
                onClick={() => setShowStacktrace(!showStacktrace)}
                className="flex items-center gap-2 text-sm font-medium mb-1"
              >
                Stack Trace
                {showStacktrace ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showStacktrace && (
                <div className="p-3 bg-muted rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {job.stacktrace.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {job.failedReason && (
              <Button onClick={handleRetry} disabled={retryJob.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Job
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
