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
            year_of_residency,
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
