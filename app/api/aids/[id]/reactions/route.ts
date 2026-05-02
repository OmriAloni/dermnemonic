import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET reactions for a learning aid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: aidId } = await params

    // Get all reactions for this aid
    const { data: reactions, error } = await supabase
      .from('reactions')
      .select('reaction_type, user_id')
      .eq('aid_id', aidId)

    if (error) {
      console.error('Error fetching reactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count reactions by type
    const counts = {
      heart: 0,
      brain: 0,
      lightbulb: 0,
      laugh: 0
    }

    reactions?.forEach((reaction) => {
      const type = reaction.reaction_type as keyof typeof counts
      if (type in counts) {
        counts[type]++
      }
    })

    // Get current user's reactions
    const { data: { user } } = await supabase.auth.getUser()
    const userReactions = user
      ? reactions?.filter(r => r.user_id === user.id).map(r => r.reaction_type) || []
      : []

    return NextResponse.json({
      counts,
      userReactions
    })
  } catch (error) {
    console.error('Error in GET /api/aids/[id]/reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/DELETE a reaction (toggle)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: aidId } = await params
    const body = await request.json()
    const { reaction_type } = body

    // Validate reaction type
    const validTypes = ['heart', 'brain', 'lightbulb', 'laugh']
    if (!validTypes.includes(reaction_type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already reacted with this type
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('aid_id', aidId)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .single()

    if (existing) {
      // Remove reaction (toggle off)
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ action: 'removed', reaction_type })
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('reactions')
        .insert({
          aid_id: aidId,
          user_id: user.id,
          reaction_type
        })

      if (insertError) {
        console.error('Error inserting reaction:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ action: 'added', reaction_type })
    }
  } catch (error) {
    console.error('Error in POST /api/aids/[id]/reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
