import { Hono } from 'hono'
import { getRedis } from '../lib/redis'
import { getAllQueueCounts, getQueues } from '../lib/bullmq'

export const overview = new Hono()

overview.get('/', async (c) => {
  const redis = getRedis()
  
  try {
    const queueCounts = await getAllQueueCounts()
    
    let completed = 0, failed = 0, waiting = 0, active = 0
    const dlq = 0
    
    for (const q of queueCounts) {
      completed += q.completed
      failed += q.failed
      waiting += q.waiting
      active += q.active
    }
    
    const errorRate = completed + failed > 0 
      ? ((failed / (completed + failed)) * 100).toFixed(2) + '%'
      : '0.00%'
    
    const serverInfo = await redis.info('server')
    const uptimeMatch = serverInfo.match(/uptime_in_days:(\d+)/)
    const uptimeDays = uptimeMatch ? parseInt(uptimeMatch[1]) : 0
    
    const memoryInfo = await redis.info('memory')
    const usedMemMatch = memoryInfo.match(/used_memory:(\d+)/)
    const usedMemMb = usedMemMatch ? Math.round(parseInt(usedMemMatch[1]) / 1024 / 1024) : 0
    
    const recentJobs = []
    const queues = getQueues()
    
    for (const [name, queue] of queues) {
      try {
        const failedJobs = await queue.getFailed(0, 5)
        for (const job of failedJobs) {
          recentJobs.push({
            id: job.id,
            queue: name,
            status: 'failed',
            timestamp: job.failedReason ? Date.now() - 60000 : Date.now(),
            name: job.name,
          })
        }
      } catch {
        // Ignore errors
      }
    }
    
    recentJobs.sort((a, b) => b.timestamp - a.timestamp)
    
    return c.json({
      serverStatus: 'online',
      redisHost: getRedis().options.host || 'localhost',
      redisMemoryMb: usedMemMb,
      uptime: `${uptimeDays}d`,
      stats: {
        completed,
        failed,
        waiting,
        active,
        errorRate,
        dlq,
        pushPerSec: 0,
        pullPerSec: 0,
        queues: queueCounts.length,
        totalPushed: 0,
        apiKeys: 0,
        uptimeRaw: uptimeDays * 86400,
      },
      queueHealth: queueCounts.map(q => ({
        name: q.name,
        status: q.isPaused ? 'paused' : 'active',
        waiting: q.waiting,
        active: q.active,
        completed: q.completed,
        failed: q.failed,
      })),
      recentActivity: recentJobs.slice(0, 10).map(j => ({
        id: j.id,
        queue: j.queue,
        status: j.status,
        timestamp: j.timestamp,
        name: j.name,
      })),
    })
  } catch {
    return c.json({
      serverStatus: 'offline',
      redisHost: 'unknown',
      redisMemoryMb: 0,
      uptime: '0d',
      stats: {
        completed: 0,
        failed: 0,
        waiting: 0,
        active: 0,
        errorRate: '0.00%',
        dlq: 0,
        pushPerSec: 0,
        pullPerSec: 0,
        queues: 0,
        totalPushed: 0,
        apiKeys: 0,
        uptimeRaw: 0,
      },
      queueHealth: [],
      recentActivity: [],
    })
  }
})
