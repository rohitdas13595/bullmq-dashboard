import { serve } from '@hono/node-server'
import { app } from './src/api/index'

const port = 3001

console.log(`BullMQ Dashboard API running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
