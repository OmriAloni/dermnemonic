import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const placeholderMnemonics = [
  {
    title: "5 P's of Lichen Planus",
    body: "Pruritic, Purple, Polygonal, Planar, Papules",
    explanation: "זכור את 5 ה-P's הקלאסיים של Lichen Planus. זה אחד המנמוניקים הכי שימושיים בדרמטולוגיה.",
    media_type: 'text-only' as const,
    verified: false,
    tags: {
      diagnosis: ['Lichen Planus'],
      pathology: ['wedge-shaped hypergranulosis'],
      aid_type: ['mnemonic']
    }
  },
  {
    title: "ABCDE של מלנומה",
    body: "Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolving",
    explanation: "כלל ABCDE עוזר לזהות נגעים חשודים למלנומה. כל נגע שעומד באחד מהקריטריונים הללו דורש בדיקה נוספת.",
    media_type: 'text-only' as const,
    verified: false,
    tags: {
      diagnosis: ['Melanoma'],
      aid_type: ['mnemonic']
    }
  },
  {
    title: "Sweet's Syndrome - קריטריונים דיאגנוסטיים",
    body: "Major: Abrupt onset + Histopathology consistent. Minor: Preceded by infection/vaccination/malignancy + Fever + Leukocytosis + Excellent response to corticosteroids",
    explanation: "צריך שני קריטריונים מז'וריים ושני קריטריונים מינוריים לאבחון Sweet's syndrome.",
    media_type: 'table' as const,
    verified: false,
    tags: {
      diagnosis: ['Neutrophilic Dermatoses'],
      pathology: ['neutrophilic infiltrate'],
      treatment: ['corticosteroids'],
      aid_type: ['table']
    }
  }
]

async function seed() {
  console.log('Starting seed...')

  // Create a test curator user (you'll need to sign up manually first)
  console.log('Seeding placeholder mnemonics...')

  for (const mnemonic of placeholderMnemonics) {
    const { tags, ...mnemonicData } = mnemonic

    // Insert learning aid
    const { data: aid, error: aidError } = await supabase
      .from('learning_aids')
      .insert({
        ...mnemonicData,
        uploader_id: '00000000-0000-0000-0000-000000000000' // placeholder, will be replaced
      })
      .select()
      .single()

    if (aidError) {
      console.error('Error inserting learning aid:', aidError)
      continue
    }

    console.log(`Created learning aid: ${aid.title}`)

    // Insert tags
    for (const [category, values] of Object.entries(tags)) {
      for (const value of values) {
        // First, ensure tag exists
        const { data: existingTag } = await supabase
          .from('tags')
          .select()
          .eq('category', category)
          .eq('value', value)
          .single()

        let tagId = existingTag?.id

        if (!existingTag) {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({ category, value })
            .select()
            .single()

          if (tagError) {
            console.error('Error creating tag:', tagError)
            continue
          }

          tagId = newTag.id
        }

        // Link tag to learning aid
        const { error: linkError } = await supabase
          .from('learning_aid_tags')
          .insert({ aid_id: aid.id, tag_id: tagId })

        if (linkError) {
          console.error('Error linking tag:', linkError)
        }
      }
    }
  }

  console.log('Seed completed!')
}

seed()
