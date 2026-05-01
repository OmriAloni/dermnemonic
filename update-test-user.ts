import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateUser() {
  // Update the existing test user's profile  
  const { data, error } = await supabase
    .from('users')
    .update({
      display_name: 'ד״ר עומרי אלון',
      hospital: 'איכילוב',
      year_of_residency: 3
    })
    .eq('email', 'test@dermnemonic.com')
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Updated test user profile:', data)
  }
}

updateUser()
