import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">ההרשמה הושלמה!</CardTitle>
          <CardDescription>
            חשבונך נוצר בהצלחה. כעת אתה יכול להתחבר ולהעלות עזרי למידה.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/auth/login">
            <Button className="w-full">
              התחבר לחשבון
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              חזור לדף הבית
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
