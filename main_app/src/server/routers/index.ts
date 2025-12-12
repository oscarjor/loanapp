import { router } from '../trpc'
import { loanRouter } from './loan'
import { chatRouter } from './chat'

export const appRouter = router({
  loan: loanRouter,
  chat: chatRouter,
})

export type AppRouter = typeof appRouter
