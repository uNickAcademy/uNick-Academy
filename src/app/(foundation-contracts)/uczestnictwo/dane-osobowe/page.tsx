export const metadata = {
  title: "Informacja o danych | Kreatorzy Przyszłości",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-12 text-stone-800">
      <h1 className="text-3xl font-semibold">
        Informacja o przetwarzaniu danych
      </h1>
      <p>
        Administratorem jest UNICK ACADEMY FOUNDATION, ul. Nowa 23, Rumianek,
        62-080 Tarnowo Podgórne, KRS 0001212961. Kontakt:{" "}
        <a className="underline" href="mailto:hello@unick-academy.pl">
          hello@unick-academy.pl
        </a>
        .
      </p>
      <p>
        Dane uczestnika i rodzica/opiekuna wykorzystujemy do potwierdzenia
        terminu, kontaktu i przygotowania umowy udziału w programie „Kreatorzy
        Przyszłości”. Nie zapisujemy zgód na umowę, publikację wizerunku ani
        marketing. Podanie danych jest dobrowolne, lecz niezbędne do
        przygotowania umowy. Na tym etapie formularz nie zawiera umowy do
        podpisania.
      </p>
      <p>
        Przetwarzamy imię i nazwisko, wiek na pierwsze zajęcia, gminę i adres
        zamieszkania uczestnika oraz dane rodzica/opiekuna i kontakt. Data
        urodzenia służy do obliczenia wieku; nie jest zapisywana w tym
        formularzu po obliczeniu wieku. Nie podawaj PESEL-u, numeru dowodu ani
        informacji o zdrowiu.
      </p>
      <p>
        Podstawą danych osoby zwracającej się o przygotowanie umowy jest art. 6
        ust. 1 lit. b RODO — działania przed zawarciem umowy na jej żądanie. W
        odniesieniu do organizacji zgłoszenia dziecka i kontaktu z jego
        przedstawicielem podstawą jest art. 6 ust. 1 lit. f RODO — uzasadniony
        interes Fundacji polegający na obsłudze zgłoszenia, zapewnieniu kontaktu
        i organizacji zajęć. Potwierdzenie udziału nie stanowi zgody
        marketingowej ani akceptacji umowy.
      </p>
      <p>
        Dostęp mają upoważnione osoby Fundacji i dostawcy infrastruktury w
        zakresie obsługi strony, bazy i wiadomości: Vercel, Supabase i Resend.
        Baza projektu działa w regionie UE (Irlandia). Niektóre usługi i
        wsparcie dostawców mogą wiązać się z przetwarzaniem poza EOG; stosuje
        się wówczas odpowiednie mechanizmy ochrony, w tym standardowe klauzule
        umowne. Informacje dostawców:{" "}
        <a className="underline" href="https://vercel.com/legal/dpa">
          Vercel
        </a>
        ,{" "}
        <a className="underline" href="https://supabase.com/legal/dpa">
          Supabase
        </a>
        ,{" "}
        <a className="underline" href="https://resend.com/legal/dpa">
          Resend
        </a>
        .
      </p>
      <p>
        Dane przygotowawcze przechowujemy przez czas potrzebny do obsługi
        zgłoszenia i przygotowania umowy. Po zakończeniu rekrutacji weryfikujemy
        ich dalszą niezbędność; dane niewykorzystane do udziału usuwamy, chyba
        że ich dalsze przechowywanie uzasadniają konkretne obowiązki lub
        niezbędna ochrona roszczeń. Właściwe informacje o dokumentacji udziału i
        obowiązkowej archiwizacji projektu przekażemy przy umowie.
      </p>
      <p>
        Przysługują prawa dostępu, sprostowania, ograniczenia, usunięcia i — w
        przypadkach przewidzianych prawem — przeniesienia danych, sprzeciwu
        wobec przetwarzania na podstawie uzasadnionego interesu oraz skargi do
        Prezesa UODO. Nie podejmujemy decyzji o przyjęciu wyłącznie
        automatycznie i nie wykorzystujemy tych danych do profilowania
        marketingowego.
      </p>
    </main>
  );
}
