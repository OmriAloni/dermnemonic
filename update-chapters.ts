// Script to update existing learning aids with chapter information
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateChapters() {
  console.log('📦 Fetching learning aids without chapters...\n')

  // Get all aids that don't have a chapter
  const { data: aids, error } = await supabase
    .from('learning_aids')
    .select('id, title, body, chapter')
    .is('chapter', null)

  if (error) {
    console.error('❌ Error fetching aids:', error)
    return
  }

  if (!aids || aids.length === 0) {
    console.log('✅ All learning aids already have chapters!')
    return
  }

  console.log(`Found ${aids.length} learning aids without chapters:\n`)

  // Simple mapping based on keywords in title/body
  const chapterMapping: Record<string, string> = {
    'lichen planus': '11',
    'ליכן': '11',
    'psoriasis': '8',
    'פסוריאזיס': '8',
    'melanoma': '113',
    'מלנומה': '113',
    'urticaria': '18',
    'אורטיקריה': '18',
    'סרפדת': '18',
    'pemphigus': '29',
    'פמפיגוס': '29',
    'atopic': '12',
    'אטופ': '12',
    'sweet': '25',
    'neutrophilic': '25',
    'blueberry': '109', // Hemangiomas
  }

  let updatedCount = 0

  for (const aid of aids) {
    const searchText = (aid.title + ' ' + (aid.body || '')).toLowerCase()
    let foundChapter = null

    // Find matching chapter
    for (const [keyword, chapterValue] of Object.entries(chapterMapping)) {
      if (searchText.includes(keyword.toLowerCase())) {
        foundChapter = chapterValue
        break
      }
    }

    if (foundChapter) {
      console.log(`📝 Updating: "${aid.title}" → Chapter ${foundChapter}`)

      const { error: updateError } = await supabase
        .from('learning_aids')
        .update({ chapter: foundChapter })
        .eq('id', aid.id)

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError)
      } else {
        updatedCount++
        console.log(`   ✅ Updated!`)
      }
    } else {
      console.log(`⚠️  Skipped: "${aid.title}" (no keyword match)`)
    }
    console.log('')
  }

  console.log(`\n🎉 Done! Updated ${updatedCount} / ${aids.length} learning aids\n`)

  if (updatedCount < aids.length) {
    console.log('💡 Tip: You can manually update the remaining ones via Supabase dashboard')
    console.log('   or add more keywords to the chapterMapping in this script.\n')
  }
}

updateChapters().catch(console.error)
