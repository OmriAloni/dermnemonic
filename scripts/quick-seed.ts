import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const USER_ID = 'c15d913b-82a4-4c55-bba0-8f4d72ef2798'

async function seed() {
  console.log('🌱 Quick seed starting...\n')

  try {
    // Step 1: Create user profile
    console.log('👤 Creating user profile...')
    const { error: userError } = await supabase.from('users').upsert({
      id: USER_ID,
      email: 'test@dermnemonic.com',
      display_name: 'ד״ר מאיה כהן',
      hospital: 'איכילוב',
      role: 'curator'
    })

    if (userError) {
      console.error('Error creating user profile:', userError)
    } else {
      console.log('  ✅ User profile created')
    }

    // Step 2: Create tags
    console.log('\n🏷️  Creating tags...')
    const tags = [
      { category: 'diagnosis', value: 'sweet-syndrome', value_he: 'Sweet\'s Syndrome' },
      { category: 'diagnosis', value: 'blueberry-muffin', value_he: 'Blueberry Muffin' },
      { category: 'diagnosis', value: 'lichen-planus', value_he: 'Lichen Planus' },
      { category: 'diagnosis', value: 'melanoma', value_he: 'מלנומה' },
      { category: 'pathology', value: 'neutrophilic-infiltrate', value_he: 'חדירה נויטרופילית' },
      { category: 'treatment', value: 'corticosteroids', value_he: 'קורטיקוסטרואידים' },
      { category: 'sign', value: 'purpura', value_he: 'פורפורה' },
      { category: 'sign', value: 'wickham-striae', value_he: 'קווי Wickham' },
      { category: 'aid_type', value: 'table', value_he: 'טבלה' },
      { category: 'aid_type', value: 'illustration', value_he: 'איור' },
      { category: 'aid_type', value: 'mnemonic', value_he: 'מנמוניק' },
      { category: 'aid_type', value: 'character', value_he: 'דמויות' }
    ]

    const { error: tagError } = await supabase
      .from('tags')
      .upsert(tags, { onConflict: 'category,value' })

    if (tagError) {
      console.error('Error creating tags:', tagError)
    } else {
      console.log(`  ✅ Created ${tags.length} tags`)
    }

    // Fetch tags for mapping
    const { data: allTags } = await supabase.from('tags').select('*')
    const tagMap = new Map(allTags?.map(t => [`${t.category}:${t.value}`, t.id]))

    // Step 3: Create learning aids
    console.log('\n📚 Creating learning aids...')

    const aids = [
      {
        title: '5 P\'s של Lichen Planus',
        body: 'Pruritic, Purple, Polygonal, Planar, Papules',
        explanation: 'חמשת ה-P\'s הקלאסיים לאבחון Lichen Planus. זכור את כל החמישה!',
        media_type: 'text-only',
        verified: true,
        pinned: false,
        tagKeys: ['diagnosis:lichen-planus', 'sign:wickham-striae', 'aid_type:mnemonic']
      },
      {
        title: 'Sweet\'s Syndrome - קריטריונים',
        body: 'Major: התחלה פתאומית + היסטופתולוגיה\nMinor: קדמה זיהום/חיסון + חום + לויקוציטוזיס + תגובה מצוינת לסטרואידים',
        explanation: 'נדרשים 2 קריטריונים major ו-2 minor לאבחנה',
        media_type: 'table',
        verified: true,
        pinned: true,
        tagKeys: ['diagnosis:sweet-syndrome', 'pathology:neutrophilic-infiltrate', 'treatment:corticosteroids', 'aid_type:table']
      },
      {
        title: 'ABCDE של מלנומה',
        body: 'Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolving',
        explanation: 'הכלל הקלאסי לזיהוי מלנומה. כל שינוי באחד מהקריטריונים מצריך בדיקה!',
        media_type: 'text-only',
        verified: true,
        pinned: false,
        tagKeys: ['diagnosis:melanoma', 'aid_type:mnemonic']
      },
      {
        title: 'Blueberry Muffin DDX',
        body: 'Hemolytic disease, Hemangiomas, CMV (PP65), Twin-twin transfusion',
        explanation: 'הדיפרנציאל המלא לתסמונת Blueberry Muffin Baby',
        media_type: 'illustration',
        verified: false,
        pinned: false,
        tagKeys: ['diagnosis:blueberry-muffin', 'sign:purpura', 'aid_type:illustration']
      }
    ]

    for (const aid of aids) {
      const { tagKeys, ...aidData } = aid

      // Insert learning aid
      const { data: insertedAid, error: aidError } = await supabase
        .from('learning_aids')
        .insert({
          ...aidData,
          uploader_id: USER_ID
        })
        .select()
        .single()

      if (aidError) {
        console.error(`Error creating "${aid.title}":`, aidError)
        continue
      }

      // Insert tags
      if (tagKeys && insertedAid) {
        const tagRelations = tagKeys
          .map(key => ({
            aid_id: insertedAid.id,
            tag_id: tagMap.get(key)
          }))
          .filter(rel => rel.tag_id)

        if (tagRelations.length > 0) {
          await supabase.from('learning_aid_tags').insert(tagRelations)
        }
      }

      console.log(`  ✅ ${aid.title}`)
    }

    console.log('\n✅ Seed completed!')
    console.log('🚀 Refresh http://localhost:3000 to see your learning aids!\n')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
