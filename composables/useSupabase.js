import { createClient } from '@supabase/supabase-js'

let client = null

export function useSupabase() {
  const config = useRuntimeConfig()

  if (!client) {
    const url = config.public.supabaseUrl
    const key = config.public.supabaseKey

    if (!url || !key) {
      throw new Error('❌ Missing Supabase URL or Key in runtime config')
    }

    client = createClient(url, key)
  }

  return client
}