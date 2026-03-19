import { Hono } from 'hono'

export const workers = new Hono()

workers.get('/', async (c) => {
  return c.json({
    workers: [],
    total: 0,
  })
})
