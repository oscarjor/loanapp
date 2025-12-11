import { router } from './trpc'
import { loanRouter } from './routers/loan'

/**
 * Main tRPC router
 */
export const appRouter = router({
  loan: loanRouter,
})

export type AppRouter = typeof appRouter
