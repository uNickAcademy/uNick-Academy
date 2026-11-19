type LessonMaterial = {
  slug: string
  title: { pl: string; en: string }
}

export const lessonMaterials: readonly LessonMaterial[] = [
  // Shared PL/EN teaching progression: concrete basics, everyday language,
  // sentence-building, then more specific practical and seasonal vocabulary.
  { slug: "colours", title: { pl: "Kolory", en: "Colours" } },
  { slug: "numbers", title: { pl: "Liczby", en: "Numbers" } },
  { slug: "shapes", title: { pl: "Kształty", en: "Shapes" } },
  { slug: "animals", title: { pl: "Zwierzęta", en: "Animals" } },
  { slug: "toys", title: { pl: "Zabawki", en: "Toys" } },
  { slug: "body-parts", title: { pl: "Części ciała", en: "Body Parts" } },
  { slug: "family", title: { pl: "Rodzina", en: "Family" } },
  { slug: "feelings", title: { pl: "Uczucia", en: "Feelings" } },
  { slug: "actions", title: { pl: "Czynności", en: "Actions" } },
  { slug: "food", title: { pl: "Jedzenie i napoje", en: "Food and Drinks" } },
  { slug: "clothes", title: { pl: "Ubrania i dodatki", en: "Clothes and Accessories" } },
  { slug: "classroom-objects", title: { pl: "Przedmioty w klasie", en: "Classroom Objects" } },
  { slug: "classroom-language", title: { pl: "Zwroty w klasie", en: "Classroom Language" } },
  { slug: "describing-words", title: { pl: "Przymiotniki i przeciwieństwa", en: "Describing Words" } },
  { slug: "pronouns", title: { pl: "Zaimki i określenia dzierżawcze", en: "Pronouns and Possessives" } },
  { slug: "question-words", title: { pl: "Słowa pytające", en: "Question Words" } },
  { slug: "quantities", title: { pl: "Ilości", en: "Quantities" } },
  { slug: "prepositions-of-place", title: { pl: "Przyimki miejsca", en: "Prepositions of Place" } },
  { slug: "daily-routines", title: { pl: "Codzienne czynności", en: "Daily Routines" } },
  { slug: "time-and-calendar", title: { pl: "Czas i kalendarz", en: "Time and Calendar" } },
  { slug: "weather", title: { pl: "Pogoda", en: "Weather" } },
  { slug: "home", title: { pl: "Dom", en: "Home" } },
  { slug: "furniture", title: { pl: "Meble", en: "Furniture" } },
  { slug: "transport", title: { pl: "Transport", en: "Transport" } },
  { slug: "free-time-activities", title: { pl: "Czas wolny", en: "Free Time Activities" } },
  { slug: "sports", title: { pl: "Sport", en: "Sports" } },
  { slug: "places-in-a-town", title: { pl: "Miejsca w mieście", en: "Places in a Town" } },
  { slug: "directions", title: { pl: "Wskazywanie drogi", en: "Directions" } },
  { slug: "everyday-objects", title: { pl: "Przedmioty codziennego użytku", en: "Everyday Objects" } },
  { slug: "home-objects", title: { pl: "Przedmioty w domu", en: "Home Objects" } },
  { slug: "kitchen-objects", title: { pl: "Przedmioty w kuchni", en: "Kitchen Objects" } },
  { slug: "nature", title: { pl: "Przyroda", en: "Nature" } },
  { slug: "christmas", title: { pl: "Boże Narodzenie", en: "Christmas" } },
]
