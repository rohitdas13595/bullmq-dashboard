import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface QueueHealth {
  name: string
  status: 'active' | 'paused'
  waiting: number
  active: number
  completed: number
  failed: number
}

export interface RecentActivity {
  id: string
  queue: string
  status: string
  timestamp: number
  name: string
}

export interface OverviewStats {
  completed: number
  failed: number
  waiting: number
  active: number
  errorRate: string
  dlq: number
  pushPerSec: number
  pullPerSec: number
  queues: number
  totalPushed: number
  apiKeys: number
  uptimeRaw: number
}

export interface OverviewData {
  serverStatus: 'online' | 'offline'
  redisHost: string
  redisMemoryMb: number
  uptime: string
  stats: OverviewStats
  queueHealth: QueueHealth[]
  recentActivity: RecentActivity[]
}

export function useOverview(live: boolean) {
  return useQuery({
    queryKey: ['overview'],
    queryFn: () => apiClient.get<OverviewData>('/api/overview'),
    refetchInterval: live ? 2000 : false,
  })
}
