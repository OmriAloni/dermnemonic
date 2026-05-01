import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Submit or update a rating
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
    const { stars } = body

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Get authenticated user (fallback to test user for now)
    const fallbackUserId = 'c15d913b-82a4-4c55-bba0-8f4d72ef2798'
    const userId = fallbackUserId

    // Upsert rating (insert or update if exists)
    const { data: rating, error } = await supabase
      .from('ratings')
      .upsert(
        {
          aid_id: id,
          user_id: userId,
          stars: stars
        },
        {
          onConflict: 'aid_id,user_id'
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving rating:', error)
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('ratings')
      .select('stars')
      .eq('aid_id', id)

    const rating_avg = stats && stats.length > 0
      ? stats.reduce((sum, r) => sum + r.stars, 0) / stats.length
      : 0

    return NextResponse.json({
      rating,
      stats: {
        rating_avg,
        rating_count: stats?.length || 0
      }
    })
  } catch (error) {
    console.error('Error in POST /api/aids/[id]/ratings:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}

// Get user's rating for this aid
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json(null)
  }

  try {
    const supabase = getSupabaseAdmin()

    // Get authenticated user (fallback to test user for now)
    const fallbackUserId = 'c15d913b-82a4-4c55-bba0-8f4d72ef2798'
    const userId = fallbackUserId

    const { data: rating } = await supabase
      .from('ratings')
      .select('*')
      .eq('aid_id', id)
      .eq('user_id', userId)
      .single()

    return NextResponse.json(rating)
  } catch (error) {
    return NextResponse.json(null)
  }
}
