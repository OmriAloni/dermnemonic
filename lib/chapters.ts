export const CHAPTERS = [
  { value: 'all', label: 'כל הפרקים', label_en: 'All Chapters' },

  // INFLAMMATORY DERMATOSES
  { value: 'psoriasis', label: 'פסוריאזיס', label_en: 'Psoriasis' },
  { value: 'atopic-dermatitis', label: 'דרמטיטיס אטופית', label_en: 'Atopic Dermatitis' },
  { value: 'eczema', label: 'אקזמה', label_en: 'Other Eczematous Eruptions' },
  { value: 'contact-dermatitis', label: 'דרמטיטיס ממגע', label_en: 'Contact Dermatitis' },
  { value: 'lichen-planus', label: 'ליכן פלנוס', label_en: 'Lichen Planus' },
  { value: 'papulosquamous', label: 'הפרעות פפולוסקוואמיות', label_en: 'Papulosquamous Disorders' },
  { value: 'erythroderma', label: 'אריתרודרמה', label_en: 'Erythroderma' },

  // AUTOIMMUNE BLISTERING
  { value: 'pemphigus', label: 'פמפיגוס', label_en: 'Pemphigus' },
  { value: 'pemphigoid', label: 'פמפיגואיד', label_en: 'Pemphigoid' },
  { value: 'dermatitis-herpetiformis', label: 'דרמטיטיס הרפטיפורמיס', label_en: 'Dermatitis Herpetiformis' },
  { value: 'epidermolysis-bullosa', label: 'אפידרמוליזיס בולוסה', label_en: 'Epidermolysis Bullosa' },

  // DRUG REACTIONS
  { value: 'drug-reactions', label: 'תגובות לתרופות', label_en: 'Drug Reactions' },
  { value: 'stevens-johnson', label: 'סטיבנס-ג\'ונסון / TEN', label_en: 'Stevens-Johnson Syndrome / TEN' },
  { value: 'urticaria', label: 'אורטיקריה', label_en: 'Urticaria' },

  // VASCULAR
  { value: 'vasculitis', label: 'וסקוליטיס', label_en: 'Vasculitis' },
  { value: 'purpura', label: 'פורפורה', label_en: 'Purpura' },
  { value: 'hemangiomas', label: 'המנגיומות', label_en: 'Hemangiomas' },
  { value: 'vascular-malformations', label: 'מומי כלי דם', label_en: 'Vascular Malformations' },

  // INFECTIONS
  { value: 'bacterial', label: 'זיהומים חיידקיים', label_en: 'Bacterial Diseases' },
  { value: 'mycobacterial', label: 'מיקובקטריאליות', label_en: 'Mycobacterial Infections' },
  { value: 'sti', label: 'מחלות מין', label_en: 'Sexually Transmitted Infections' },
  { value: 'hpv', label: 'HPV', label_en: 'Human Papillomaviruses' },
  { value: 'herpes', label: 'הרפס', label_en: 'Human Herpesviruses' },
  { value: 'viral', label: 'זיהומים ויראליים', label_en: 'Viral Diseases' },
  { value: 'hiv', label: 'HIV', label_en: 'HIV Manifestations' },
  { value: 'fungal', label: 'פטריות', label_en: 'Fungal Diseases' },
  { value: 'parasites', label: 'טפילים', label_en: 'Parasites and Infestations' },

  // TUMORS
  { value: 'melanoma', label: 'מלנומה', label_en: 'Melanoma' },
  { value: 'nevi', label: 'נווי', label_en: 'Benign Melanocytic Neoplasms' },
  { value: 'bcc-scc', label: 'BCC/SCC', label_en: 'Basal/Squamous Cell Carcinoma' },
  { value: 'actinic-keratosis', label: 'קרטוזיס אקטינית', label_en: 'Actinic Keratosis' },
  { value: 'benign-tumors', label: 'גידולים שפירים', label_en: 'Benign Tumors' },
  { value: 'lymphoma', label: 'לימפומה עורית', label_en: 'Cutaneous Lymphoma' },
  { value: 'metastases', label: 'גרורות', label_en: 'Cutaneous Metastases' },
  { value: 'cysts', label: 'ציסטות', label_en: 'Cysts' },

  // CONNECTIVE TISSUE
  { value: 'lupus', label: 'לופוס', label_en: 'Lupus Erythematosus' },
  { value: 'dermatomyositis', label: 'דרמטומיוזיטיס', label_en: 'Dermatomyositis' },
  { value: 'scleroderma', label: 'סקלרודרמה', label_en: 'Scleroderma' },
  { value: 'morphea', label: 'מורפאה', label_en: 'Morphea' },

  // PIGMENTATION
  { value: 'vitiligo', label: 'ויטיליגו', label_en: 'Vitiligo' },
  { value: 'hyperpigmentation', label: 'היפרפיגמנטציה', label_en: 'Hyperpigmentation' },
  { value: 'hypopigmentation', label: 'היפופיגמנטציה', label_en: 'Hypopigmentation' },

  // ACNE & ROSACEA
  { value: 'acne', label: 'אקנה', label_en: 'Acne Vulgaris' },
  { value: 'rosacea', label: 'רוזציאה', label_en: 'Rosacea' },
  { value: 'folliculitis', label: 'פוליקוליטיס', label_en: 'Folliculitis' },

  // HAIR & NAILS
  { value: 'alopecia', label: 'התקרחות', label_en: 'Alopecias' },
  { value: 'hirsutism', label: 'שיעור יתר', label_en: 'Hirsutism' },
  { value: 'nail-disorders', label: 'מחלות ציפורניים', label_en: 'Nail Disorders' },

  // GENODERMATOSES
  { value: 'neurofibromatosis', label: 'נוירופיברומטוזיס', label_en: 'Neurofibromatosis' },
  { value: 'tuberous-sclerosis', label: 'טוברוז סקלרוזיס', label_en: 'Tuberous Sclerosis' },
  { value: 'ichthyosis', label: 'איכתיוזיס', label_en: 'Ichthyoses' },
  { value: 'immunodeficiency', label: 'כשל חיסוני', label_en: 'Immunodeficiencies' },

  // METABOLIC & DEPOSITION
  { value: 'porphyria', label: 'פורפיריה', label_en: 'Porphyria' },
  { value: 'amyloidosis', label: 'עמילואידוזיס', label_en: 'Amyloidosis' },
  { value: 'xanthomas', label: 'קסנתומות', label_en: 'Xanthomas' },
  { value: 'mucinoses', label: 'מוצינוזות', label_en: 'Mucinoses' },

  // SPECIALIZED
  { value: 'pruritus', label: 'גרד', label_en: 'Pruritus' },
  { value: 'neutrophilic', label: 'דרמטוזות נויטרופיליות', label_en: 'Neutrophilic Dermatoses' },
  { value: 'eosinophilic', label: 'דרמטוזות אאוזינופיליות', label_en: 'Eosinophilic Dermatoses' },
  { value: 'pregnancy', label: 'דרמטוזות בהריון', label_en: 'Pregnancy Dermatoses' },
  { value: 'panniculitis', label: 'פניקוליטיס', label_en: 'Panniculitis' },
  { value: 'ulcers', label: 'כיבים', label_en: 'Ulcers' },
  { value: 'granulomas', label: 'גרנולומות', label_en: 'Granulomas' },
  { value: 'mastocytosis', label: 'מסטוציטוזיס', label_en: 'Mastocytosis' },

  // PHOTODERMATOLOGY
  { value: 'photodermatoses', label: 'פוטודרמטוזות', label_en: 'Photodermatoses' },

  // ORAL & GENITAL
  { value: 'oral', label: 'מחלות חלל הפה', label_en: 'Oral Diseases' },
  { value: 'genital', label: 'מחלות אנוגניטליות', label_en: 'Anogenital Diseases' },

  // OTHER
  { value: 'gvhd', label: 'GVHD', label_en: 'Graft-versus-Host Disease' },
  { value: 'systemic-disease', label: 'ביטויים עוריים של מחלות מערכתיות', label_en: 'Systemic Disease Manifestations' },
  { value: 'environmental', label: 'דרמטוזות סביבתיות', label_en: 'Environmental Dermatoses' },
  { value: 'psychocutaneous', label: 'מחלות פסיכוקוטניות', label_en: 'Psychocutaneous Diseases' },
  { value: 'other', label: 'אחר', label_en: 'Other' },
] as const

export type ChapterValue = typeof CHAPTERS[number]['value']
