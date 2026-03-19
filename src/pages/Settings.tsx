import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RedisConfig {
  host: string
  port: number
  password: string
}

export function Settings() {
  const [config, setConfig] = useState<RedisConfig>({
    host: 'localhost',
    port: 6379,
    password: '',
  })
  const [queues, setQueues] = useState<string[]>([])
  const [newQueueName, setNewQueueName] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config')
      const data = await response.json()
      if (data.redis) {
        setConfig(data.redis)
      }
      if (data.queues) {
        setQueues(data.queues)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Configuration saved and connected!')
        await loadConfig()
      } else {
        toast.error(data.error || 'Failed to connect to Redis')
      }
    } catch {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Connection successful!')
      } else {
        toast.error(data.error || 'Connection failed')
      }
    } catch {
      toast.error('Connection failed - check if API server is running')
    } finally {
      setTesting(false)
    }
  }

  const handleAddQueue = async () => {
    if (!newQueueName.trim()) return
    
    try {
      const response = await fetch('/api/queue-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQueueName.trim() }),
      })
      const data = await response.json()
      
      if (data.success) {
        setQueues(data.queues)
        setNewQueueName('')
        toast.success('Queue added')
      }
    } catch {
      toast.error('Failed to add queue')
    }
  }

  const handleRemoveQueue = async (name: string) => {
    if (!confirm(`Remove "${name}" from tracking?`)) return
    
    try {
      const response = await fetch(`/api/queue-names/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (data.success) {
        setQueues(data.queues)
        toast.success('Queue removed')
      }
    } catch {
      toast.error('Failed to remove queue')
    }
  }

  const handleDiscoverQueues = async () => {
    try {
      const response = await fetch('/api/discover-queues', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        setQueues(data.queues)
        toast.success(`Discovered ${data.queues.length} queues`)
      }
    } catch {
      toast.error('Failed to discover queues')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Redis Connection</CardTitle>
          <CardDescription>Configure your Redis connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Host</label>
            <Input
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Port</label>
            <Input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 6379 })}
              placeholder="6379"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="Leave empty if no password"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Connect'}
            </Button>
            <Button onClick={handleTestConnection} variant="outline" disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tracked Queues</CardTitle>
          <CardDescription>Manage which queues to track and display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              placeholder="Enter queue name..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddQueue()}
            />
            <Button onClick={handleAddQueue}>Add</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(queues || []).map((queue) => (
              <Badge key={queue} variant="secondary" className="gap-2 pr-1">
                <span className="font-mono">{queue}</span>
                <button
                  onClick={() => handleRemoveQueue(queue)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          
          {(!queues || queues.length === 0) && (
            <p className="text-sm text-muted-foreground">No queues tracked. Add one or discover from Redis.</p>
          )}
          
          <Button onClick={handleDiscoverQueues} variant="outline" className="mt-2">
            Discover Queues from Redis
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the dashboard appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Theme</label>
            <div className="flex gap-2">
              <Button variant="secondary">Dark</Button>
              <Button variant="outline">Light</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Polling</CardTitle>
          <CardDescription>Configure data refresh settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Polling Interval (ms)</label>
            <Input type="number" defaultValue="2000" />
          </div>
          <p className="text-sm text-muted-foreground">
            How often the dashboard will fetch new data when Live mode is enabled.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
