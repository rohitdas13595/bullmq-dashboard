import { Hono } from 'hono'
import { getQueues } from '../lib/bullmq'

export const cron = new Hono()

cron.get('/', async (c) => {
  const queueName = c.req.query('queue')
  const search = c.req.query('search')
  
  const allCronJobs: {
    id: string
    name: string
    queue: string
    pattern: string
    next: number
    count: number
  }[] = []
  
  const queues = getQueues()
  
  if (queueName && queues.has(queueName)) {
    const queue = queues.get(queueName)
    if (queue) {
      try {
        const repeatableJobs = await queue.getRepeatableJobs()
        
        for (const rj of repeatableJobs) {
          const rjAny = rj as Record<string, unknown>
          allCronJobs.push({
            id: (rjAny.key as string) || `${queueName}-${rj.name}`,
            name: rj.name,
            queue: queueName,
            pattern: (rjAny.cron as string) || (rjAny.every as string) || '',
            next: (rjAny.nextDate as Date)?.getTime() || Date.now(),
            count: (rjAny.count as number) || 0,
          })
        }
      } catch {
        // Ignore errors
      }
    }
  } else {
    for (const [name, queue] of queues) {
      if (!queue) continue
      
      try {
        const repeatableJobs = await queue.getRepeatableJobs()
        
        for (const rj of repeatableJobs) {
          const rjAny = rj as Record<string, unknown>
          allCronJobs.push({
            id: (rjAny.key as string) || `${name}-${rj.name}`,
            name: rj.name,
            queue: name,
            pattern: (rjAny.cron as string) || (rjAny.every as string) || '',
            next: (rjAny.nextDate as Date)?.getTime() || Date.now(),
            count: (rjAny.count as number) || 0,
          })
        }
      } catch {
        // Ignore errors
      }
    }
  }
  
  let filteredJobs = allCronJobs
  if (search) {
    filteredJobs = allCronJobs.filter(job => 
      job.name.toLowerCase().includes(search.toLowerCase()) ||
      job.queue.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  let nextExecution = Infinity
  for (const job of filteredJobs) {
    if (job.next < nextExecution) {
      nextExecution = job.next
    }
  }
  
  const totalExecutions = filteredJobs.reduce((sum, job) => sum + job.count, 0)
  
  return c.json({
    total: filteredJobs.length,
    queues: new Set(filteredJobs.map(j => j.queue)).size,
    nextExecution: nextExecution === Infinity ? null : nextExecution - Date.now(),
    totalExecutions,
    jobs: filteredJobs,
  })
})
