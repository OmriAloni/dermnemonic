import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'learning-aids.json')
const USE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     process.env.SUPABASE_SERVICE_ROLE_KEY &&
                     !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

// Create Supabase admin client (bypasses RLS)
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

// Helper function to insert learning aid
async function insertLearningAid(supabase: any, newAid: any, userId: string) {
  // Insert learning aid
  const { data: insertedAid, error: aidError } = await supabase
    .from('learning_aids')
    .insert({
      uploader_id: userId,
      title: newAid.title,
      body: newAid.body,
      explanation: newAid.explanation || null,
      media_url: newAid.media_url || null,
      media_type: newAid.media_type || 'text-only',
      chapter: newAid.chapter || null,
      verified: false,
      pinned: false
    })
    .select()
    .single()

  if (aidError) {
    console.error('Error inserting learning aid:', aidError)
    console.error('Error details:', JSON.stringify(aidError, null, 2))
    throw new Error('Failed to insert learning aid')
  }

  // Insert tags if provided
  if (newAid.tags && newAid.tags.length > 0) {
    const { data: upsertedTags } = await supabase
      .from('tags')
      .upsert(
        newAid.tags.map((tag: any) => ({
          category: tag.category,
          value: tag.value,
          value_he: tag.value_he || null
        })),
        { onConflict: 'category,value' }
      )
      .select()

    if (upsertedTags) {
      const tagRelations = upsertedTags.map((tag: any) => ({
        aid_id: insertedAid.id,
        tag_id: tag.id
      }))
      await supabase.from('learning_aid_tags').insert(tagRelations)
    }
  }

  // Fetch complete aid
  const { data: completeAid } = await supabase
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
    .eq('id', insertedAid.id)
    .single()

  return completeAid
}

export async function GET() {
  // Use Supabase if configured, otherwise fall back to mock data
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseAdmin()

      // Fetch learning aids with uploader and tags
      const { data: aids, error } = await supabase
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'Failed to load learning aids' }, { status: 500 })
      }

      // Fetch all stats in one query
      const { data: statsData, error: statsError } = await supabase
        .from('learning_aid_stats')
        .select('*')

      if (statsError) {
        console.error('Stats error:', statsError)
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
      }

      // Create a map of aid_id -> stats for fast lookup
      const statsMap = new Map(
        (statsData || []).map(stat => [stat.aid_id, stat])
      )

      // Transform and merge (no async operations!)
      const transformedAids = (aids || []).map((aid) => {
        const stats = statsMap.get(aid.id) || {
          rating_avg: 0,
          rating_count: 0,
          comment_count: 0,
          reaction_count: 0,
          save_count: 0
        }

        return {
          ...aid,
          tags: aid.tags?.map((t: any) => t.tag).filter(Boolean) || [],
          stats: {
            rating_avg: Math.round(stats.rating_avg * 10) / 10,
            rating_count: stats.rating_count || 0,
            reaction_count: stats.reaction_count || 0,
            comment_count: stats.comment_count || 0,
            save_count: stats.save_count || 0
          }
        }
      })

      return NextResponse.json(transformedAids)
    } catch (error) {
      console.error('Error querying Supabase:', error)
      return NextResponse.json({ error: 'Failed to load learning aids' }, { status: 500 })
    }
  }

  // Fallback to mock data
  try {
    const fileContents = await fs.readFile(DATA_FILE, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data.aids)
  } catch (error) {
    console.error('Error reading learning aids:', error)
    return NextResponse.json({ error: 'Failed to load learning aids' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Use Supabase if configured
  if (USE_SUPABASE) {
    try {
      const newAid = await request.json()

      // Get authenticated user using the proper server client
      const supabaseAuth = await createServerClient()
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

      if (authError || !user) {
        console.log('Authentication failed:', authError?.message || 'No user')
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Use admin client to insert data (bypasses RLS)
      const supabase = getSupabaseAdmin()
      const result = await insertLearningAid(supabase, newAid, user.id)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error in POST /api/aids:', error)
      return NextResponse.json({ error: 'Failed to create learning aid' }, { status: 500 })
    }
  }


  // Fallback to file-based storage
  try {
    const newAid = await request.json()

    // Read current data
    const fileContents = await fs.readFile(DATA_FILE, 'utf8')
    const data = JSON.parse(fileContents)

    // Add new aid with auto-incrementing ID
    const aid = {
      ...newAid,
      id: String(data.nextId),
      created_at: new Date().toISOString(),
      uploader: {
        id: 'local-user',
        display_name: newAid.uploaderName || 'משתמש מקומי',
        hospital: newAid.hospital || '',
        role: 'contributor'
      },
      stats: {
        rating_avg: 0,
        rating_count: 0,
        reaction_count: 0,
        comment_count: 0,
        save_count: 0
      }
    }

    data.aids.unshift(aid) // Add to beginning
    data.nextId += 1

    // Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')

    return NextResponse.json(aid)
  } catch (error) {
    console.error('Error creating learning aid:', error)
    return NextResponse.json({ error: 'Failed to create learning aid' }, { status: 500 })
  }
}
