import { db } from '../db/client'

/**
 * Creates context for tRPC procedures
 */
export const createContext = async () => {
  return {
    db,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
