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
  att_late_cancellation: { pl: 'Późne odwołanie', en: 'Late cancellation' },
  att_no_show: { pl: 'Nieobecność bez zgłoszenia', en: 'No-show' },
  report_absence: { pl: 'Zgłoś nieobecność', en: 'Report absence' },
  absence_reported: { pl: 'Zgłoszono nieobecność', en: 'Absence reported' },
  book_makeup: { pl: 'Zapisz się na odrabianie', en: 'Book a make-up lesson' },
  suggested_slots: { pl: 'Proponowane terminy odrabiania', en: 'Suggested make-up slots' },
  finding_slots: { pl: 'Szukam wolnych terminów...', en: 'Looking for available slots...' },
  no_slots: { pl: 'Brak wolnych terminów w najbliższych 14 dniach. Skontaktuj się z lektorem.', en: 'No slots in the next 14 days. Please contact your teacher.' },
  makeup_booked: { pl: 'Zapisano na odrabianie!', en: 'Make-up lesson booked!' },
  // Zgłaszanie nieobecności – reguła 24h
  cancel_lesson_q: { pl: 'Zgłosić nieobecność na tej lekcji?', en: 'Report absence for this lesson?' },
  cancel_ge24_info: { pl: 'Zgłaszasz z wyprzedzeniem — lekcja trafi do puli „do odrobienia" i będziesz mógł/mogła zapisać się na inny termin.', en: 'You are cancelling in advance — the lesson goes to the make-up pool and you can book another slot.' },
  cancel_lt24_confirm: { pl: 'Do lekcji zostało mniej niż 24h. Jeśli teraz zgłosisz nieobecność, lekcja przepada (liczona jako odbyta, bez odrabiania). Kontynuować?', en: 'Less than 24h to the lesson. If you cancel now the lesson is forfeited (counted as held, no make-up). Continue?' },
  late_cancel_done: { pl: 'Zgłoszono późne odwołanie — lekcja przepada (bez odrabiania).', en: 'Late cancellation recorded — the lesson is forfeited (no make-up).' },
  late_cancel_badge: { pl: 'Późne odwołanie', en: 'Late cancellation' },

  // Dashboard
  welcome: { pl: 'Witaj', en: 'Welcome' },
  upcoming_count: { pl: 'Masz {n} nadchodzących lekcji', en: 'You have {n} upcoming lessons' },
  next_lesson: { pl: 'Następna lekcja', en: 'Next lesson' },
  no_next_lesson: { pl: 'Brak zaplanowanych lekcji – skontaktuj się z nami, żeby umówić termin.', en: 'No upcoming lessons – contact us to schedule one.' },
  hours_done: { pl: 'Zrealizowane godziny', en: 'Hours completed' },
  current_level: { pl: 'Aktualny poziom', en: 'Current level' },
  account_balance: { pl: 'Saldo konta', en: 'Account balance' },
  scheduled: { pl: 'Zaplanowane', en: 'Scheduled' },
  see_all: { pl: 'Zobacz wszystkie', en: 'See all' },
  your_referral_code: { pl: 'Twój kod polecenia', en: 'Your referral code' },
  details: { pl: 'Szczegóły', en: 'Details' },
  code_to_share: { pl: 'Kod do udostępnienia', en: 'Code to share' },
  referral_blurb: { pl: 'Każda osoba, która dołączy z Twoim kodem, dostaje 50 zł zniżki, a Ty zarabiasz 50 zł kredytu!', en: 'Everyone who joins with your code gets 50 zł off, and you earn 50 zł credit!' },
  copied: { pl: 'Skopiowano!', en: 'Copied!' },
  copy: { pl: 'Kopiuj', en: 'Copy' },

  // Postępy
  my_progress: { pl: 'Moje postępy', en: 'My progress' },
  monthly_hours: { pl: 'Godziny nauki miesięcznie', en: 'Study hours per month' },
  total_this_period: { pl: 'Łącznie w ostatnich 6 miesiącach', en: 'Total over the last 6 months' },
  attendance_title: { pl: 'Frekwencja', en: 'Attendance' },
  lessons_attended: { pl: 'Odbyte lekcje', en: 'Lessons attended' },
  recent_topics: { pl: 'Ostatnie tematy lekcji', en: 'Recent lesson topics' },
  teacher_notes: { pl: 'Notatki od nauczyciela', en: 'Teacher notes' },
  no_progress_yet: { pl: 'Twoje postępy pojawią się tutaj po pierwszych lekcjach.', en: 'Your progress will appear here after your first lessons.' },
  no_notes_yet: { pl: 'Nauczyciel nie dodał jeszcze notatek.', en: 'Your teacher has not added notes yet.' },

  // Rozliczenia / płatności
  billing: { pl: 'Rozliczenia', en: 'Billing' },
  payments: { pl: 'Płatności', en: 'Payments' },
  balance_due: { pl: 'Zaległość do uregulowania', en: 'Outstanding balance' },
  balance_ok: { pl: 'Konto wyrównane', en: 'Account settled' },
  balance_credit: { pl: 'Nadpłata / kredyt', en: 'Credit balance' },
  pay_now: { pl: 'Zapłać teraz', en: 'Pay now' },
  pay_blik: { pl: 'Zapłać teraz (BLIK / karta / Przelewy24)', en: 'Pay now (BLIK / card / Przelewy24)' },
  overdue_note: { pl: 'Masz zaległość {amount} zł. Ureguluj płatność, żeby kontynuować lekcje bez przerwy.', en: 'You owe {amount} zł. Settle the payment to continue lessons without interruption.' },
  tx_history: { pl: 'Historia transakcji', en: 'Transaction history' },
  no_transactions: { pl: 'Brak transakcji. Historia wpłat i naliczeń pojawi się tutaj.', en: 'No transactions yet. Charges and payments will appear here.' },
  next_payment: { pl: 'Następna płatność', en: 'Next payment' },
  monthly_rate: { pl: 'Miesięczna stawka', en: 'Monthly rate' },
  credits_applied: { pl: 'Nadpłata / kredyty', en: 'Credit applied' },
  arrears: { pl: 'Zaległość', en: 'Arrears' },
  to_pay: { pl: 'Do zapłaty', en: 'Amount due' },
  invoice_history: { pl: 'Historia faktur', en: 'Invoice history' },
  no_invoices: { pl: 'Brak faktur.', en: 'No invoices yet.' },
  invoice_paid: { pl: 'Opłacona', en: 'Paid' },
  payment_success: { pl: 'Dziękujemy! Płatność została przyjęta – zaksięgujemy ją za chwilę.', en: 'Thank you! Your payment was received and will be booked shortly.' },
  payment_cancelled: { pl: 'Płatność została anulowana. Możesz spróbować ponownie.', en: 'Payment was cancelled. You can try again.' },
  payments_unavailable: { pl: 'Płatności online są chwilowo niedostępne. Prosimy o przelew tradycyjny.', en: 'Online payments are temporarily unavailable. Please pay by bank transfer.' },

  // Polecenia
  referral_program: { pl: 'Program polecenia', en: 'Referral program' },
  referral_sub: { pl: 'Zarabiaj kredyty, polecając uNick Academy znajomym', en: 'Earn credits by referring friends to uNick Academy' },
  how_it_works: { pl: 'Jak to działa?', en: 'How does it work?' },
  your_friend: { pl: 'Twój znajomy', en: 'Your friend' },
  friend_gets: { pl: 'dostaje 50 zł zniżki na start', en: 'gets 50 zł off to start' },
  you: { pl: 'Ty', en: 'You' },
  you_get: { pl: 'dostajesz 50 zł kredytu na kolejne lekcje', en: 'get 50 zł credit toward future lessons' },
  your_unique_code: { pl: 'Twój unikalny kod', en: 'Your unique code' },
  share_link: { pl: 'Link do udostępnienia', en: 'Link to share' },
  referral_history: { pl: 'Historia poleceń', en: 'Referral history' },
  no_referrals_yet: { pl: 'Jeszcze nikt nie skorzystał z Twojego kodu', en: 'No one has used your code yet' },
  total_earned: { pl: 'łącznie', en: 'total' },
  credit: { pl: 'kredyt', en: 'credit' },
}

export function t(lang: Lang, key: keyof typeof DICT): string {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang] ?? entry.pl
}
