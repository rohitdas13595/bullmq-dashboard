import Redis from 'ioredis'
import fs from 'fs'
import path from 'path'

let redis: Redis | null = null

interface RedisConfig {
  host: string
  port: number
  password: string
}

const CONFIG_FILE = path.join(process.cwd(), 'config.json')

function loadConfig(): RedisConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch {
    // Ignore errors
  }
  return {
    host: 'localhost',
    port: 6379,
    password: '',
  }
}

function saveConfig(config: RedisConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

let currentConfig = loadConfig()

const QUEUE_NAMES_KEY = 'bullmq:dashboard:queue_names'
const DEFAULT_QUEUES = ['report-generation', 'image-resize', 'payment-processing', 'email-notifications', 'analytics-events']

export function getRedisConfig(): RedisConfig {
  return { ...currentConfig }
}

export function updateRedisConfig(config: RedisConfig): Redis {
  currentConfig = { ...config }
  saveConfig(currentConfig)
  return createRedisConnection()
}

export function createRedisConnection(): Redis {
  if (redis) {
    redis.disconnect()
  }
  
  redis = new Redis({
    host: currentConfig.host,
    port: currentConfig.port,
    password: currentConfig.password || undefined,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 100, 3000)
    },
  })
  
  return redis
}

export function getRedis(): Redis {
  if (!redis) {
    redis = createRedisConnection()
  }
  return redis
}

export async function getQueueNames(): Promise<string[]> {
  const r = getRedis()
  try {
    const names = await r.smembers(QUEUE_NAMES_KEY)
    if (names.length === 0) {
      for (const q of DEFAULT_QUEUES) {
        await r.sadd(QUEUE_NAMES_KEY, q)
      }
      return DEFAULT_QUEUES
    }
    return names.sort()
  } catch {
    return DEFAULT_QUEUES
  }
}

export async function addQueue(name: string): Promise<void> {
  const r = getRedis()
  await r.sadd(QUEUE_NAMES_KEY, name)
}

export async function removeQueue(name: string): Promise<void> {
  const r = getRedis()
  await r.srem(QUEUE_NAMES_KEY, name)
}

export async function getAllQueueNamesFromRedis(): Promise<string[]> {
  const r = getRedis()
  try {
    const keys = await r.keys('bullmq:*')
    const queues = new Set<string>()
    
    for (const key of keys) {
      const match = key.match(/^bullmq:([^:]+):/)
      if (match) {
        queues.add(match[1])
      }
    }
    
    return Array.from(queues).sort()
  } catch {
    return []
  }
}

export async function discoverQueues(): Promise<string[]> {
  const tracked = await getQueueNames()
  const discovered = await getAllQueueNamesFromRedis()
  
  const allQueues = new Set([...tracked, ...discovered])
  const r = getRedis()
  for (const q of allQueues) {
    await r.sadd(QUEUE_NAMES_KEY, q)
  }
  
  return Array.from(allQueues).sort()
}

export async function refreshQueues(): Promise<void> {
  await getQueueNames()
}
