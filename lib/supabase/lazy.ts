'use client'

/** Loads the Supabase browser client on demand so it stays out of the startup bundle. */
export async function getBrowserSupabase() {
  const { createBrowserSupabaseClient } = await import('@/lib/supabase/browser')
  return createBrowserSupabaseClient()
}
