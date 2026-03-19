import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface QueueSummary {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  isPaused: boolean
}

export function useQueues(live: boolean) {
  return useQuery({
    queryKey: ['queues'],
    queryFn: () => apiClient.get<QueueSummary[]>('/api/queues'),
    refetchInterval: live ? 2000 : false,
  })
}

export function useQueue(name: string, live: boolean) {
  return useQuery({
    queryKey: ['queue', name],
    queryFn: () => apiClient.get<QueueSummary>(`/api/queues/${name}`),
    refetchInterval: live ? 2000 : false,
    enabled: !!name,
  })
}
