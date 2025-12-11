import { createAPIFileRoute } from '@tanstack/start/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../server/trpc/router'
import { createContext } from '../server/trpc/context'

export const Route = createAPIFileRoute('/api/trpc/$')({
  GET: async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext,
    })
  },
  POST: async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext,
    })
  },
})
