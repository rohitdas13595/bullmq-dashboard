import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useQueue } from '@/hooks/useQueues'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Pause, Play, AlertTriangle } from 'lucide-react'

interface QueueDetailProps {
  live: boolean
}

export function QueueDetail({ live }: QueueDetailProps) {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const { data: queue, isLoading, refetch } = useQueue(name!, live)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(false)

  const [rateLimitMax, setRateLimitMax] = useState('')
  const [rateLimitDuration, setRateLimitDuration] = useState('')
  const [concurrency, setConcurrency] = useState('')

  const handlePause = async () => {
    if (!name) return
    setLoading(true)
    try {
      await apiClient.post(`/api/queues/${name}/pause`)
      setIsPaused(true)
      toast.success('Queue paused')
      refetch()
    } catch {
      toast.error('Failed to pause queue')
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    if (!name) return
    setLoading(true)
    try {
      await apiClient.post(`/api/queues/${name}/resume`)
      setIsPaused(false)
      toast.success('Queue resumed')
      refetch()
    } catch {
      toast.error('Failed to resume queue')
    } finally {
      setLoading(false)
    }
  }

  const handleDrain = async () => {
    if (!name) return
    if (!confirm('Are you sure you want to drain this queue? All waiting jobs will be removed.')) return
    setLoading(true)
    try {
      await apiClient.post(`/api/queues/${name}/drain`)
      toast.success('Queue drained')
      refetch()
    } catch {
      toast.error('Failed to drain queue')
    } finally {
      setLoading(false)
    }
  }

  const handleObliterate = async () => {
    if (!name) return
    if (!confirm('Are you sure you want to obliterate this queue? All jobs will be permanently deleted.')) return
    setLoading(true)
    try {
      await apiClient.post(`/api/queues/${name}/obliterate`)
      toast.success('Queue obliterated')
      navigate('/queues')
    } catch {
      toast.error('Failed to obliterate queue')
    } finally {
      setLoading(false)
    }
  }

  const handleSetRateLimit = async () => {
    if (!name) return
    try {
      await apiClient.put(`/api/queues/${name}/rate-limit`, {
        max: parseInt(rateLimitMax),
        duration: parseInt(rateLimitDuration),
      })
      toast.success('Rate limit set')
      setRateLimitMax('')
      setRateLimitDuration('')
    } catch {
      toast.error('Failed to set rate limit')
    }
  }

  const handleSetConcurrency = async () => {
    if (!name) return
    try {
      await apiClient.put(`/api/queues/${name}/concurrency`, {
        concurrency: parseInt(concurrency),
      })
      toast.success('Concurrency set')
      setConcurrency('')
    } catch {
      toast.error('Failed to set concurrency')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!queue) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Queue not found</p>
        </CardContent>
      </Card>
    )
  }

  const errorRate = queue.completed + queue.failed > 0
    ? ((queue.failed / (queue.completed + queue.failed)) * 100).toFixed(2) + '%'
    : '0.00%'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold font-mono text-primary">{name}</h1>
          <StatusBadge status={isPaused ? 'paused' : (queue.isPaused ? 'paused' : 'active')} />
        </div>
        <div className="flex items-center gap-2">
          {isPaused || queue.isPaused ? (
            <Button onClick={handleResume} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button onClick={handlePause} disabled={loading} variant="secondary">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={handleDrain} disabled={loading} variant="outline">
            Drain
          </Button>
          <Button onClick={handleObliterate} disabled={loading} variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Obliterate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Waiting" value={queue.waiting} valueColor="warning" />
        <StatCard label="Active" value={queue.active} valueColor="info" />
        <StatCard label="Completed" value={queue.completed} valueColor="success" />
        <StatCard label="Failed" value={queue.failed} valueColor="danger" />
        <StatCard label="Error Rate" value={errorRate} valueColor="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rate Limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Max</label>
                <Input
                  type="number"
                  value={rateLimitMax}
                  onChange={(e) => setRateLimitMax(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Duration (ms)</label>
                <Input
                  type="number"
                  value={rateLimitDuration}
                  onChange={(e) => setRateLimitDuration(e.target.value)}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetRateLimit}>Set</Button>
              <Button variant="outline">Clear</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Concurrency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Concurrency</label>
              <Input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
                placeholder="10"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetConcurrency}>Set</Button>
              <Button variant="outline">Clear</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
