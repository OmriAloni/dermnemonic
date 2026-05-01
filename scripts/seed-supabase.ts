import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Step 1: Create test users
    console.log('👤 Creating test users...')

    const users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'maya@example.com',
        display_name: 'ד״ר מאיה כהן',
        hospital: 'איכילוב',
        role: 'verified_contributor'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'yossi@example.com',
        display_name: 'יוסי לוי',
        hospital: 'הדסה',
        year_of_residency: 3,
        role: 'contributor'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'sarah@example.com',
        display_name: 'ד״ר שרה אברהם',
        hospital: 'שיבא',
        role: 'verified_contributor'
      }
    ]

    for (const user of users) {
      const { error } = await supabase.from('users').insert(user)
      if (error && !error.message.includes('duplicate')) {
        console.error(`Error creating user ${user.display_name}:`, error)
      } else {
        console.log(`  ✅ ${user.display_name}`)
      }
    }

    // Step 2: Create tags
    console.log('\n🏷️  Creating tags...')

    const tags = [
      { category: 'diagnosis', value: 'sweet-syndrome', value_he: 'Sweet\'s Syndrome' },
      { category: 'diagnosis', value: 'blueberry-muffin', value_he: 'Blueberry Muffin' },
      { category: 'diagnosis', value: 'pediatric-dermatology', value_he: 'דרמטולוגיה ילדים' },
      { category: 'pathology', value: 'neutrophilic-infiltrate', value_he: 'חדירה נויטרופילית' },
      { category: 'treatment', value: 'corticosteroids', value_he: 'קורטיקוסטרואידים' },
      { category: 'sign', value: 'purpura', value_he: 'פורפורה' },
      { category: 'aid_type', value: 'table', value_he: 'טבלה' },
      { category: 'aid_type', value: 'illustration', value_he: 'איור' },
      { category: 'aid_type', value: 'mnemonic', value_he: 'מנמוניק' },
      { category: 'aid_type', value: 'character', value_he: 'דמויות' }
    ]

    const { data: insertedTags, error: tagError } = await supabase
      .from('tags')
      .upsert(tags, { onConflict: 'category,value' })
      .select()

    if (tagError) {
      console.error('Error creating tags:', tagError)
    } else {
      console.log(`  ✅ Created ${tags.length} tags`)
    }

    // Fetch all tags for reference
    const { data: allTags } = await supabase.from('tags').select('*')
    const tagMap = new Map(allTags?.map(t => [`${t.category}:${t.value}`, t.id]))

    // Step 3: Create learning aids
    console.log('\n📚 Creating learning aids...')

    const learningAids = [
      {
        id: '00000000-0000-0000-0000-000000000101',
        uploader_id: '00000000-0000-0000-0000-000000000001',
        title: 'Sweet\'s Syndrome - קריטריונים דיאגנוסטיים',
        body: 'Major: Abrupt onset + Histopathology consistent\nMinor: Preceded by infection/vaccination/malignancy + Fever + Leukocytosis + Excellent response to corticosteroids',
        explanation: 'צריך שני קריטריונים מז\'וריים ושני קריטריונים מינוריים לאבחון Sweet\'s syndrome. זכור: MAJOR vs minor - כמו בתמונה!',
        media_url: '/uploads/WhatsApp Image 2026-05-01 at 14.32.06.jpeg',
        media_type: 'summary-table',
        verified: true,
        pinned: false,
        tags: ['diagnosis:sweet-syndrome', 'pathology:neutrophilic-infiltrate', 'treatment:corticosteroids', 'aid_type:table']
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        uploader_id: '00000000-0000-0000-0000-000000000001',
        title: 'Blueberry Muffin DDX - דיפרנציאל',
        body: 'Hemolytic (כדוריות דם אדומות), Hemangiomas (המנגיומות), PP65 (CMV), Twin hemangiomas',
        explanation: 'דיפרנציאל לתסמונת Blueberry Muffin Baby - זכור את הממלכה של המאפינס! התמונה עוזרת לזכור את כל הגורמים.',
        media_url: '/uploads/WhatsApp Image 2026-05-01 at 14.34.24.jpeg',
        media_type: 'illustration',
        verified: true,
        pinned: true,
        tags: ['diagnosis:blueberry-muffin', 'sign:purpura', 'aid_type:illustration']
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        uploader_id: '00000000-0000-0000-0000-000000000002',
        title: 'כרטיסי לימוד ויזואליים - דוגמאות',
        body: 'שתי דוגמאות למנמוניקים ויזואליים יצירתיים: עיפרון + דבורה + קלף + כריש, ואננס במצוקה',
        explanation: 'הדוגמאות מראות איך אפשר להשתמש בדמויות וויזואליזציה כדי לזכור מושגים מורכבים. כל דמות מייצגת רעיון או סימן קליני.',
        media_url: '/uploads/WhatsApp Image 2026-05-01 at 14.37.04.jpeg',
        media_type: 'character',
        verified: false,
        pinned: false,
        tags: ['aid_type:character', 'aid_type:mnemonic']
      },
      {
        id: '00000000-0000-0000-0000-000000000104',
        uploader_id: '00000000-0000-0000-0000-000000000003',
        title: 'Morbus - גישה שיטתית לפי גיל',
        body: 'טוב יש לי ציור מורכב, חישוב שתדי״ק בפרטים. כשאני אומר על משהו שהוא קלאסי - הוא יחסוב מהראש ואז גם MCI/MI.',
        explanation: 'גישה שיטתית לאבחון דיפרנציאלי של נגעים עוריים בילדים לפי גיל. כולל התייחסות ל-HIV, WAX, PSOR ועוד.',
        media_url: '/uploads/WhatsApp Image 2026-05-01 at 14.39.01.jpeg',
        media_type: 'text-only',
        verified: true,
        pinned: false,
        tags: ['diagnosis:pediatric-dermatology', 'aid_type:mnemonic']
      }
    ]

    for (const aid of learningAids) {
      const { tags, ...aidData } = aid

      // Insert learning aid
      const { error: aidError } = await supabase
        .from('learning_aids')
        .insert(aidData)

      if (aidError && !aidError.message.includes('duplicate')) {
        console.error(`Error creating aid "${aid.title}":`, aidError)
        continue
      }

      // Insert tags
      if (tags) {
        const tagRelations = tags
          .map(tagKey => ({
            aid_id: aid.id,
            tag_id: tagMap.get(tagKey)
          }))
          .filter(rel => rel.tag_id)

        if (tagRelations.length > 0) {
          await supabase.from('learning_aid_tags').insert(tagRelations)
        }
      }

      console.log(`  ✅ ${aid.title}`)
    }

    console.log('\n✅ Seed completed successfully!')
    console.log('\n🚀 Open http://localhost:3000 to see your learning aids!')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
