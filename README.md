# BullMQ Dashboard

> ⚠️ **Work in Progress** - This project is under active development.

A modern, dark-themed dashboard for monitoring and managing BullMQ queues with Redis.

![BullMQ Dashboard](https://via.placeholder.com/800x400?text=BullMQ+Dashboard)

## Features

- **Real-time Monitoring** - Live stats with 2-second polling
- **Queue Management** - Pause, resume, drain, and obliterate queues
- **Job Explorer** - Browse, search, and manage jobs across all queues
- **Dead Letter Queue** - Track failed jobs and retry/purge actions
- **Cron Jobs** - View scheduled and repeatable jobs
- **Redis Configuration** - Configure connection from the dashboard UI
- **Auto-discovery** - Automatically detect queues from Redis
- **Dark Theme** - Modern bunqueue-style dark interface

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui-inspired components
- **Backend**: Hono.js, BullMQ
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- Redis server
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# Start the dashboard
npm run dev
```

### Development

```bash
# Start frontend only
npm run dev:client

# Start API server only
npm run dev:server

# Seed demo data
npm run seed
```

The dashboard will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3001

## Configuration

Configure Redis directly from the dashboard:

1. Go to **Settings**
2. Enter Redis host, port, and password
3. Click **Save & Connect**
4. Use **Discover Queues** to auto-detect queues from Redis

Configuration is persisted locally in `config.json`.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Overview | `/` | System health, queue stats, recent activity |
| Queues | `/queues` | List all queues with counts |
| Queue Detail | `/queues/:name` | Detailed queue view with actions |
| Jobs | `/jobs` | Browse and search all jobs |
| Dead Letter Queue | `/dlq` | Failed jobs management |
| Cron Jobs | `/cron` | Scheduled/repeatable jobs |
| Workers | `/workers` | Active workers |
| Metrics | `/metrics` | Performance charts |
| Logs | `/logs` | System logs |
| Settings | `/settings` | Redis config, appearance |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Get configuration |
| POST | `/api/config` | Update Redis config |
| GET | `/api/overview` | Dashboard overview stats |
| GET | `/api/queues` | List all queues |
| GET | `/api/queues/:name` | Queue details |
| POST | `/api/queues/:name/pause` | Pause queue |
| POST | `/api/queues/:name/resume` | Resume queue |
| POST | `/api/queues/:name/drain` | Drain queue |
| POST | `/api/queues/:name/obliterate` | Delete queue |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Job details |
| DELETE | `/api/jobs/:id` | Delete job |
| POST | `/api/jobs/:id/retry` | Retry job |
| GET | `/api/dlq` | DLQ overview |
| GET | `/api/dlq/:queue` | Queue DLQ jobs |
| POST | `/api/dlq/:queue/retry-all` | Retry all DLQ |
| DELETE | `/api/dlq/:queue/purge` | Purge DLQ |
| GET | `/api/cron` | List cron jobs |
| GET | `/api/queue-names` | Get tracked queues |
| POST | `/api/queue-names` | Add queue |
| DELETE | `/api/queue-names/:name` | Remove queue |
| POST | `/api/discover-queues` | Auto-discover queues |

## Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
QUEUE_NAMES=queue1,queue2,queue3
```

## License

MIT License - see [LICENSE](LICENSE) file.
