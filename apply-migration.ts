import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function applyMigration() {
  console.log('📦 Creating learning_aid_stats view...')

  // Execute the migration SQL
  const { data, error } = await supabase.rpc('exec', {
    sql: `
      CREATE OR REPLACE VIEW learning_aid_stats AS
      SELECT
        la.id AS aid_id,
        COALESCE(AVG(r.stars), 0) AS rating_avg,
        COUNT(DISTINCT r.id) AS rating_count,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT rx.id) AS reaction_count,
        COUNT(DISTINCT ssi.id) AS save_count
      FROM learning_aids la
      LEFT JOIN ratings r ON r.aid_id = la.id
      LEFT JOIN comments c ON c.aid_id = la.id
      LEFT JOIN reactions rx ON rx.aid_id = la.id
      LEFT JOIN study_set_items ssi ON ssi.aid_id = la.id
      GROUP BY la.id;
    `
  })

  if (error) {
    console.error('Error:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard > SQL Editor:')
    console.log('\nGo to: https://supabase.com/dashboard/project/pgzveeykjxpqwakazedc/sql/new')
    console.log('\nThen paste and run the migration from:')
    console.log('supabase/migrations/20260502000000_add_stats_view.sql')
    process.exit(1)
  }

  console.log('✅ Migration applied successfully!')
}

applyMigration()
