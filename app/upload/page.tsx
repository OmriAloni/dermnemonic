'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ArrowRight, Upload, X, Image as ImageIcon, ChevronsUpDown, Check, Bold, Italic, Underline } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CHAPTERS } from '@/lib/chapters'
import { AID_TYPES } from '@/lib/aid-types'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image-utils'

export const dynamic = 'force-dynamic'

function UploadPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingAid, setLoadingAid] = useState(!!editId)
  const [chapterPopoverOpen, setChapterPopoverOpen] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    explanation: '',
    uploaderName: '',
    hospital: '',
    chapter: '',
    tags: [] as Array<{ category: string; value: string; value_he: string }>
  })
  const [selectedAidTypes, setSelectedAidTypes] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [fileType, setFileType] = useState<'image' | 'document'>('image')
  const [currentTag, setCurrentTag] = useState({
    category: '',
    value: '',
    value_he: ''
  })

  // Fetch existing aid data when in edit mode
  useEffect(() => {
    async function loadAidData() {
      if (!editId) return

      try {
        const response = await fetch(`/api/aids/${editId}?minimal=true`)
        if (!response.ok) {
          throw new Error('Failed to load learning aid')
        }

        const aid = await response.json()

        // Pre-populate form with existing data
        setFormData({
          title: aid.title || '',
          body: aid.body || '',
          explanation: aid.explanation || '',
          uploaderName: aid.uploader?.display_name || '',
          hospital: aid.uploader?.hospital || '',
          chapter: aid.chapter || '',
          tags: aid.tags?.filter((t: any) => t.category !== 'aid_type') || []
        })

        // Set aid types
        const aidTypeTags = aid.tags?.filter((t: any) => t.category === 'aid_type').map((t: any) => t.value) || []
        setSelectedAidTypes(aidTypeTags)

        // Set image preview if exists
        if (aid.media_url) {
          setImagePreview(aid.media_url)
          // Determine file type from media_type
          if (aid.media_type === 'document') {
            setFileType('document')
          }
        }
      } catch (error) {
        console.error('Error loading aid data:', error)
        setUploadError('שגיאה בטעינת העזר למידה לעריכה')
      } finally {
        setLoadingAid(false)
      }
    }

    loadAidData()
  }, [editId])

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
            .select('display_name, hospital, role')
            .eq('id', user.id)
            .single()

          if (profile) {
            // Only auto-fill if not in edit mode (edit mode pre-fills from aid data)
            if (!editId) {
              setFormData(prev => ({
                ...prev,
                uploaderName: profile.display_name || '',
                hospital: profile.hospital || ''
              }))
            }
            setUserRole(profile.role || '')
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadUserProfile()
  }, [editId])

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

  const applyFormatting = (fieldId: 'body' | 'explanation', command: 'bold' | 'italic' | 'underline') => {
    const editor = document.getElementById(fieldId)
    if (!editor) return

    editor.focus()

    // Use document.execCommand to toggle formatting
    document.execCommand(command, false)

    // Update state with the new HTML content
    const content = editor.innerHTML
    setFormData({ ...formData, [fieldId]: content })

    // Trigger a custom event to ensure state sync
    editor.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setUploadError(null)

    try {
      let mediaUrl = imagePreview // Keep existing media URL if not uploading new file

      // Upload file if selected (new file)
      if (selectedFile) {
        let fileToUpload = selectedFile

        // Compress only if it's an image
        if (fileType === 'image') {
          setCompressing(true)
          fileToUpload = await compressImage(selectedFile)
          setCompressing(false)
        }

        const uploadFormData = new FormData()
        uploadFormData.append('file', fileToUpload)

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

      // Determine media type based on uploaded file
      let mediaType = 'text-only'
      if (mediaUrl) {
        if (selectedFile) {
          // New file uploaded
          mediaType = fileType === 'document' ? 'document' : 'illustration'
        } else {
          // Keep existing media type (infer from URL or default to illustration)
          mediaType = imagePreview?.includes('.pdf') ? 'document' : 'illustration'
        }
      }

      // Add aid_type tags
      const aidTypeTags = selectedAidTypes.map(type => ({
        category: 'aid_type',
        value: type,
        value_he: AID_TYPES.find(t => t.value === type)?.label || type
      }))

      // Create or update learning aid
      const url = editId ? `/api/aids/${editId}` : '/api/aids'
      const method = editId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          media_url: mediaUrl,
          media_type: mediaType,
          tags: [...formData.tags, ...aidTypeTags]
        })
      })

      if (response.ok) {
        setUploadSuccess(true)
        const redirectUrl = editId ? `/aid/${editId}` : '/'
        setTimeout(() => router.push(redirectUrl), 1500)
      } else {
        // Check for authentication error
        if (response.status === 401) {
          setUploadError('נדרש להתחבר כדי להעלות תוכן. אנא התחבר ונסה שוב.')
          // Redirect to login after 2 seconds
          setTimeout(() => {
            const returnUrl = editId ? `/upload?edit=${editId}` : '/upload'
            router.push(`/auth/login?returnUrl=${returnUrl}`)
          }, 2000)
          return
        }

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

  const backUrl = editId ? `/aid/${editId}` : '/'
  const backText = editId ? 'חזרה לכרטיס' : 'חזרה לפיד'
  const pageTitle = editId ? 'עריכת עזר למידה' : 'העלאת עזר למידה'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={backUrl} className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span>{backText}</span>
            </Link>
            <h1 className="text-xl font-bold">{pageTitle}</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {uploadSuccess && (
          <div dir="rtl" className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">העזר למידה פורסם בהצלחה!</p>
              <p className="text-sm text-green-700 dark:text-green-300">מעביר לעמוד הראשי...</p>
            </div>
          </div>
        )}

        {uploadError && (
          <div dir="rtl" className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-3">
            <div className="text-2xl">❌</div>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">שגיאה בהעלאה</p>
              <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
            </div>
          </div>
        )}

        {loadingAid && (
          <div dir="rtl" className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-center text-muted-foreground">טוען נתונים לעריכה...</p>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body">תוכן *</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('body', 'bold')}
                        className="h-7 px-2"
                        title="הדגש טקסט (בחר טקסט ולחץ)"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('body', 'italic')}
                        className="h-7 px-2"
                        title="טקסט נטוי (בחר טקסט ולחץ)"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('body', 'underline')}
                        className="h-7 px-2"
                        title="טקסט מודגש בקו תחתון (בחר טקסט ולחץ)"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    id="body"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const content = e.currentTarget.innerHTML
                      setFormData({ ...formData, body: content })
                    }}
                    onBlur={(e) => {
                      const content = e.currentTarget.innerHTML
                      setFormData({ ...formData, body: content })
                    }}
                    dangerouslySetInnerHTML={{ __html: formData.body }}
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ minHeight: '100px' }}
                    data-placeholder="Pruritic, Purple, Polygonal, Planar, Papules"
                  />
                  <p className="text-xs text-muted-foreground">
                    טיפ: בחר טקסט ולחץ על הכפתורים לעיצוב (מודגש, נטוי, קו תחתון)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="explanation">הסבר מפורט (אופציונלי)</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('explanation', 'bold')}
                        className="h-7 px-2"
                        title="הדגש טקסט (בחר טקסט ולחץ)"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('explanation', 'italic')}
                        className="h-7 px-2"
                        title="טקסט נטוי (בחר טקסט ולחץ)"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('explanation', 'underline')}
                        className="h-7 px-2"
                        title="טקסט מודגש בקו תחתון (בחר טקסט ולחץ)"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    id="explanation"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const content = e.currentTarget.innerHTML
                      setFormData({ ...formData, explanation: content })
                    }}
                    onBlur={(e) => {
                      const content = e.currentTarget.innerHTML
                      setFormData({ ...formData, explanation: content })
                    }}
                    dangerouslySetInnerHTML={{ __html: formData.explanation }}
                    className="min-h-[75px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ minHeight: '75px' }}
                    data-placeholder="הסבר למה זה עובד, מתי להשתמש..."
                  />
                  <p className="text-xs text-muted-foreground">
                    טיפ: בחר טקסט ולחץ על הכפתורים לעיצוב (מודגש, נטוי, קו תחתון)
                  </p>
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
                  <Label htmlFor="chapter">פרק</Label>
                  <Popover open={chapterPopoverOpen} onOpenChange={(open) => {
                    setChapterPopoverOpen(open)
                    if (!open) setChapterSearch('')
                  }}>
                    <PopoverTrigger
                      className="w-full justify-between h-auto min-h-10 font-normal whitespace-normal text-left flex items-center rounded-md border border-input bg-background px-3 py-2 text-base hover:bg-accent hover:text-accent-foreground"
                      role="combobox"
                      aria-expanded={chapterPopoverOpen}
                    >
                        <span className="flex-1 overflow-hidden">
                          {formData.chapter ? (() => {
                            const chapter = CHAPTERS.find(c => c.value === formData.chapter)
                            const text = chapter?.number ? `${chapter.number}. ${chapter.label_en}` : chapter?.label_en
                            return <span dir="ltr" className="block text-left break-words">{text}</span>
                          })() : <span className="text-muted-foreground">ללא פרק</span>}
                        </span>
                        {formData.chapter && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData({ ...formData, chapter: '' })
                            }}
                            className="ms-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="חפש פרק..."
                          value={chapterSearch}
                          onValueChange={setChapterSearch}
                        />
                        <CommandList>
                          <CommandEmpty>לא נמצאו פרקים</CommandEmpty>
                          <CommandGroup>
                            {CHAPTERS.filter(c => c.value !== 'all')
                              .filter(chapter => {
                                if (!chapterSearch) return true
                                const text = chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en
                                return text.toLowerCase().includes(chapterSearch.toLowerCase())
                              })
                              .map((chapter, index) => {
                                const text = chapter.number ? `${chapter.number}. ${chapter.label_en}` : chapter.label_en
                                return (
                                  <CommandItem
                                    key={chapter.value}
                                    value={text}
                                    onSelect={() => {
                                      setFormData({ ...formData, chapter: chapter.value })
                                      setChapterSearch('')
                                      setChapterPopoverOpen(false)
                                    }}
                                    className="gap-2"
                                    ref={(el) => {
                                      if (index === 0 && chapterSearch && el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                      }
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${formData.chapter === chapter.value ? 'opacity-100' : 'opacity-0'}`} />
                                    <span dir="ltr" className="flex-1 text-left">{text}</span>
                                  </CommandItem>
                                )
                              })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aidType">סוגי עזר למידה * (ניתן לבחור מספר)</Label>
                  <div className="flex flex-wrap gap-2">
                    {AID_TYPES.map((type) => {
                      const isSelected = selectedAidTypes.includes(type.value)
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAidTypes(selectedAidTypes.filter(t => t !== type.value))
                            } else {
                              setSelectedAidTypes([...selectedAidTypes, type.value])
                            }
                          }}
                          className="h-9"
                        >
                          {isSelected && <Check className="me-1 h-4 w-4" />}
                          {type.label}
                        </Button>
                      )
                    })}
                  </div>
                  {selectedAidTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground">בחר לפחות סוג אחד</p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>קובץ (אופציונלי)</Label>
                  {userRole === 'curator' && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={fileType === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setFileType('image')
                          setSelectedFile(null)
                          setImagePreview(null)
                        }}
                        className="h-8 text-xs"
                      >
                        תמונה
                      </Button>
                      <Button
                        type="button"
                        variant={fileType === 'document' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setFileType('document')
                          setSelectedFile(null)
                          setImagePreview(null)
                        }}
                        className="h-8 text-xs"
                      >
                        מסמך
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="file"
                    accept={fileType === 'image' ? 'image/*' : '.pdf,.doc,.docx'}
                    onChange={handleImageChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
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
                    ) : selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        {fileType === 'image' ? (
                          <>
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">לחץ להעלאת תמונה</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">לחץ להעלאת מסמך (PDF, DOC)</span>
                          </>
                        )}
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
                        {currentTag.category === 'sign' && 'תסמינים'}
                        {currentTag.category === 'pathology' && 'פתולוגיה'}
                        {currentTag.category === 'treatment' && 'טיפול'}
                        {currentTag.category === 'risk_factors' && 'גורמי סיכון'}
                        {!currentTag.category && 'קטגוריה'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagnosis">אבחנה</SelectItem>
                      <SelectItem value="sign">תסמינים</SelectItem>
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
                  disabled={uploading || compressing || !formData.title || !formData.body || selectedAidTypes.length === 0}
                  className="flex-1"
                >
                  {compressing ? 'מכווץ תמונה...' : uploading ? 'מעלה...' : 'פרסם עזר למידה'}
                </Button>
                <Link href={backUrl}>
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

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  )
}

