/**
 * Supabase z limitem czasu.
 *
 * 17.08.2026 proces PostgREST (API bazy) zawisł: przyjmował połączenia, ale
 * nie wykonywał już żadnego zapytania. Żądania nie dostawały ani odpowiedzi,
 * ani błędu — wisiały do timeoutu gatewaya (~60 s) albo w nieskończoność.
 * Bez limitu po naszej stronie taka awaria zamraża całą aplikację: server
 * component czeka bez końca, a przycisk „Logowanie..." kręci się w kółko.
 *
 * Z limitem zapytanie kończy się błędem, który da się obsłużyć i pokazać
 * użytkownikowi. Awaria Supabase nadal boli, ale przestaje wyglądać jak
 * zawieszona strona.
 */
const DEFAULT_TIMEOUT_MS = 10_000

export function timeoutFetch(timeoutMs: number = DEFAULT_TIMEOUT_MS): typeof fetch {
  return (input, init) => {
    // Bardzo stare przeglądarki bez AbortSignal.timeout — lepiej działać bez
    // limitu niż wywrócić się przy tworzeniu klienta.
    if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
      return fetch(input, init)
    }

    const timeout = AbortSignal.timeout(timeoutMs)
    // Sygnał wywołującego (np. przerwana nawigacja w Next.js) łączymy z naszym,
    // ale gdy AbortSignal.any nie istnieje, pierwszeństwo ma limit czasu —
    // to on jest tu powodem całego zamieszania.
    const signal = init?.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([init.signal, timeout])
      : timeout

    return fetch(input, { ...init, signal })
  }
}
