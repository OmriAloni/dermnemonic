'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    hospital: ''
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            display_name: formData.displayName,
            hospital: formData.hospital || null,
            role: 'contributor'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError('נוצר חשבון אך הפרופיל לא נשמר. אנא פנה לתמיכה.')
          return
        }

        router.push('/auth/success')
      }
    } catch (err) {
      setError('שגיאה בהרשמה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">הרשמה</CardTitle>
          <CardDescription className="text-center">
            צור חשבון חדש כדי להצטרף לקהילה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">שם מלא *</Label>
              <Input
                id="displayName"
                placeholder="ד״ר שם משפחה"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה *</Label>
              <Input
                id="password"
                type="password"
                placeholder="לפחות 6 תווים"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital">בית חולים</Label>
              <Select
                value={formData.hospital}
                onValueChange={(value) => setFormData({ ...formData, hospital: value || '' })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר בית חולים (אופציונלי)" />
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

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'נרשם...' : 'הירשם'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              כבר יש לך חשבון?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                התחבר כאן
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
