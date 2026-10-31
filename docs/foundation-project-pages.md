# Podstrony projektów Fundacji

`/pl/foundation` jest krótką stroną Fundacji i prowadzi do dwóch niezależnych ścieżek:

- `/ball` — informacje o The uNickorn Ball i istniejący formularz `/api/ball`;
- `/creators` — informacje o projekcie Kreatorzy Przyszłości i istniejący formularz `/api/foundation-interest`.

Obie strony korzystają ze wspólnej oprawy marketingowej. Formularze, walidacja serwerowa, zapis w Supabase i wysyłka istniejących powiadomień pozostają oddzielne. Kotwice `/pl/foundation#bal` i `/pl/foundation#deklaracja` wskazują odpowiednie kafelki, aby stare linki nie traciły kontekstu.

W formularzu `/creators` uczestnik wybiera konkretne grupy z ustalonym terminem. Nie pytamy ponownie o dostępność: walidacja wylicza wymagane przez istniejącą tabelę dni i godziny z `projectSchedule` przez `foundationGroupOptions`. Starsze otwarte formularze bez identyfikatorów grup nadal przesyłają i walidują własne preferencje. Zmiana harmonogramu nie nadpisuje zapisanych wcześniej opisów wybranych grup.
