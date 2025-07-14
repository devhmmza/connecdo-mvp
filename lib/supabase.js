import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Database initialization and test function
export const initializeDatabase = async () => {
  try {
    const supabase = createClient()
    
    // Check if users table exists by trying to query it
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (userError && userError.code === 'PGRST116') {
      console.log('Database tables not found. Please create them using the SQL provided.')
      return false
    }
    
    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Database initialization error:', error)
    return false
  }
}