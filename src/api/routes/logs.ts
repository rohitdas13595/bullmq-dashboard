import { Hono } from 'hono'

export const logs = new Hono()

logs.get('/', async (c) => {
  return c.json({
    logs: [],
    total: 0,
    levels: ['info', 'warn', 'error'],
  })
})
