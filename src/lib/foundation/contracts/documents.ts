import { CONTRACT_VERSION, type ContractDocuments } from "./model";
import { z } from "zod";
export const settingsSchema = z
  .object({
    grantNumber: z.string().trim().min(1).max(100),
    lgdNotice: z
      .string()
      .url()
      .max(2000)
      .refine(
        (v) => v.startsWith("https://"),
        "Podaj bezpieczny adres HTTPS informacji LGD.",
      ),
    retention: z.string().trim().min(20).max(4000),
    lgdPrivacy: z.string().trim().max(20000).default(""),
    providerNotice: z.string().trim().max(5000).default(""),
    returnEmail: z.string().email().max(180).default("hello@unick-academy.pl"),
    ready: z.boolean(),
  })
  .strict();
export type ContractSettings = z.infer<typeof settingsSchema>;
export const SETTINGS_DEFAULT: ContractSettings = {
  grantNumber: "",
  lgdNotice: "",
  retention: "",
  lgdPrivacy: "",
  providerNotice: "",
  returnEmail: "hello@unick-academy.pl",
  ready: false,
};

/** Shared copy shown before submission and frozen with each invitation and PDF. */
export function contractDocuments(
  settings: ContractSettings = SETTINGS_DEFAULT,
): ContractDocuments {
  return {
    version: CONTRACT_VERSION,
    organizer: "UNICK ACADEMY FOUNDATION",
    address: "ul. Nowa 23, Rumianek, 62-080 Tarnowo Podgórne",
    representative: "Milena Rudd — Prezes Zarządu",
    contact: "hello@unick-academy.pl",
    project:
      "Kreatorzy Przyszłości — program rozwoju kompetencji społecznych, przedsiębiorczych i kreatywności młodzieży",
    projectNumber: "FEWP.09.06-IZ.00-0084/24",
    grantNumber: settings.grantNumber,
    terms: [
      "Umowa dotyczy uczestnika wstępnie zakwalifikowanego do programu „Kreatorzy Przyszłości”, realizowanego w ramach projektu LGD „Aktywizacja społeczna w Dolinie Samy”, współfinansowanego z EFS+ i budżetu państwa w programie Fundusze Europejskie dla Wielkopolski 2021-2027. Przypisane grupy, miejsca oraz okres udziału wskazano w umowie.",
      "Fundacja zapewnia bezpłatny udział w przypisanych zajęciach, prowadzących, materiały przewidziane w programie oraz bezpieczne warunki udziału. Uczestnik nie ponosi opłat. Angielski jest narzędziem komunikacji podczas działań rozwijających kompetencje społeczne, przedsiębiorcze i kreatywność.",
      "Zajęcia odbywają się od grudnia 2026 do końca kwietnia 2027, w podanym dniu tygodnia i godzinach. Nie odbywają się podczas przerwy świątecznej 23–31 grudnia 2026, 1 i 6 stycznia 2027, ferii zimowych w Wielkopolsce 15–28 lutego 2027 oraz wiosennej przerwy świątecznej 25–30 marca 2027. Pierwszą datę zajęć wskazano powyżej; inne zmiany Fundacja uzgadnia z rodziną.",
      "Uczestnik zobowiązuje się przestrzegać zasad bezpieczeństwa i szanować innych uczestników. Rodzic lub pełnoletni uczestnik informuje Fundację o nieobecności, zmianie danych kontaktowych lub rezygnacji. Rezygnację można zgłosić na adres kontaktowy Fundacji; umowa nie przewiduje kar ani zwrotu grantu przez rodzinę.",
      "Fundacja przekazuje harmonogram i informuje o zmianach. Zmiany terminu lub miejsca pozostają zgodne z zasadami projektu. Odbiór dziecka, osoby upoważnione i ewentualny samodzielny powrót uzgadnia się osobno przed zajęciami; ta umowa nie upoważnia do wycieczek lub transportu dziecka.",
      "Potrzeby dostępności można zgłosić bezpośrednio Fundacji. Nie trzeba podawać diagnozy w formularzu. Fundacja uzgadnia potrzebne dostosowania indywidualnie i udostępnia standardy ochrony małoletnich w miejscu zajęć oraz na żądanie rodzica.",
      "Umowa nie obejmuje zgody na publikację wizerunku, głosu ani prac uczestnika, marketing, newsletter lub przekazywanie materiałów do narzędzi AI. Publikacja wymaga osobnego uzgodnienia i, gdy jest wymagana, odrębnej dobrowolnej zgody. Odmowa nie wpływa na udział w zajęciach.",
      "Wypełnienie formularza zapisuje dane i przygotowuje dokument. Nie zastępuje podpisów własnoręcznych wymaganych w tym procesie. Umowę podpisuje pełnoletni uczestnik albo rodzic/opiekun prawny oraz upoważniony przedstawiciel Fundacji. Po wygenerowaniu dokument należy wydrukować i podpisać, przesłać czytelny skan na adres wskazany przy pobieraniu, a papierowy oryginał dostarczyć na pierwsze zajęcia. Fundacja weryfikuje dokumenty i przekazuje rodzinie egzemplarz podpisany przez jej przedstawiciela. Samo pobranie PDF nie kończy kwalifikacji.",
    ],
    privacy: [
      "Administratorem danych zbieranych przez ten formularz jest UNICK ACADEMY FOUNDATION, ul. Nowa 23, Rumianek, 62-080 Tarnowo Podgórne, KRS 0001212961, NIP 7812102071, REGON 543545058. Sprawy dotyczące danych: hello@unick-academy.pl.",
      "Dane służą przygotowaniu i wykonaniu umowy, organizacji udziału, kontaktowi z rodziną, dokumentowaniu i rozliczeniu projektu oraz obowiązkom archiwizacji. Dane osoby będącej stroną umowy przetwarzamy w zakresie niezbędnym na podstawie art. 6 ust. 1 lit. b RODO. Obowiązkowa dokumentacja projektu jest przetwarzana na podstawie art. 6 ust. 1 lit. c RODO w związku z właściwymi przepisami ustawy wdrożeniowej z 28 kwietnia 2022 r. Obsługa spraw organizacyjnych przedstawiciela i ochrona roszczeń — w niezbędnym zakresie na podstawie art. 6 ust. 1 lit. f RODO. Potwierdzenie przeczytania informacji nie jest zgodą marketingową.",
      "Zapisujemy dane uczestnika, wiek na dzień pierwszego wsparcia, gminę i miejscowość, dane osoby podpisującej, telefon, e-mail oraz potwierdzenia. Data urodzenia służy wyłącznie wyliczeniu wieku i sprawdzeniu, kto podpisuje dokument; nie jest zapisywana z umową ani eksportowana do kontaktów. Nie zbieramy PESEL-u, numeru dowodu, dokładnego adresu dziecka ani diagnozy.",
      "Odbiorcami są upoważnione osoby Fundacji, dostawcy utrzymania strony i przechowywania danych na podstawie odpowiednich umów oraz LGD Dolina Samy, Województwo Wielkopolskie i uprawnione instytucje w zakresie koniecznym do realizacji i kontroli projektu. Informacje tych administratorów są udostępnione poniżej. Dane nie służą profilowaniu, automatycznemu przyjęciu ani marketingowi.",
      "Dokumenty przechowujemy przez okres realizacji i wymaganej archiwizacji wynikający z umowy grantowej oraz przepisów programu; upływ okresu może zostać przedłużony przez kontrolę lub postępowanie. Szczegółowy okres i podstawa jego liczenia są wskazane w informacji projektowej Fundacji przekazanej z dokumentami.",
      ...(settings.retention ? [settings.retention] : []),
      ...(settings.providerNotice ? [settings.providerNotice] : []),
      "Można żądać dostępu, sprostowania, ograniczenia przetwarzania i — gdy istnieją podstawy — usunięcia lub przeniesienia danych; przysługuje sprzeciw wobec operacji opartych na uzasadnionym interesie i skarga do Prezesa UODO. Nie wszystkie dane rozliczeniowe mogą być usunięte przed upływem obowiązkowej archiwizacji. Podanie wymaganych danych jest niezbędne do przygotowania umowy i udokumentowania udziału; pomyłki można wyjaśnić z Fundacją bez ponownej rekrutacji.",
    ],
    lgdNotice: settings.lgdNotice,
    lgdPrivacy: settings.lgdPrivacy,
    returnEmail: settings.returnEmail,
    regionalNotice: "/foundation/contracts/informacja-wojewodztwa.pdf",
  };
}

/** Missing legal/organisational details are configured once by the Foundation, never asked of parents. */
export function configurationIssue(settings: ContractSettings): string | null {
  if (
    !settings.ready ||
    !settingsSchema.safeParse(settings).success ||
    (settings.lgdPrivacy?.length ?? 0) < 50 ||
    (settings.providerNotice?.length ?? 0) < 20
  )
    return "Uzupełnij dane projektu poniżej, aby przygotowywać linki dla rodziców.";
  return null;
}

/** Explicit review mode while project details are being completed; never described as final paperwork. */
export function draftContractDocuments(
  settings: ContractSettings = SETTINGS_DEFAULT,
): ContractDocuments {
  const documents = contractDocuments(settings);
  documents.draft = true;
  documents.grantNumber ||= "DO UZUPEŁNIENIA";
  documents.version += " · DO UZUPEŁNIENIA";
  documents.lgdNotice ||=
    "https://dolinasamy.pl/nabor-nr-20906adsgrantyefs.html";
  documents.terms.unshift(
    "To wersja do sprawdzenia. Numer umowy grantowej i brakujące informacje projektu Fundacja uzupełni przed przekazaniem ostatecznego pakietu do podpisu. Potwierdzenie terminu i zapis danych w tej wersji nie oznaczają podpisania umowy.",
  );
  documents.privacy.push(
    "Dokument jest przygotowywany do uzupełnienia. Fundacja udostępni pełny zestaw informacji projektowych wraz z ostateczną wersją. Dane w formularzu przetwarzamy w celu kontaktu, potwierdzenia terminu i przygotowania dokumentów; pytania i żądania dotyczące danych można kierować na hello@unick-academy.pl.",
  );
  return documents;
}
