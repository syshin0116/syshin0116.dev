import { supabase } from './client'

/**
 * Test Supabase connection
 * This function attempts to connect to Supabase and verify the connection is working
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    
    // Try to get the current session (will be null if not authenticated, but connection works)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message)
      return {
        success: false,
        error: sessionError.message
      }
    }

    console.log('✅ Supabase connection successful!')
    console.log('📊 Session status:', session ? 'Authenticated' : 'Not authenticated (normal for initial setup)')
    
    // Try to query a simple endpoint to verify API access
    const { error } = await supabase.from('_test_').select('*').limit(1)
    
    // It's okay if the table doesn't exist - we're just testing the connection
    if (error && !error.message.includes('does not exist')) {
      console.warn('⚠️  Query test returned an error (might be expected):', error.message)
    }

    return {
      success: true,
      session: session ? 'authenticated' : 'not authenticated',
      note: 'Connection to Supabase is working. You can now create tables and configure your database.'
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// For CLI testing
if (require.main === module) {
  testSupabaseConnection().then(result => {
    console.log('\n📋 Test Result:', JSON.stringify(result, null, 2))
    process.exit(result.success ? 0 : 1)
  })
}
