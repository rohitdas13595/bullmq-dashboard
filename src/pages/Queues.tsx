import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useQueues } from '@/hooks/useQueues'
import { Search, RefreshCw } from 'lucide-react'

interface QueuesProps {
  live: boolean
}

export function Queues({ live }: QueuesProps) {
  const { data: queues, isLoading, refetch } = useQueues(live)
  const [search, setSearch] = useState('')

  const filteredQueues = queues?.filter(q =>
    q.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Queues</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Queues</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredQueues?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No queues found
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground font-medium px-2 py-1">
                <div className="col-span-3">Queue Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-center">Waiting</div>
                <div className="col-span-1 text-center">Active</div>
                <div className="col-span-1 text-center">Completed</div>
                <div className="col-span-1 text-center">Failed</div>
                <div className="col-span-1 text-center">Delayed</div>
                <div className="col-span-2">Actions</div>
              </div>
              {filteredQueues?.map((queue) => (
                <Link
                  key={queue.name}
                  to={`/queues/${queue.name}`}
                  className="block"
                >
                  <div className="grid grid-cols-12 gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="col-span-3">
                      <span className="font-mono text-sm font-medium text-primary">
                        {queue.name}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={queue.isPaused ? 'paused' : 'active'} />
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="warning" className="font-mono">
                        {queue.waiting}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="info" className="font-mono">
                        {queue.active}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="success" className="font-mono">
                        {queue.completed}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="destructive" className="font-mono">
                        {queue.failed}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="font-mono text-sm">{queue.delayed}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        View
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
