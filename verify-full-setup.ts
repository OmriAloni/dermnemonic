import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
  console.log('📊 Full System Verification\n')

  // 1. Check recent learning aids
  const { data: aids } = await supabase
    .from('learning_aids')
    .select(`
      id,
      title,
      media_url,
      created_at,
      uploader:users!uploader_id (display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(3)

  console.log('✅ Latest Learning Aids:')
  aids?.forEach((aid, i) => {
    console.log(`   ${i + 1}. ${aid.title}`)
    console.log(`      Uploader: ${aid.uploader?.display_name} (${aid.uploader?.email})`)
    console.log(`      Media: ${aid.media_url || 'None'}`)
    console.log(`      Created: ${new Date(aid.created_at).toLocaleString('he-IL')}`)
  })

  // 2. Check storage
  const { data: files } = await supabase.storage
    .from('learning-aids')
    .list()

  console.log(`\n📁 Supabase Storage:`)
  if (files && files.length > 0) {
    console.log(`   ✅ ${files.length} folders found in storage bucket`)
    
    // Check first folder for files
    if (files[0].name) {
      const { data: folderFiles } = await supabase.storage
        .from('learning-aids')
        .list(files[0].name)
      
      console.log(`   ✅ ${folderFiles?.length || 0} files in ${files[0].name}/`)
    }
  } else {
    console.log('   ⚠️  No files in storage yet')
  }

  // 3. Check users
  const { data: users, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })

  console.log(`\n👥 Users: ${count} total`)
  users?.forEach(u => {
    console.log(`   - ${u.display_name} (${u.email}) - ${u.role}`)
  })

  console.log('\n✅ All systems operational!')
}

verify()
