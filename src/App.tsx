import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Overview } from '@/pages/Overview'
import { Queues } from '@/pages/Queues'
import { QueueDetail } from '@/pages/QueueDetail'
import { Jobs } from '@/pages/Jobs'
import { DeadLetterQueue } from '@/pages/DeadLetterQueue'
import { CronJobs } from '@/pages/CronJobs'
import { Workers } from '@/pages/Workers'
import { Metrics } from '@/pages/Metrics'
import { Logs } from '@/pages/Logs'
import { Settings } from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function AppContent() {
  const [live, setLive] = useState(true)

  return (
    <AppShell live={live} onToggleLive={() => setLive(!live)}>
      <Routes>
        <Route path="/" element={<Overview live={live} />} />
        <Route path="/queues" element={<Queues live={live} />} />
        <Route path="/queues/:name" element={<QueueDetail live={live} />} />
        <Route path="/jobs" element={<Jobs live={live} />} />
        <Route path="/dlq" element={<DeadLetterQueue live={live} />} />
        <Route path="/cron" element={<CronJobs live={live} />} />
        <Route path="/workers" element={<Workers live={live} />} />
        <Route path="/metrics" element={<Metrics live={live} />} />
        <Route path="/logs" element={<Logs live={live} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/alerts" element={<div className="text-2xl font-bold">Alerts</div>} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
