type LessonMaterial = {
  slug: string
  title: { pl: string; en: string }
}

export const lessonMaterials: readonly LessonMaterial[] = [
  { slug: "body-parts", title: { pl: "Części ciała", en: "Body Parts" } },
  { slug: "actions", title: { pl: "Czynności", en: "Actions" } },
  { slug: "daily-routines", title: { pl: "Codzienne czynności", en: "Daily Routines" } },
  { slug: "free-time-activities", title: { pl: "Czas wolny", en: "Free Time Activities" } },
  { slug: "feelings", title: { pl: "Uczucia", en: "Feelings" } },
  { slug: "family", title: { pl: "Rodzina", en: "Family" } },
  { slug: "classroom-language", title: { pl: "Zwroty w klasie", en: "Classroom Language" } },
  { slug: "classroom-objects", title: { pl: "Przedmioty w klasie", en: "Classroom Objects" } },
  { slug: "shapes", title: { pl: "Kształty", en: "Shapes" } },
  { slug: "numbers", title: { pl: "Liczby", en: "Numbers" } },
  { slug: "home", title: { pl: "Dom", en: "Home" } },
  { slug: "furniture", title: { pl: "Meble", en: "Furniture" } },
  { slug: "home-objects", title: { pl: "Przedmioty w domu", en: "Home Objects" } },
  { slug: "kitchen-objects", title: { pl: "Przedmioty w kuchni", en: "Kitchen Objects" } },
  { slug: "everyday-objects", title: { pl: "Przedmioty codziennego użytku", en: "Everyday Objects" } },
  { slug: "food", title: { pl: "Jedzenie i napoje", en: "Food and Drinks" } },
  { slug: "clothes", title: { pl: "Ubrania i dodatki", en: "Clothes and Accessories" } },
  { slug: "weather", title: { pl: "Pogoda", en: "Weather" } },
  { slug: "nature", title: { pl: "Przyroda", en: "Nature" } },
  { slug: "prepositions-of-place", title: { pl: "Przyimki miejsca", en: "Prepositions of Place" } },
  { slug: "places-in-a-town", title: { pl: "Miejsca w mieście", en: "Places in a Town" } },
  { slug: "directions", title: { pl: "Wskazywanie drogi", en: "Directions" } },
  { slug: "christmas", title: { pl: "Boże Narodzenie", en: "Christmas" } },
]
