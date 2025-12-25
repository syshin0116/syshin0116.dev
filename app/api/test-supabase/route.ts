import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Test API endpoint to verify Supabase connection
 * 
 * Usage: GET /api/test-supabase
 */
export async function GET() {
  try {
    // Test 1: Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          hasUrl,
          hasKey
        }
      }, { status: 500 })
    }

    // Test 2: Try to get session (verifies auth endpoint)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Supabase Auth',
        details: sessionError.message
      }, { status: 500 })
    }

    // Test 3: Check database connection by querying system tables
    const { error: dbError } = await supabase
      .from('_test_')
      .select('*')
      .limit(1)

    // It's okay if table doesn't exist - we're just testing connection
    const dbStatus = dbError 
      ? (dbError.message.includes('does not exist') 
          ? 'connected (no tables yet)' 
          : `error: ${dbError.message}`)
      : 'connected'

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        authStatus: session ? 'authenticated' : 'not authenticated',
        databaseStatus: dbStatus,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during connection test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
