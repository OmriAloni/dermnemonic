import heMessages from '@/locales/he.json'
import enMessages from '@/locales/en.json'

export type Locale = 'he' | 'en'

const messages = {
  he: heMessages,
  en: enMessages,
}

export function getMessages(locale: Locale = 'he') {
  return messages[locale] || messages.he
}

export function getDirection(locale: Locale = 'he'): 'rtl' | 'ltr' {
  return locale === 'he' ? 'rtl' : 'ltr'
}
