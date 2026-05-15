import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Export the raw URL + key so helpers can hit Edge Functions directly
// (e.g. vendor-login) without rebuilding the URL from scratch.
export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey

// `persistSession: true` is the default but we make it explicit — RLS
// depends on the auth session surviving page reloads so vendor writes
// continue to work after they refresh.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'streetlocal-vendor-session',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null
