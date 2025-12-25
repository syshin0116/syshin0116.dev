import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-side Supabase client with Service Role key
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS)
 * Only use this for admin operations on the server-side
 * 
 * To use this client, you must set SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
export function createServerClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This client is for server-side admin operations only.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// For convenience, export a function to check if service role is configured
export function hasServiceRoleKey(): boolean {
  return !!supabaseServiceRoleKey
}
