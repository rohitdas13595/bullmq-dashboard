import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { overview } from './routes/overview'
import { queues } from './routes/queues'
import { jobs } from './routes/jobs'
import { dlq } from './routes/dlq'
import { cron } from './routes/cron'
import { workers } from './routes/workers'
import { logs } from './routes/logs'
import { getRedisConfig, updateRedisConfig, getQueueNames, addQueue, removeQueue, discoverQueues } from './lib/redis'

const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/config', async (c) => {
  const config = getRedisConfig()
  const queues = await getQueueNames()
  return c.json({ 
    redis: config,
    queues
  })
})

app.post('/api/config', async (c) => {
  const body = await c.req.json<{ host: string; port: number; password: string }>()
  const redis = updateRedisConfig(body)
  
  try {
    await redis.ping()
    return c.json({ success: true, config: getRedisConfig() })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to connect to Redis' }, 500)
  }
})

app.get('/api/queue-names', async (c) => {
  const names = await getQueueNames()
  return c.json({ queues: names })
})

app.post('/api/queue-names', async (c) => {
  const body = await c.req.json<{ name: string }>()
  await addQueue(body.name)
  const names = await getQueueNames()
  return c.json({ success: true, queues: names })
})

app.delete('/api/queue-names/:name', async (c) => {
  const name = c.req.param('name')
  await removeQueue(name)
  const names = await getQueueNames()
  return c.json({ success: true, queues: names })
})

app.post('/api/discover-queues', async (c) => {
  const names = await discoverQueues()
  return c.json({ success: true, queues: names })
})

app.route('/api/overview', overview)
app.route('/api/queues', queues)
app.route('/api/jobs', jobs)
app.route('/api/dlq', dlq)
app.route('/api/cron', cron)
app.route('/api/workers', workers)
app.route('/api/logs', logs)

export { app }
