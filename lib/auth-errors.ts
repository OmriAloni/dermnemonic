// Helper function to translate Supabase auth errors to Hebrew
export function translateAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'אימייל או סיסמה שגויים',
    'Email not confirmed': 'יש לאמת את האימייל',
    'User already registered': 'המשתמש כבר רשום',
    'Invalid email': 'כתובת אימייל לא תקינה',
    'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
    'User not found': 'משתמש לא נמצא',
    'Email already in use': 'האימייל כבר בשימוש',
  }

  // Check for exact match
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage]
  }

  // Check for partial matches (case insensitive)
  const lowerMessage = errorMessage.toLowerCase()
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value
    }
  }

  // Default fallback
  return 'שגיאה בהתחברות. נסה שוב.'
}
