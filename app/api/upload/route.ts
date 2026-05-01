import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const USE_SUPABASE_STORAGE =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Use Supabase Storage if configured
    if (USE_SUPABASE_STORAGE) {
      console.log('Using Supabase Storage for upload')

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Get authenticated user from cookie
      const cookieStore = request.headers.get('cookie')
      const authSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // For service role, we need to manually parse the session
      // For now, use a fallback user ID
      const fallbackUserId = 'c15d913b-82a4-4c55-bba0-8f4d72ef2798'
      const userId = fallbackUserId

      console.log('Using user ID for upload:', userId)

      // Create unique filename with user ID folder
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const filename = `${userId}/${timestamp}.${fileExt}`

      console.log('Uploading to path:', filename)

      // Convert file to array buffer
      const bytes = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('learning-aids')
        .upload(filename, bytes, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return NextResponse.json({
          error: 'Failed to upload to storage',
          details: error.message
        }, { status: 500 })
      }

      console.log('Upload successful:', data.path)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('learning-aids')
        .getPublicUrl(filename)

      console.log('Public URL:', publicUrl)

      return NextResponse.json({
        url: publicUrl,
        filename: data.path
      })
    }

    // Fallback to local filesystem
    const { writeFile } = await import('fs/promises')
    const path = await import('path')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

    await writeFile(filepath, buffer)

    return NextResponse.json({
      url: `/uploads/${filename}`,
      filename
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
