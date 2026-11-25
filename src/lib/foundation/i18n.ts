// Angielskie odpowiedniki tekstów wyświetlanych w formularzach Fundacji.
// Dane zapisywane w bazie i walidacja serwerowa pozostają po polsku,
// tłumaczymy wyłącznie to, co widzi odwiedzający.

export type FoundationLocale = 'pl' | 'en'

const days: Record<string, string> = {
  Poniedziałki: 'Mondays',
  Wtorki: 'Tuesdays',
  Środy: 'Wednesdays',
  Czwartki: 'Thursdays',
}

const venues: Record<string, string> = {
  'CDIO — Centrum Demokracji i Integracji Obywatelskiej': 'CDIO, Centre for Democracy and Civic Integration',
  'Biblioteka Publiczna i Centrum Kultury w Kaźmierzu': 'Public Library and Culture Centre in Kaźmierz',
  'Sala OSP': 'Volunteer Fire Brigade hall (OSP)',
}

const places: Record<string, string> = {}

const errors: Record<string, string> = {
  'Odśwież stronę i spróbuj ponownie.': 'Refresh the page and try again.',
  'Podaj imię i nazwisko uczestnika.': "Enter the participant's first and last name.",
  'Uczestnik powinien mieć od 10 do 18 lat.': 'The participant should be between 10 and 18 years old.',
  'Wybierz gminę zamieszkania.': 'Choose the municipality of residence.',
  'Potwierdź zamieszkanie w wybranej gminie.': 'Confirm residence in the chosen municipality.',
  'Wybierz co najmniej jedną grupę odpowiednią dla wieku uczestnika.': "Choose at least one group suitable for the participant's age.",
  'Wybierz pierwszy wybór spośród zaznaczonych grup.': 'Choose your first choice from the selected groups.',
  'Podaj imię i nazwisko rodzica lub opiekuna.': "Enter the parent's or guardian's first and last name.",
  'Podaj poprawny adres e-mail.': 'Enter a valid email address.',
  'Podaj polski numer telefonu.': 'Enter a Polish phone number.',
  'To potwierdzenie jest wymagane.': 'This confirmation is required.',
  'Zgoda na kontakt jest wymagana.': 'Consent to contact is required.',
  'Zgoda na przetwarzanie danych jest wymagana.': 'Consent to data processing is required.',
  'Wybierz jedną odpowiedź.': 'Choose one answer.',
  'Zaznacz grupę lub grupy odpowiednie dla wieku uczestnika.': "Select the group or groups suitable for the participant's age.",
  'Deklaracja regularnego udziału jest wymagana.': 'The declaration of regular attendance is required.',
  'Akceptacja zasad projektu jest wymagana.': 'Acceptance of the project rules is required.',
  'Podaj imię i nazwisko rodzica, opiekuna lub pełnoletniego uczestnika.': "Enter the first and last name of the parent, guardian or adult participant.",
  'Formularz jest zbyt duży.': 'The form is too large.',
  'Nie można wysłać formularza z tej strony.': 'The form cannot be sent from this page.',
  'Nieprawidłowe dane.': 'Invalid data.',
  'Nie udało się zapisać deklaracji.': 'We could not save your submission. Please try again.',
  'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.': 'We could not save your submission. Please try again.',
}

export const dayLabel = (day: string, locale: FoundationLocale) => locale === 'en' ? days[day] ?? day : day
export const venueLabel = (venue: string, locale: FoundationLocale) => locale === 'en' ? venues[venue] ?? venue : venue
export const placeLabel = (name: string, locale: FoundationLocale) => locale === 'en' ? places[name] ?? name : name
export const ageLabel = (age: string, locale: FoundationLocale) => locale === 'en' ? age.replace(' lat', ' years old') : age
export const errorLabel = (message: string, locale: FoundationLocale) => locale === 'en' ? errors[message] ?? message : message

/** Etykieta grupy do wyświetlenia (nie do zapisu w bazie). */
export function groupLabel(
  group: { title: string; time: string | null },
  location: { name: string; day: string },
  locale: FoundationLocale,
) {
  if (locale === 'pl') return null
  return `${group.title}, ${placeLabel(location.name, locale)}, ${dayLabel(location.day, locale).toLowerCase()}${group.time ? `, ${group.time}` : ', time to be confirmed'}`
}
