import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'

interface Log {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  queue?: string
}

interface LogsResponse {
  logs: Log[]
  total: number
  levels: string[]
}

interface LogsProps {
  live: boolean
}

export function Logs({ live }: LogsProps) {
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', level, search],
    queryFn: () => apiClient.get<LogsResponse>('/api/logs'),
    refetchInterval: live ? 2000 : false,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs</h1>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-[150px]">
                  {level || 'All Levels'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No logs found
            </p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {data?.logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-2 py-1.5 rounded hover:bg-muted/50"
                >
                  <span className="text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge
                    variant={
                      log.level === 'error' ? 'destructive' :
                      log.level === 'warn' ? 'warning' : 'secondary'
                    }
                    className="shrink-0"
                  >
                    {log.level}
                  </Badge>
                  {log.queue && (
                    <span className="text-primary shrink-0">{log.queue}</span>
                  )}
                  <span className={log.level === 'error' ? 'text-destructive' : ''}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
