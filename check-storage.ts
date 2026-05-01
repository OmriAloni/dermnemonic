import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage setup...\n')

  // 1. List buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError)
    return
  }

  console.log('📦 Storage Buckets:')
  buckets?.forEach(bucket => {
    console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
  })

  const learningAidsBucket = buckets?.find(b => b.name === 'learning-aids')
  
  if (!learningAidsBucket) {
    console.log('\n❌ "learning-aids" bucket not found!')
    console.log('Creating bucket...')
    
    const { error: createError } = await supabase.storage.createBucket('learning-aids', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    })
    
    if (createError) {
      console.error('Error creating bucket:', createError)
    } else {
      console.log('✅ Bucket created successfully')
    }
  } else {
    console.log('\n✅ "learning-aids" bucket exists')
  }

  // 2. Test upload
  console.log('\n🧪 Testing image upload...')
  
  const testData = Buffer.from('test image data')
  const testPath = 'test/test-image.jpg'
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('learning-aids')
    .upload(testPath, testData, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError)
  } else {
    console.log('✅ Upload test successful:', uploadData.path)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('learning-aids')
      .getPublicUrl(testPath)
    
    console.log('✅ Public URL:', publicUrl)
    
    // Clean up test file
    await supabase.storage.from('learning-aids').remove([testPath])
    console.log('🧹 Test file cleaned up')
  }
}

checkStorage()
