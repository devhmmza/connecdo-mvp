import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
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

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const supabase = createClient()

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "Connecdo API - Where Problems Meet Solutions",
        version: "1.0.0"
      }))
    }

    // Health check endpoint
    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'connecdo-api'
      }))
    }

    // Test database connection
    if (route === '/test-db' && method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        if (error) {
          return handleCORS(NextResponse.json({
            status: 'error',
            message: 'Database tables not found. Please create them using the SQL provided.',
            error: error.message
          }, { status: 500 }))
        }

        return handleCORS(NextResponse.json({
          status: 'success',
          message: 'Database connection successful',
          data: data
        }))
      } catch (error) {
        return handleCORS(NextResponse.json({
          status: 'error',
          message: 'Database connection failed',
          error: error.message
        }, { status: 500 }))
      }
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