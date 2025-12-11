import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/index'
import { createServer as createViteServer } from 'vite'

// Main server startup function
async function startServer() {
  const app = express()
  const PORT = process.env.PORT ?? 3000

  // Body parser middleware
  app.use(express.json())

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }
    next()
  })

  // tRPC middleware
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
    })
  )

  // Health check endpoint (before Vite middleware)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`)
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`)
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`)
    console.log(`\n✨ Open http://localhost:${PORT} in your browser\n`)
  })
}

startServer().catch(console.error)
