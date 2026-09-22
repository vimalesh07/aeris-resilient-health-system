'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createBrowserSupabaseClient() {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv()
    client = createBrowserClient(url, publishableKey)
  }
  return client
}
