import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const USE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     process.env.SUPABASE_SERVICE_ROLE_KEY &&
                     !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Get comments for a learning aid
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json([])
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!user_id (
          id,
          display_name,
          hospital,
          role
        )
      `)
      .eq('aid_id', id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Error in GET /api/aids/[id]/comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// Create a new comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { body: commentBody, parent_id } = body

    if (!commentBody || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    // Get authenticated user
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - please login' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const userId = user.id

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        aid_id: id,
        user_id: userId,
        body: commentBody,
        parent_id: parent_id || null
      })
      .select(`
        *,
        user:users!user_id (
          id,
          display_name,
          hospital,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in POST /api/aids/[id]/comments:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
