import { Queue } from 'bullmq'

const queueNames = ['report-generation', 'image-resize', 'payment-processing', 'email-notifications', 'analytics-events']

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
}

async function seed() {
  console.log('Seeding BullMQ queues...')

  for (const name of queueNames) {
    const queue = new Queue(name, { connection })

    for (let i = 0; i < Math.floor(Math.random() * 20) + 5; i++) {
      await queue.add(`${name}-job-${i}`, {
        data: `Job data for ${name} - ${i}`,
        index: i,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      })
    }

    const completed = Math.floor(Math.random() * 50) + 10
    const failed = Math.floor(Math.random() * 5)

    console.log(`Queue "${name}" created with ~${completed} completed and ~${failed} failed jobs`)
  }

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
