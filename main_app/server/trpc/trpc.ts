import { initTRPC } from '@trpc/server'
import SuperJSON from 'superjson'
import type { Context } from './context'

/**
 * Initialize tRPC with context and transformers
 */
const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
})

export const router = t.router
export const publicProcedure = t.procedure
