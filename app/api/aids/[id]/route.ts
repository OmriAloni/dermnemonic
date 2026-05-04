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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseAdmin()

      const { data: aid, error } = await supabase
        .from('learning_aids')
        .select(`
          *,
          uploader:users!uploader_id (
            id,
            display_name,
            hospital,
            role
          ),
          tags:learning_aid_tags (
            tag:tags (
              id,
              category,
              value,
              value_he
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching learning aid:', error)
        return NextResponse.json({ error: 'Learning aid not found' }, { status: 404 })
      }

      // Calculate real stats
      const { data: ratings } = await supabase
        .from('ratings')
        .select('stars')
        .eq('aid_id', id)

      const rating_avg = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
        : 0

      const { count: comment_count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('aid_id', id)

      const { count: reaction_count } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('aid_id', id)

      const { count: save_count } = await supabase
        .from('study_set_items')
        .select('*', { count: 'exact', head: true })
        .eq('aid_id', id)

      // Transform tags and add stats
      const transformedAid = {
        ...aid,
        tags: aid.tags?.map((t: any) => t.tag).filter(Boolean) || [],
        stats: {
          rating_avg: Math.round(rating_avg * 10) / 10,
          rating_count: ratings?.length || 0,
          reaction_count: reaction_count || 0,
          comment_count: comment_count || 0,
          save_count: save_count || 0
        }
      }

      return NextResponse.json(transformedAid)
    } catch (error) {
      console.error('Error in GET /api/aids/[id]:', error)
      return NextResponse.json({ error: 'Failed to fetch learning aid' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Get authenticated user
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get the learning aid to check ownership
    const { data: aid, error: fetchError } = await supabase
      .from('learning_aids')
      .select('uploader_id')
      .eq('id', id)
      .single()

    if (fetchError || !aid) {
      return NextResponse.json({ error: 'Learning aid not found' }, { status: 404 })
    }

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is owner or curator
    const isOwner = aid.uploader_id === user.id
    const isCurator = currentUser?.role === 'curator'

    if (!isOwner && !isCurator) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete the learning aid (cascade will delete related tags, comments, etc.)
    const { error: deleteError } = await supabase
      .from('learning_aids')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting learning aid:', deleteError)
      return NextResponse.json({ error: 'Failed to delete learning aid' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/aids/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete learning aid' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Get authenticated user
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const updates = await request.json()
    const supabase = getSupabaseAdmin()

    // Get the learning aid to check ownership
    const { data: aid, error: fetchError } = await supabase
      .from('learning_aids')
      .select('uploader_id')
      .eq('id', id)
      .single()

    if (fetchError || !aid) {
      return NextResponse.json({ error: 'Learning aid not found' }, { status: 404 })
    }

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is owner or curator
    const isOwner = aid.uploader_id === user.id
    const isCurator = currentUser?.role === 'curator'

    if (!isOwner && !isCurator) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the learning aid (including media fields)
    const { data: updatedAid, error: updateError } = await supabase
      .from('learning_aids')
      .update({
        title: updates.title,
        body: updates.body,
        explanation: updates.explanation || null,
        chapter: updates.chapter || null,
        media_url: updates.media_url || null,
        media_type: updates.media_type || 'text-only',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating learning aid:', updateError)
      return NextResponse.json({ error: 'Failed to update learning aid' }, { status: 500 })
    }

    // Update tags if provided
    if (updates.tags && Array.isArray(updates.tags)) {
      // Delete existing tags
      await supabase
        .from('learning_aid_tags')
        .delete()
        .eq('aid_id', id)

      // Insert new tags
      if (updates.tags.length > 0) {
        const { data: upsertedTags } = await supabase
          .from('tags')
          .upsert(
            updates.tags.map((tag: any) => ({
              category: tag.category,
              value: tag.value,
              value_he: tag.value_he || null
            })),
            { onConflict: 'category,value' }
          )
          .select()

        if (upsertedTags) {
          const tagRelations = upsertedTags.map((tag: any) => ({
            aid_id: id,
            tag_id: tag.id
          }))
          await supabase.from('learning_aid_tags').insert(tagRelations)
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedAid })
  } catch (error) {
    console.error('Error in PUT /api/aids/[id]:', error)
    return NextResponse.json({ error: 'Failed to update learning aid' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!USE_SUPABASE) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Get authenticated user
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const updates = await request.json()
    const supabase = getSupabaseAdmin()

    // Get the learning aid to check ownership
    const { data: aid, error: fetchError } = await supabase
      .from('learning_aids')
      .select('uploader_id')
      .eq('id', id)
      .single()

    if (fetchError || !aid) {
      return NextResponse.json({ error: 'Learning aid not found' }, { status: 404 })
    }

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is owner or curator
    const isOwner = aid.uploader_id === user.id
    const isCurator = currentUser?.role === 'curator'

    if (!isOwner && !isCurator) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the learning aid
    const { data: updatedAid, error: updateError } = await supabase
      .from('learning_aids')
      .update({
        title: updates.title,
        body: updates.body,
        explanation: updates.explanation || null,
        chapter: updates.chapter || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating learning aid:', updateError)
      return NextResponse.json({ error: 'Failed to update learning aid' }, { status: 500 })
    }

    // Update tags if provided
    if (updates.tags && Array.isArray(updates.tags)) {
      // Delete existing tags
      await supabase
        .from('learning_aid_tags')
        .delete()
        .eq('aid_id', id)

      // Insert new tags
      if (updates.tags.length > 0) {
        const { data: upsertedTags } = await supabase
          .from('tags')
          .upsert(
            updates.tags.map((tag: any) => ({
              category: tag.category,
              value: tag.value,
              value_he: tag.value_he || null
            })),
            { onConflict: 'category,value' }
          )
          .select()

        if (upsertedTags) {
          const tagRelations = upsertedTags.map((tag: any) => ({
            aid_id: id,
            tag_id: tag.id
          }))
          await supabase.from('learning_aid_tags').insert(tagRelations)
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedAid })
  } catch (error) {
    console.error('Error in PATCH /api/aids/[id]:', error)
    return NextResponse.json({ error: 'Failed to update learning aid' }, { status: 500 })
  }
}
