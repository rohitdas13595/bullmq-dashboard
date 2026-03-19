import { Hono } from 'hono'
import { getAllQueueCounts, getQueue } from '../lib/bullmq'

export const queues = new Hono()

queues.get('/', async (c) => {
  const queueCounts = await getAllQueueCounts()
  return c.json(queueCounts)
})

queues.get('/:name', async (c) => {
  const name = c.req.param('name')
  
  const queueCounts = await getAllQueueCounts()
  const queueData = queueCounts.find(q => q.name === name)
  
  if (!queueData) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  return c.json({
    ...queueData,
    rateLimit: null,
    concurrency: null,
  })
})

queues.post('/:name/pause', async (c) => {
  const name = c.req.param('name')
  const queue = await getQueue(name)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  await queue.pause()
  return c.json({ success: true })
})

queues.post('/:name/resume', async (c) => {
  const name = c.req.param('name')
  const queue = await getQueue(name)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  await queue.resume()
  return c.json({ success: true })
})

queues.post('/:name/drain', async (c) => {
  const name = c.req.param('name')
  const queue = await getQueue(name)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  await queue.drain()
  return c.json({ success: true })
})

queues.post('/:name/obliterate', async (c) => {
  const name = c.req.param('name')
  const queue = await getQueue(name)
  
  if (!queue) {
    return c.json({ error: 'Queue not found' }, 404)
  }
  
  await queue.obliterate({ force: true })
  return c.json({ success: true })
})

queues.put('/:name/rate-limit', async (c) => {
  const name = c.req.param('name')
  const body = await c.req.json<{ max: number; duration: number }>()
  
  return c.json({ success: true, queueName: name, rateLimit: body })
})

queues.put('/:name/concurrency', async (c) => {
  const name = c.req.param('name')
  const body = await c.req.json<{ concurrency: number }>()
  
  return c.json({ success: true, queueName: name, concurrency: body.concurrency })
})
