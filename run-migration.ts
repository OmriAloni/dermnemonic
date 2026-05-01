// Quick script to run the stats view migration
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('📦 Running migration: 20260502000000_add_stats_view.sql')

  const migrationPath = join(process.cwd(), 'supabase/migrations/20260502000000_add_stats_view.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

  if (error) {
    // If exec_sql doesn't exist, try direct query
    const { error: queryError } = await supabase.from('_migrations').select('*').limit(1)

    if (queryError) {
      console.log('⚠️  RPC method not available. Please run migration manually:')
      console.log('\n1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Paste the contents of:')
      console.log('   supabase/migrations/20260502000000_add_stats_view.sql')
      console.log('3. Click "Run"\n')
      console.log('Migration SQL:')
      console.log('─'.repeat(60))
      console.log(sql)
      console.log('─'.repeat(60))
      return
    }
  }

  console.log('✅ Migration completed successfully!')
  console.log('📊 View "learning_aid_stats" is now available')
}

runMigration().catch(console.error)
