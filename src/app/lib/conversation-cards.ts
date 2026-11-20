// 100 kart do rozmowy uNick Academy. Pytania są po angielsku w obu wersjach
// językowych strony; tłumaczone są tylko nazwy tematów i interfejs.

export type ConversationTheme = {
  slug: string
  title: { pl: string; en: string }
  questions: string[]
}

export const conversationThemes: ConversationTheme[] = [
  {
    slug: "who-you-are",
    title: { pl: "Kim jesteś", en: "Who You Are" },
    questions: [
      "What is one thing about you that most people would never guess?",
      "When do you feel most like yourself?",
      "What is a belief you held strongly that you have since changed?",
      "Which compliment has stayed with you the longest?",
      "What does a perfect ordinary day look like for you?",
      "What are you secretly proud of?",
      "What do you pretend to understand, but don't?",
      "If your friends described you in three words, which would they choose? Would you agree?",
      "What part of your personality took you the longest to accept?",
      "What are you still learning to say no to?",
    ],
  },
  {
    slug: "roots",
    title: { pl: "Korzenie", en: "Roots" },
    questions: [
      "What is your earliest happy memory?",
      "Who was your hero when you were small, and why?",
      "What did you want to be when you grew up?",
      "What lesson from your family do you still live by?",
      "What smell or sound takes you straight back to childhood?",
      "What rule from your childhood home would you never use yourself?",
      "Which teacher changed something in you?",
      "What did you believe as a child that makes you smile now?",
      "What would your ten-year-old self think of you today?",
      "What is a family tradition you would like to keep forever?",
    ],
  },
  {
    slug: "courage",
    title: { pl: "Odwaga", en: "Courage" },
    questions: [
      "What is the bravest thing you have ever done?",
      "What would you do tomorrow if you knew you could not fail?",
      "What fear have you already beaten?",
      "When did you last do something for the first time?",
      "What is a risk you are glad you took?",
      "What is a risk you regret not taking?",
      "What do you avoid because you are afraid of looking silly?",
      "Who makes you feel brave?",
      "What is harder for you: asking for help or saying sorry?",
      "What would you say out loud if you were not afraid of what others think?",
    ],
  },
  {
    slug: "relationships",
    title: { pl: "Relacje", en: "Relationships" },
    questions: [
      "What is the most important quality in a friend?",
      "How do you show someone you love them?",
      "Who do you need to thank, but haven't yet?",
      "What is the best advice anyone ever gave you about people?",
      "What makes you trust someone?",
      "Who believed in you when you did not believe in yourself?",
      "What small thing did someone do for you that you never forgot?",
      "How do you know when a conversation has really mattered?",
      "What do you wish people asked you more often?",
      "Which relationship would you like to repair?",
    ],
  },
  {
    slug: "dreams",
    title: { pl: "Marzenia", en: "Dreams" },
    questions: [
      "What does success mean to you, in one sentence?",
      "What are you working towards right now?",
      "If money did not matter, how would you spend your days?",
      "What dream have you quietly given up on? Should you pick it up again?",
      "What skill would you love to master?",
      "Where do you see yourself in ten years, and what scares you about it?",
      "What is something you want to create in your life?",
      "Whose life inspires you, and which part of it?",
      "What is the next small step towards your biggest dream?",
      "What would you attempt if nobody was watching?",
    ],
  },
  {
    slug: "learning",
    title: { pl: "Uczenie się", en: "Learning" },
    questions: [
      "What is the best mistake you ever made?",
      "What have you learned the hard way?",
      "What were you bad at that you later became good at?",
      "What did failure teach you that success never could?",
      "What is the most useful thing you learned outside school?",
      "What would you love to study just for fun?",
      "How do you speak to yourself when you get something wrong?",
      "What question are you still trying to answer?",
      "Who is the best teacher you know who is not a teacher?",
      "What do you know now that you wish you had known five years ago?",
    ],
  },
  {
    slug: "happiness",
    title: { pl: "Szczęście", en: "Happiness" },
    questions: [
      "What makes you lose track of time?",
      "When were you happiest this year?",
      "What simple pleasure would you never give up?",
      "What does a good life look like to you?",
      "What are you grateful for today that you took for granted a year ago?",
      "What drains your energy, and what fills it up again?",
      "What gives your life meaning?",
      "What do you do just because it makes you happy?",
      "What would you like to stop worrying about?",
      "What is enough for you?",
    ],
  },
  {
    slug: "the-world",
    title: { pl: "Świat", en: "The World" },
    questions: [
      "Which place in the world changed the way you see things?",
      "Which word from another language do you wish existed in yours?",
      "What does your culture do beautifully?",
      "What could your country learn from another country?",
      "If you could have dinner with someone from any country, who would it be?",
      "What surprised you most when you first spoke a new language?",
      "Which tradition from another culture would you like to adopt?",
      "What does home mean to you?",
      "What is a misunderstanding you once had about another culture?",
      "If you could live anywhere for one year, where would you go?",
    ],
  },
  {
    slug: "time-and-legacy",
    title: { pl: "Czas i dziedzictwo", en: "Time & Legacy" },
    questions: [
      "What do you want people to say about you when you are not in the room?",
      "What would you tell your younger self in one sentence?",
      "What would you like to tell your older self?",
      "If you had one year left, what would you change today?",
      "What do you want to be remembered for?",
      "What are you spending too much time on?",
      "Which moment in your life would you love to live again?",
      "What would you like to teach the next generation?",
      "What in your life will still matter a hundred years from now?",
      "What do you hope you never stop doing?",
    ],
  },
  {
    slug: "imagine-if",
    title: { pl: "Wyobraź sobie", en: "Imagine If" },
    questions: [
      "If you could ask anyone in history one question, who and what would you ask?",
      "If you wrote a book about your life, what would the title be?",
      "If you could master any language overnight, which would you choose?",
      "If you opened a school, what would be its first rule?",
      "If you could remove one thing from the world, what would it be?",
      "If you could add one lesson to every school in the world, what would it be?",
      "If your life had a theme song, what would it be?",
      "If you could swap lives with someone for a day, who would it be?",
      "If kindness were a job, what would your job title be?",
      "What question would you like to leave for the next person to answer?",
    ],
  },
]

export type ConversationCard = { number: number; theme: string; question: string }

export const conversationCards: ConversationCard[] = conversationThemes.flatMap((theme, themeIndex) =>
  theme.questions.map((question, i) => ({ number: themeIndex * 10 + i + 1, theme: theme.slug, question })),
)
