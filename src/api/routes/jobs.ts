import { Hono } from 'hono'
import { getJobs, getJobCounts, getAllJobs, findJobById, removeJob, retryJob, type Job } from '../lib/bullmq'

export const jobs = new Hono()

function jobToJSON(job: Job, queue?: string) {
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    opts: job.opts,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    returnvalue: job.returnvalue,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    timestamp: job.timestamp,
    queue,
  }
}

jobs.get('/', async (c) => {
  const queue = c.req.query('queue')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  
  let jobList: Job[] = []
  
  if (queue) {
    if (status) {
      jobList = await getJobs(queue, status, 0, limit)
    } else {
      const statuses = ['waiting', 'active', 'completed', 'failed'] as const
      for (const s of statuses) {
        const jobs = await getJobs(queue, s, 0, limit)
        jobList.push(...jobs)
      }
    }
  } else {
    jobList = await getAllJobs(status || undefined)
  }
  
  let filteredJobs = jobList
  
  if (search) {
    filteredJobs = jobList.filter(job => 
      job.id?.includes(search) || 
      job.name.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  const stats = await getJobCounts(queue || undefined)
  const errorRate = stats.total > 0 
    ? ((stats.failed / stats.total) * 100).toFixed(2) + '%'
    : '0.00%'
  
  const start = (page - 1) * limit
  const paginatedJobs = filteredJobs.slice(start, start + limit)
  
  return c.json({
    jobs: paginatedJobs.map(j => jobToJSON(j)),
    total: filteredJobs.length,
    stats: {
      ...stats,
      errorRate,
      avgDuration: 0,
    },
  })
})

jobs.get('/:id', async (c) => {
  const jobId = c.req.param('id')
  
  const result = await findJobById(jobId)
  if (result) {
    return c.json(jobToJSON(result.job, result.queueName))
  }
  
  return c.json({ error: 'Job not found' }, 404)
})

jobs.delete('/:id', async (c) => {
  const jobId = c.req.param('id')
  
  const success = await removeJob(jobId)
  if (success) {
    return c.json({ success: true })
  }
  
  return c.json({ error: 'Job not found' }, 404)
})

jobs.post('/:id/retry', async (c) => {
  const jobId = c.req.param('id')
  
  const success = await retryJob(jobId)
  if (success) {
    return c.json({ success: true })
  }
  
  return c.json({ error: 'Job not found' }, 404)
})

jobs.post('/bulk-delete', async (c) => {
  const body = await c.req.json<{ ids: string[] }>()
  const { ids } = body
  
  const results: { id: string; success: boolean }[] = []
  
  for (const id of ids) {
    const success = await removeJob(id)
    results.push({ id, success })
  }
  
  return c.json({ results })
})
