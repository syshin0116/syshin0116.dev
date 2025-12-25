/**
 * Supabase Client Configuration
 * 
 * This module provides Supabase client instances for both client-side and server-side usage.
 * 
 * Usage:
 * ```typescript
 * // Client-side (in React components, hooks, etc.)
 * import { supabase } from '@/lib/supabase'
 * 
 * // Server-side admin operations (API routes, Server Components)
 * import { createServerClient } from '@/lib/supabase/server'
 * const supabaseAdmin = createServerClient()
 * ```
 */

export { supabase } from './client'
export { createServerClient, hasServiceRoleKey } from './server'
