export type Lang = 'pl' | 'en'
export const LANGS: Lang[] = ['pl', 'en']

type Dict = Record<string, { pl: string; en: string }>

const DICT: Dict = {
  // Nawigacja
  nav_dashboard: { pl: 'Panel', en: 'Dashboard' },
  nav_lessons: { pl: 'Lekcje', en: 'Lessons' },
  nav_progress: { pl: 'Postępy', en: 'Progress' },
  nav_referrals: { pl: 'Polecenia', en: 'Referrals' },
  nav_payments: { pl: 'Płatności', en: 'Payments' },
  nav_billing: { pl: 'Rozliczenia', en: 'Billing' },
  nav_profile: { pl: 'Profil', en: 'Profile' },
  logout: { pl: 'Wyloguj się', en: 'Log out' },

  // Profil ucznia
  my_profile: { pl: 'Mój profil', en: 'My profile' },
  profile_intro: { pl: 'Zaktualizuj swoje dane kontaktowe i hasło.', en: 'Update your contact details and password.' },
  full_name: { pl: 'Imię i nazwisko', en: 'Full name' },
  phone: { pl: 'Telefon', en: 'Phone' },
  save: { pl: 'Zapisz', en: 'Save' },
  saved: { pl: 'Zapisano!', en: 'Saved!' },
  change_password: { pl: 'Zmień hasło', en: 'Change password' },
  new_password: { pl: 'Nowe hasło', en: 'New password' },
  repeat_password: { pl: 'Powtórz hasło', en: 'Repeat password' },
  password_changed: { pl: 'Hasło zmienione!', en: 'Password changed!' },

  // Lekcje (panel ucznia/rodzica)
  my_lessons: { pl: 'Moje lekcje', en: 'My lessons' },
  upcoming: { pl: 'Nadchodzące', en: 'Upcoming' },
  completed: { pl: 'Zakończone', en: 'Completed' },
  no_upcoming: { pl: 'Brak zaplanowanych lekcji.', en: 'No upcoming lessons.' },
  no_completed: { pl: 'Brak zakończonych lekcji.', en: 'No completed lessons.' },
  lesson: { pl: 'Lekcja', en: 'Lesson' },
  online: { pl: 'Online', en: 'Online' },
  offline: { pl: 'Stacjonarnie', en: 'In person' },
  join: { pl: 'Dołącz', en: 'Join' },
  homework: { pl: 'Praca domowa', en: 'Homework' },
  group: { pl: 'Grupa', en: 'Group' },
  att_present: { pl: 'Obecność', en: 'Present' },
  att_absent: { pl: 'Nieobecność', en: 'Absent' },
  att_excused: { pl: 'Usprawiedliwiona', en: 'Excused' },
  report_absence: { pl: 'Zgłoś nieobecność', en: 'Report absence' },
  absence_reported: { pl: 'Zgłoszono nieobecność', en: 'Absence reported' },
  book_makeup: { pl: 'Zapisz się na odrabianie', en: 'Book a make-up lesson' },
  suggested_slots: { pl: 'Proponowane terminy odrabiania', en: 'Suggested make-up slots' },
  finding_slots: { pl: 'Szukam wolnych terminów...', en: 'Looking for available slots...' },
  no_slots: { pl: 'Brak wolnych terminów w najbliższych 14 dniach. Skontaktuj się z lektorem.', en: 'No slots in the next 14 days. Please contact your teacher.' },
  makeup_booked: { pl: 'Zapisano na odrabianie!', en: 'Make-up lesson booked!' },

  // Dashboard
  welcome: { pl: 'Witaj', en: 'Welcome' },
}

export function t(lang: Lang, key: keyof typeof DICT): string {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang] ?? entry.pl
}
