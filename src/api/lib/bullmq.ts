import { Queue, type Job } from 'bullmq'
import { getRedisConfig, getQueueNames } from './redis'

let queues: Map<string, Queue> = new Map()

export async function refreshQueues(): Promise<void> {
  const names = await getQueueNames()
  const config = getRedisConfig()
  
  for (const [name, queue] of queues) {
    if (!names.includes(name)) {
      await queue.close()
      queues.delete(name)
    }
  }
  
  for (const name of names) {
    if (!queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: config.host,
          port: config.port,
          password: config.password,
        },
      })
      queues.set(name, queue)
    }
  }
}

export function getQueues(): Map<string, Queue> {
  return queues
}

export async function getQueue(name: string): Promise<Queue | null> {
  await refreshQueues()
  return queues.get(name) || null
}

export async function getQueueCounts(name: string) {
  const queue = await getQueue(name)
  if (!queue) return null
  
  const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed')
  return counts
}

export async function getAllQueueCounts() {
  await refreshQueues()
  const results = []
  
  for (const [name, queue] of queues) {
    try {
      const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed')
      const isPaused = await queue.isPaused()
      results.push({
        name,
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        isPaused,
      })
    } catch {
      results.push({
        name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        isPaused: false,
      })
    }
  }
  
  return results
}

export async function getJobs(name: string, status: string, start = 0, limit = 20): Promise<Job[]> {
  const queue = await getQueue(name)
  if (!queue) return []
  
  const statusType = status as 'waiting' | 'active' | 'completed' | 'failed'
  const jobs = await queue.getJobs(statusType, start, start + limit - 1)
  return jobs
}

export async function getJobCounts(queueName?: string) {
  await refreshQueues()
  
  if (queueName) {
    const queue = await getQueue(queueName)
    if (!queue) return { total: 0, waiting: 0, active: 0, completed: 0, failed: 0 }
    const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed')
    return {
      total: (counts.waiting || 0) + (counts.active || 0) + (counts.completed || 0) + (counts.failed || 0),
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    }
  }
  
  let total = 0, waiting = 0, active = 0, completed = 0, failed = 0
  
  for (const queue of queues.values()) {
    const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed')
    waiting += counts.waiting || 0
    active += counts.active || 0
    completed += counts.completed || 0
    failed += counts.failed || 0
    total += waiting + active + completed + failed
  }
  
  return { total, waiting, active, completed, failed }
}

export async function getAllJobs(status?: string): Promise<Job[]> {
  await refreshQueues()
  const allJobs: Job[] = []
  
  const statuses = status 
    ? [status as 'waiting' | 'active' | 'completed' | 'failed']
    : ['waiting', 'active', 'completed', 'failed'] as const
  
  for (const [name] of queues) {
    for (const s of statuses) {
      const jobs = await getJobs(name, s, 0, 50)
      allJobs.push(...jobs)
    }
  }
  
  return allJobs
}

export async function findJobById(jobId: string): Promise<{ job: Job; queueName: string } | null> {
  await refreshQueues()
  
  for (const [name, queue] of queues) {
    const job = await queue.getJob(jobId)
    if (job) {
      return { job, queueName: name }
    }
  }
  
  return null
}

export async function removeJob(jobId: string): Promise<boolean> {
  const found = await findJobById(jobId)
  if (found) {
    await found.job.remove()
    return true
  }
  return false
}

export async function retryJob(jobId: string): Promise<boolean> {
  const found = await findJobById(jobId)
  if (found) {
    await found.job.retry()
    return true
  }
  return false
}

export { Queue }
export type { Job }
