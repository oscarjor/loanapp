 import { router } from '../trpc'
import { loanRouter } from './loan'

export const appRouter = router({
  loan: loanRouter,
})

export type AppRouter = typeof appRouter
