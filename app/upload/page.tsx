'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image-utils'

export default function UploadPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    explanation: '',
    uploaderName: '',
    hospital: '',
    chapter: '',
    mediaType: '' as any,
    tags: [] as Array<{ category: string; value: string; value_he: string }>
  })

  // Fetch user profile and auto-fill uploader details
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('display_name, hospital')
            .eq('id', user.id)
            .single()

          if (profile) {
            setFormData(prev => ({
              ...prev,
              uploaderName: profile.display_name || '',
              hospital: profile.hospital || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadUserProfile()
  }, [])

  const [currentTag, setCurrentTag] = useState({
    category: '',
    value: '',
    value_he: ''
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (currentTag.category && currentTag.value) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag]
      })
      setCurrentTag({ category: '', value: '', value_he: '' })
    }
  }

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setUploadError(null)

    try {
      let mediaUrl = null

      // Upload image if selected
      if (selectedFile) {
        // Compress image before uploading (much faster!)
        setCompressing(true)
        const compressedFile = await compressImage(selectedFile)
        setCompressing(false)

        const uploadFormData = new FormData()
        uploadFormData.append('file', compressedFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          throw new Error('העלאת התמונה נכשלה. נסה שוב או בחר תמונה אחרת.')
        }

        const uploadData = await uploadResponse.json()
        mediaUrl = uploadData.url
      }

      // Create learning aid
      const response = await fetch('/api/aids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          media_url: mediaUrl,
          media_type: selectedFile ? formData.mediaType : 'text-only'
        })
      })

      if (response.ok) {
        setUploadSuccess(true)
        setTimeout(() => router.push('/'), 1500)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setUploadError(errorData.error || 'שגיאה בשמירת העזר למידה. אנא נסה שוב.')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      if (error instanceof Error) {
        setUploadError(error.message)
      } else if (typeof error === 'string') {
        setUploadError(error)
      } else {
        setUploadError('בעיית חיבור. בדוק את האינטרנט ונסה שוב.')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span>חזרה לפיד</span>
            </Link>
            <h1 className="text-xl font-bold">העלאת עזר למידה</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">העזר למידה פורסם בהצלחה!</p>
              <p className="text-sm text-green-700 dark:text-green-300">מעביר לעמוד הראשי...</p>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-3">
            <div className="text-2xl">❌</div>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">שגיאה בהעלאה</p>
              <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>פרטי עזר הלמידה</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              שדות המסומנים ב-<span className="text-destructive">*</span> הם שדות חובה
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">כותרת *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="למשל: 5 P's של Lichen Planus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">תוכן *</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Pruritic, Purple, Polygonal, Planar, Papules"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="explanation">הסבר מפורט (אופציונלי)</Label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="הסבר למה זה עובד, מתי להשתמש..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Uploader Info - Auto-filled from profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uploaderName" className="flex items-center gap-2">
                    שם מעלה
                    {loadingProfile && <span className="text-xs text-muted-foreground">(טוען...)</span>}
                    {!loadingProfile && formData.uploaderName && (
                      <span className="text-xs text-muted-foreground">(מתוך הפרופיל)</span>
                    )}
                  </Label>
                  <Input
                    id="uploaderName"
                    value={formData.uploaderName}
                    onChange={(e) => setFormData({ ...formData, uploaderName: e.target.value })}
                    placeholder="ד״ר שם משפחה"
                    disabled={loadingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital" className="flex items-center gap-2">
                    בית חולים
                    {!loadingProfile && formData.hospital && (
                      <span className="text-xs text-muted-foreground">(מתוך הפרופיל)</span>
                    )}
                  </Label>
                  <Select
                    value={formData.hospital}
                    onValueChange={(value) => setFormData({ ...formData, hospital: value || '' })}
                    disabled={loadingProfile}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.hospital || 'בחר בית חולים'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="איכילוב">איכילוב</SelectItem>
                      <SelectItem value="הדסה">הדסה</SelectItem>
                      <SelectItem value="שיבא">שיבא</SelectItem>
                      <SelectItem value="רמב״ם">רמב״ם</SelectItem>
                      <SelectItem value="בילינסון">בילינסון</SelectItem>
                      <SelectItem value="סורוקה">סורוקה</SelectItem>
                      <SelectItem value="אחר">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chapter and Aid Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter">פרק *</Label>
                  <Select
                    value={formData.chapter}
                    onValueChange={(value) => setFormData({ ...formData, chapter: value || '' })}
                    required
                  >
                    <SelectTrigger className="w-full whitespace-normal h-auto min-h-10">
                      <SelectValue>
                        {formData.chapter ? (() => {
                          const chapter = CHAPTERS.find(c => c.value === formData.chapter)
                          const text = chapter?.number ? `${chapter.number}. ${chapter.label_en}` : chapter?.label_en
                          return <span dir="ltr" className="block text-left">{text}</span>
                        })() : 'בחר פרק'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] w-[calc(100vw-2rem)] sm:w-[500px]">
                      {CHAPTERS.filter(c => c.value !== 'all').map((chapter) => (
                        <SelectItem
                          key={chapter.value}
                          value={chapter.value}
                          className="whitespace-normal h-auto py-2 leading-tight"
                        >
                          <span dir="ltr" className="block whitespace-normal break-words text-left">
                            {chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aidType">סוג עזר למידה *</Label>
                  <Select
                    value={formData.mediaType}
                    onValueChange={(value) => setFormData({ ...formData, mediaType: value || '' })}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue>
                        {formData.mediaType
                          ? AID_TYPES.find(t => t.value === formData.mediaType)?.label
                          : 'בחר סוג'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AID_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>תמונה (אופציונלי)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-40 sm:h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">לחץ להעלאת תמונה</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>תגיות</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Select
                    value={currentTag.category}
                    onValueChange={(value) => setCurrentTag({ ...currentTag, category: value || '' })}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] h-10">
                      <SelectValue>
                        {currentTag.category === 'diagnosis' && 'אבחנה'}
                        {currentTag.category === 'sign' && 'סימן קליני'}
                        {currentTag.category === 'pathology' && 'פתולוגיה'}
                        {currentTag.category === 'treatment' && 'טיפול'}
                        {currentTag.category === 'risk_factors' && 'גורמי סיכון'}
                        {!currentTag.category && 'קטגוריה'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagnosis">אבחנה</SelectItem>
                      <SelectItem value="sign">סימן קליני</SelectItem>
                      <SelectItem value="pathology">פתולוגיה</SelectItem>
                      <SelectItem value="treatment">טיפול</SelectItem>
                      <SelectItem value="risk_factors">גורמי סיכון</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="ערך (באנגלית)"
                    value={currentTag.value}
                    onChange={(e) => setCurrentTag({ ...currentTag, value: e.target.value })}
                    className="h-10"
                  />
                  <Input
                    placeholder="ערך (בעברית)"
                    value={currentTag.value_he}
                    onChange={(e) => setCurrentTag({ ...currentTag, value_he: e.target.value })}
                    className="h-10"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="h-10">
                    הוסף
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <span className="text-xs">
                          {tag.value_he || tag.value} ({tag.category})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={uploading || compressing || !formData.title || !formData.body || !formData.chapter || !formData.mediaType}
                  className="flex-1"
                >
                  {compressing ? 'מכווץ תמונה...' : uploading ? 'מעלה...' : 'פרסם עזר למידה'}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline">
                    ביטול
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
