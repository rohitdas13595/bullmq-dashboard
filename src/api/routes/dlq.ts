import { Hono } from 'hono'
import { getAllQueueCounts, getJobs, getQueue } from '../lib/bullmq'
import type { Job } from '../lib/bullmq'

export const dlq = new Hono()

function getHealthLevel(count: number): 'Healthy' | 'Low' | 'Medium' | 'High' {
  if (count === 0) return 'Healthy'
  if (count < 10) return 'Low'
  if (count < 50) return 'Medium'
  return 'High'
}

function getTopReason(failedJobs: Job[]): string {
  const reasons: Record<string, number> = {}
  
  for (const job of failedJobs) {
    const reason = job.failedReason || 'Unknown error'
    reasons[reason] = (reasons[reason] || 0) + 1
  }
  
  let topReason = 'None'
  let maxCount = 0
  
  for (const [reason, count] of Object.entries(reasons)) {
    if (count > maxCount) {
      maxCount = count
      topReason = reason
    }
  }
  
  return topReason
}

dlq.get('/', async (c) => {
  const queueCounts = await getAllQueueCounts()
  
  const byQueue: Record<string, number> = {}
  let total = 0
  
  for (const q of queueCounts) {
    byQueue[q.name] = q.failed
    total += q.failed
  }
  
  const allFailedJobs: Job[] = []
  
  for (const q of queueCounts) {
    if (q.failed > 0) {
      const failedJobs = await getJobs(q.name, 'failed', 0, 1000)
      allFailedJobs.push(...failedJobs)
    }
  }
  
  const failureDistribution = []
  const reasons: Record<string, number> = {}
  
  for (const job of allFailedJobs) {
    const reason = job.failedReason || 'Unknown error'
    reasons[reason] = (reasons[reason] || 0) + 1
  }
  
  for (const [reason, count] of Object.entries(reasons)) {
    failureDistribution.push({ reason, count })
  }
  
  failureDistribution.sort((a, b) => b.count - a.count)
  
  return c.json({
    total,
    health: getHealthLevel(total),
    topReason: getTopReason(allFailedJobs),
    pendingRetry: 0,
    failureTypes: Object.keys(reasons).length,
    byQueue,
    failureDistribution: failureDistribution.slice(0, 10),
  })
})

dlq.get('/:queue', async (c) => {
  const queueName = c.req.param('queue')
  const reason = c.req.query('reason')
  const sort = c.req.query('sort') || 'newest'
  const search = c.req.query('search')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  
  const failedJobs = await getJobs(queueName, 'failed', 0, 1000)
  
  let filteredJobs = failedJobs
  
  if (reason) {
    filteredJobs = filteredJobs.filter(job => job.failedReason === reason)
  }
  
  if (search) {
    filteredJobs = filteredJobs.filter(job => 
      job.id?.includes(search) || 
      job.name.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  if (sort === 'oldest') {
    filteredJobs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
  } else {
    filteredJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  }
  
  const start = (page - 1) * limit
  const paginatedJobs = filteredJobs.slice(start, start + limit)
  
  return c.json({
    jobs: paginatedJobs.map(job => ({
      id: job.id,
      name: job.name,
      failedReason: job.failedReason,
      failedByReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      data: job.data,
      stacktrace: job.stacktrace,
    })),
    total: filteredJobs.length,
  })
})

dlq.post('/:queue/retry-all', async (c) => {
  const queueName = c.req.param('queue')
  const queue = await getQueue(queueName)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  const failedJobs = await getJobs(queueName, 'failed', 0, 1000)
  
  let retried = 0
  for (const job of failedJobs) {
    try {
      await job.retry()
      retried++
    } catch {
      // Ignore individual failures
    }
  }
  
  return c.json({ success: true, retried })
})

dlq.delete('/:queue/purge', async (c) => {
  const queueName = c.req.param('queue')
  const queue = await getQueue(queueName)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  await queue.clean(0, 10000, 'failed')
  
  return c.json({ success: true })
})

dlq.post('/:queue/:jobId/retry', async (c) => {
  const { queue: queueName, jobId } = c.req.param()
  const queue = await getQueue(queueName)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  const job = await queue.getJob(jobId)
  
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }
  
  await job.retry()
  
  return c.json({ success: true })
})
