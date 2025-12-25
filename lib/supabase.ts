import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Dummy URL and key for when Supabase is not configured
const DUMMY_URL = 'https://placeholder.supabase.co'
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTU2MDAsImV4cCI6MTk2MDc3MTYwMH0.dummy'

// Supabase client for client-side operations
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || DUMMY_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DUMMY_KEY
)

// Supabase client with service role for server-side operations
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || DUMMY_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || DUMMY_KEY
)
