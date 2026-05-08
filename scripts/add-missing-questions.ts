import fs from 'fs'
import path from 'path'

const quizFilePath = path.join(process.cwd(), 'public', 'quiz-questions.json')

// Read existing questions
const data = JSON.parse(fs.readFileSync(quizFilePath, 'utf-8'))

// New questions to add
const newQuestions = [
  {
    id: "israeli-board-055",
    chapter: "hair-nail-biology",
    question: "לפניכם תמונת חתך היסטולוגיה של הציפורן. היכן ממקום ה-MATRIX?",
    options: [
      "א",
      "ב",
      "ג",
      "ד"
    ],
    correctAnswer: 0,
    explanation: "ה-Matrix של הציפורן נמצא באזור א' בתמונה. זהו האזור שבו מתרחש הייצור העיקרי של תאי הציפורן.",
    imageUrl: "/quiz-images/israeli-board-055.png"
  },
  {
    id: "israeli-board-064",
    chapter: "allergic-contact",
    question: "לאיזה חומר יש CROSS-REACTIVITY עם BALSAM OF PERU?",
    options: [
      "BENZOIC ACID",
      "IMIDAZOLIDINYL UREA",
      "METHYLISOTHIAZOLINONE",
      "COCAMIDOPROPYL BETAINE"
    ],
    correctAnswer: 0,
    explanation: "BENZOIC ACID מראה תגובת cross-reactivity עם Balsam of Peru. שני החומרים שייכים לאותה משפחה כימית ויכולים לגרום לתגובות דומות אצל אנשים רגישים."
  },
  {
    id: "israeli-board-099",
    chapter: "biopsy-excisions",
    question: "מה לא נכון בטיפול בביופסיה לאחר לקיחתה להיסטולוגיה רגילה?",
    options: [
      "הביופסיה תושם באופן מיידי במיכל המכיל פורמלין 4%-10%",
      "יש לוודא שהביופסיה לא נדבקה לדופן המיכל",
      "יש לסגור בפקק מתאים שעליו פרטי המטופל",
      "למיכל יצורף טופס המכיל פרטים קליניים כולל אבחנה מבדלת, ביופסיות קודמות במקום ובקשות מיוחדות מהפתולוג או המעבדה"
    ],
    correctAnswer: 2,
    explanation: "לא נכון לסגור בפקק שעליו פרטי המטופל. פרטי המטופל צריכים להיות על התווית שעל המיכל עצמו, לא על הפקק, כדי למנוע אובדן מידע במקרה שהפקק יתחלף בטעות."
  },
  {
    id: "israeli-board-133",
    chapter: "acne",
    question: "מה מבדיל בין NEONATAL ACNE לבין INFANTILE ACNE?",
    options: [
      "שתי צורות האקנה מופיעות באופן טיפוסי בחודש הראשון לחיים, אך הצורה ה-INFANTILE נמשכת עד גיל שנה, בעוד הצורה ה-NEONATAL נסוגה בגיל חודשיים",
      "צלקות שקועות אופייניות לצורה ה-INFANTILE",
      "הצורה ה-NEONATAL נובעת מזיהום ע\"י MALASSEZIA, בעוד הצורה ה-INFANTILE נובעת מהשפעת ANDROGENS",
      "הצורה ה-NEONATAL מנבאת ביטוי אקנה קשה בגיל ההתבגרות"
    ],
    correctAnswer: 1,
    explanation: "הבדל מרכזי הוא שצלקות שקועות (atrophic scars) אופייניות ל-Infantile Acne, בעוד ש-Neonatal Acne בדרך כלל אינה משאירה צלקות. Infantile Acne מופיעה בין 3-6 חודשים ויכולה להימשך עד גיל 5, ואילו Neonatal Acne מופיעה בלידה או זמן קצר לאחר מכן ונסוגה בד\"כ תוך 3-4 חודשים."
  },
  {
    id: "israeli-board-143",
    chapter: "pregnancy",
    question: "בת 32, שבוע 10 להריונה השני. ברקע אלרגיה לקרדית אבק הבית. פנתה בשל הופעת לראשונה בחייה פריחה אקזמטוטית המלווה בגרד בצוואר, קפלי מרפקים וברכיים. מה הפרוגנוזה?",
    options: [
      "התופעה צפויה להישנות בהריונות הבאים",
      "פריחה דומה עשויה להופיע ביילוד ולחלוף עצמונית לאחר מספר ימים",
      "סיכון מוגבר ללידה מוקדמת",
      "קיימת קורלציה בין חומרת המחלה לבין הפרוגנוזה של העובר"
    ],
    correctAnswer: 0,
    explanation: "מדובר ב-Atopic Eruption of Pregnancy (AEP), שהיא הדרמטוזה השכיחה ביותר בהריון (כ-50% מכלל הדרמטוזות). התופעה אכן צפויה להישנות בהריונות עתידיים. זו מחלה שפירה ללא השפעה על הפרוגנוזה של העובר, ואין סיכון מוגבר ללידה מוקדמת או מחלה ביילוד."
  }
]

// Add new questions to the array
data.questions.push(...newQuestions)

// Update metadata
data.metadata.total = data.questions.length
data.metadata.extractedAt = new Date().toISOString()

// Write back to file
fs.writeFileSync(quizFilePath, JSON.stringify(data, null, 2))

console.log(`✅ Added ${newQuestions.length} questions`)
console.log(`📊 Total questions now: ${data.questions.length}`)
console.log('\nNew questions added:')
newQuestions.forEach(q => {
  console.log(`  - ${q.id}: ${q.question.substring(0, 60)}...`)
})
