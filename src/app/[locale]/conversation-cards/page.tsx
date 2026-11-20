import ConversationCards from "../../components/ConversationCards"
import { buildMetadata } from "../../lib/seo"

type PageProps = {
  params: Promise<{ locale: string }>
}

const meta = {
  pl: {
    title: "Karty do rozmowy po angielsku",
    description: "100 pytań po angielsku do rozmów na zajęciach i w domu. Losuj karty online albo wydrukuj je na A4.",
  },
  en: {
    title: "Conversation Cards",
    description: "100 English conversation questions for class and home. Draw a card online or print the full set on A4.",
  },
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params
  const language = locale === "pl" ? "pl" : "en"
  return buildMetadata({ locale, path: "/conversation-cards", ...meta[language] })
}

export default async function ConversationCardsPage({ params }: PageProps) {
  const { locale } = await params
  return <ConversationCards language={locale === "pl" ? "pl" : "en"} />
}
