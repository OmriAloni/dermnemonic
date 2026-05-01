export const AID_TYPES = [
  { value: 'mnemonic', label: 'מנמוניק', label_en: 'Mnemonic' },
  { value: 'illustration', label: 'איור', label_en: 'Illustration' },
  { value: 'table', label: 'טבלה', label_en: 'Table' },
  { value: 'flowchart', label: 'תרשים זרימה', label_en: 'Flowchart' },
  { value: 'other', label: 'אחר', label_en: 'Other' },
] as const

export type AidTypeValue = typeof AID_TYPES[number]['value']
