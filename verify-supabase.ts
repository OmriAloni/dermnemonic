import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
  console.log('📊 Checking Supabase database...\n')

  // Get all learning aids
  const { data: aids, error } = await supabase
    .from('learning_aids')
    .select(`
      id,
      title,
      body,
      media_type,
      verified,
      pinned,
      created_at,
      uploader:users!uploader_id (
        display_name,
        hospital
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${aids?.length || 0} learning aids in Supabase:\n`)

  aids?.forEach((aid, index) => {
    console.log(`${index + 1}. ${aid.title}`)
    console.log(`   📝 Body: ${aid.body?.substring(0, 50)}${aid.body?.length > 50 ? '...' : ''}`)
    console.log(`   👤 Uploader: ${aid.uploader?.display_name} (${aid.uploader?.hospital})`)
    console.log(`   ✓ Verified: ${aid.verified ? 'Yes' : 'No'}`)
    console.log(`   📌 Pinned: ${aid.pinned ? 'Yes' : 'No'}`)
    console.log(`   📅 Created: ${new Date(aid.created_at).toLocaleString('he-IL')}`)
    console.log('')
  })

  // Get tag count
  const { count: tagCount } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })

  console.log(`\n🏷️  Total tags: ${tagCount}`)

  // Get user count
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  console.log(`👥 Total users: ${userCount}`)
}

verify()
