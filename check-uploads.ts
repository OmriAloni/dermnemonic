import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Check latest learning aids
  const { data: aids } = await supabase
    .from('learning_aids')
    .select('id, title, media_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('📚 Latest Learning Aids:')
  aids?.forEach(aid => {
    console.log(`   - ${aid.title}`)
    console.log(`     URL: ${aid.media_url || 'No media'}`)
  })

  // Check storage
  const { data: files } = await supabase.storage
    .from('learning-aids')
    .list()

  console.log('\n📁 Storage Folders:', files?.length || 0)
  
  if (files && files.length > 0) {
    for (const folder of files) {
      const { data: folderFiles } = await supabase.storage
        .from('learning-aids')
        .list(folder.name)
      
      console.log(`   ${folder.name}/: ${folderFiles?.length || 0} files`)
      folderFiles?.forEach(f => console.log(`      - ${f.name}`))
    }
  }
}

check()
