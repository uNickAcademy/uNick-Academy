-- Idempotentne księgowanie wpłat ze Stripe.
--
-- Stripe ponawia webhooki: przy każdej odpowiedzi innej niż 2xx, przy timeoucie,
-- a czasem dostarcza to samo zdarzenie dwa razy mimo poprawnej odpowiedzi.
-- Do tej pory handler po prostu wstawiał wiersz wpłaty, więc ponowienie
-- dopisywało uczniowi drugą wpłatę tej samej kwoty. Przy danych demo nie miało
-- to znaczenia, przy prawdziwych pieniądzach to zawyżone saldo i realna strata.
--
-- external_id trzyma identyfikator zdarzenia po stronie Stripe. Unikalny indeks
-- sprawia, że powtórka jest odrzucana przez bazę, a nie przez kod aplikacji.
-- Indeks jest częściowy, bo wpłaty wpisywane ręcznie w panelu (gotówka,
-- terminal) nie mają zewnętrznego identyfikatora i mogą się powtarzać.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id TEXT;

COMMENT ON COLUMN transactions.external_id IS
  'Identyfikator zdarzenia u dostawcy płatności (Stripe). Pusty dla wpłat wpisywanych ręcznie.';

-- Indeks NIE moze byc czesciowy. Klauzula ON CONFLICT (external_id), ktora
-- generuje supabase-js przy upsert, nie dopasowuje sie do indeksu z warunkiem
-- WHERE i konczy sie bledem 42P10 przy kazdej wplacie. Zwykly indeks unikalny
-- dopuszcza dowolnie wiele wartosci NULL, wiec wplaty wpisywane recznie
-- (gotowka, terminal) i tak moga byc bez identyfikatora.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_id_key
  ON transactions(external_id);
