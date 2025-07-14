import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Get authenticated user helper
async function getAuthenticatedUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const supabase = createServerSupabaseClient()

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "Connecdo API - Where Problems Meet Solutions",
        version: "1.0.0"
      }))
    }

    // Authentication endpoints
    if (route === '/auth/signup' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: "User created successfully",
        user: data.user
      }))
    }

    if (route === '/auth/signin' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: "User signed in successfully",
        user: data.user,
        session: data.session
      }))
    }

    if (route === '/auth/signout' && method === 'POST') {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: "User signed out successfully"
      }))
    }

    if (route === '/auth/user' && method === 'GET') {
      try {
        const user = await getAuthenticatedUser(supabase)
        return handleCORS(NextResponse.json({ user }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        ))
      }
    }

    // User Profile endpoints
    if (route === '/users/profile' && method === 'POST') {
      try {
        const user = await getAuthenticatedUser(supabase)
        const body = await request.json()
        
        const { username, role, bio } = body
        
        if (!username || !role) {
          return handleCORS(NextResponse.json(
            { error: "Username and role are required" },
            { status: 400 }
          ))
        }

        const { data, error } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            username,
            role,
            bio: bio || '',
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({
          message: "Profile created successfully",
          profile: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    if (route === '/users/profile' && method === 'GET') {
      try {
        const user = await getAuthenticatedUser(supabase)
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({ profile: data }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    // Problems endpoints
    if (route === '/problems' && method === 'GET') {
      const { data, error } = await supabase
        .from('problems')
        .select(`
          *,
          users!problems_posted_by_fkey (username, email),
          solutions (id, builder_id)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json({ problems: data || [] }))
    }

    if (route === '/problems' && method === 'POST') {
      try {
        const user = await getAuthenticatedUser(supabase)
        const body = await request.json()
        
        const { title, description, tags } = body
        
        if (!title || !description) {
          return handleCORS(NextResponse.json(
            { error: "Title and description are required" },
            { status: 400 }
          ))
        }

        const { data, error } = await supabase
          .from('problems')
          .insert([{
            id: uuidv4(),
            title,
            description,
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
            posted_by: user.id,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({
          message: "Problem posted successfully",
          problem: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    if (route === '/problems/user' && method === 'GET') {
      try {
        const user = await getAuthenticatedUser(supabase)
        
        const { data, error } = await supabase
          .from('problems')
          .select(`
            *,
            solutions (id, builder_id, description, solution_url)
          `)
          .eq('posted_by', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 500 }
          ))
        }

        return handleCORS(NextResponse.json({ problems: data || [] }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    // Solutions endpoints
    if (route === '/solutions' && method === 'POST') {
      try {
        const user = await getAuthenticatedUser(supabase)
        const body = await request.json()
        
        const { problem_id, description, solution_url } = body
        
        if (!problem_id || !description) {
          return handleCORS(NextResponse.json(
            { error: "Problem ID and description are required" },
            { status: 400 }
          ))
        }

        const { data, error } = await supabase
          .from('solutions')
          .insert([{
            id: uuidv4(),
            problem_id,
            builder_id: user.id,
            description,
            solution_url: solution_url || '',
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({
          message: "Solution posted successfully",
          solution: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    if (route === '/solutions/user' && method === 'GET') {
      try {
        const user = await getAuthenticatedUser(supabase)
        
        const { data, error } = await supabase
          .from('solutions')
          .select(`
            *,
            problems (title, description, tags)
          `)
          .eq('builder_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 500 }
          ))
        }

        return handleCORS(NextResponse.json({ solutions: data || [] }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    // Discussions endpoints
    if (route === '/discussions' && method === 'GET') {
      const url = new URL(request.url)
      const problemId = url.searchParams.get('problem_id')
      
      if (!problemId) {
        return handleCORS(NextResponse.json(
          { error: "Problem ID is required" },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          users (username, email)
        `)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: true })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json({ discussions: data || [] }))
    }

    if (route === '/discussions' && method === 'POST') {
      try {
        const user = await getAuthenticatedUser(supabase)
        const body = await request.json()
        
        const { problem_id, message, parent_id } = body
        
        if (!problem_id || !message) {
          return handleCORS(NextResponse.json(
            { error: "Problem ID and message are required" },
            { status: 400 }
          ))
        }

        const { data, error } = await supabase
          .from('discussions')
          .insert([{
            id: uuidv4(),
            problem_id,
            user_id: user.id,
            parent_id: parent_id || null,
            message,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({
          message: "Comment posted successfully",
          discussion: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    // Bug reports / Contact endpoints
    if (route === '/contacts' && method === 'POST') {
      try {
        const user = await getAuthenticatedUser(supabase)
        const body = await request.json()
        
        const { name, subject, message } = body
        
        if (!subject || !message) {
          return handleCORS(NextResponse.json(
            { error: "Subject and message are required" },
            { status: 400 }
          ))
        }

        const { data, error } = await supabase
          .from('contacts')
          .insert([{
            id: uuidv4(),
            name: name || 'Anonymous',
            email: user.email,
            subject,
            message,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ))
        }

        return handleCORS(NextResponse.json({
          message: "Bug report submitted successfully",
          contact: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 401 }
        ))
      }
    }

    // Health check endpoint
    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'connecdo-api'
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute