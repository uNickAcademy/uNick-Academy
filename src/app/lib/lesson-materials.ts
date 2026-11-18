type LessonMaterial = {
  slug: string
  title: { pl: string; en: string }
}

export const lessonMaterials: readonly LessonMaterial[] = [
  { slug: "body-parts", title: { pl: "Części ciała", en: "Body Parts" } },
  { slug: "actions", title: { pl: "Czynności", en: "Actions" } },
  { slug: "feelings", title: { pl: "Uczucia", en: "Feelings" } },
  { slug: "family", title: { pl: "Rodzina", en: "Family" } },
  { slug: "home", title: { pl: "Dom", en: "Home" } },
  { slug: "furniture", title: { pl: "Meble", en: "Furniture" } },
  { slug: "home-objects", title: { pl: "Przedmioty w domu", en: "Home Objects" } },
  { slug: "kitchen-objects", title: { pl: "Przedmioty w kuchni", en: "Kitchen Objects" } },
  { slug: "everyday-objects", title: { pl: "Przedmioty codziennego użytku", en: "Everyday Objects" } },
  { slug: "food", title: { pl: "Jedzenie i napoje", en: "Food and Drinks" } },
  { slug: "nature", title: { pl: "Przyroda", en: "Nature" } },
  { slug: "prepositions-of-place", title: { pl: "Przyimki miejsca", en: "Prepositions of Place" } },
  { slug: "christmas", title: { pl: "Boże Narodzenie", en: "Christmas" } },
]
