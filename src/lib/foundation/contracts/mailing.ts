import { Resend } from "resend";
import type { ContractGroup } from "./model";
export const CONFIRMATION_CAMPAIGN = "preliminary-2026-11-21-v1";
export const CONFIRMATION_SENDER =
  "uNick Academy Foundation <hello@unick-academy.pl>";
export type MailingRecipient = {
  id: string;
  participant_label: string;
  salutation_name: string;
  grammatical_gender: "male" | "female" | "neutral";
  to_email: string;
  groups: ContractGroup[];
  first_support: string;
};
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const schedules: Record<string, string> = {
  G1: "w środy, w godzinach 16:30–17:30, w CDIO przy ul. Poznańskiej 99 w Tarnowie Podgórnym",
  G2: "w środy, w godzinach 17:40–19:40, w CDIO przy ul. Poznańskiej 99 w Tarnowie Podgórnym",
  G9: "w środy, w godzinach 17:40–19:40, w CDIO przy ul. Poznańskiej 99 w Tarnowie Podgórnym",
  G3: "we wtorki, w godzinach 16:30–17:30, w Bibliotece Publicznej i Centrum Kultury przy ul. Nowowiejskiej 15 w Kaźmierzu",
  G4: "we wtorki, w godzinach 17:30–19:30, w Bibliotece Publicznej i Centrum Kultury przy ul. Nowowiejskiej 15 w Kaźmierzu",
  G5: "w czwartki, w godzinach 16:30–17:30, w sali OSP przy ul. Szkolnej 18B w Rokietnicy",
  G6: "w czwartki, w godzinach 17:30–18:30, w sali OSP przy ul. Szkolnej 18B w Rokietnicy",
  G7: "w czwartki, w godzinach 17:30–18:30, w CDIO przy ul. Poznańskiej 99 w Tarnowie Podgórnym",
  G8: "w czwartki, w godzinach 16:30–17:30, w CDIO przy ul. Poznańskiej 99 w Tarnowie Podgórnym",
};
export function confirmationMessage(row: MailingRecipient, url: string) {
  const verb =
    row.grammatical_gender === "male"
      ? "został wstępnie zakwalifikowany"
      : row.grammatical_gender === "female"
        ? "została wstępnie zakwalifikowana"
        : "zostało wstępnie zakwalifikowane";
  const name =
    row.grammatical_gender === "neutral"
      ? "Twoje dziecko"
      : row.salutation_name;
  const course = row.groups
    .map((group) =>
      group.title
        .replace("— starsi", "— grupa starsza")
        .replace("— młodsi", "— grupa młodsza"),
    )
    .join(" oraz ");
  const description = row.groups.map((group) => schedules[group.id]).join("; ");
  if (!description || row.groups.some((group) => !schedules[group.id]))
    throw new Error("Nieznany harmonogram grupy.");
  const first = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(row.first_support + "T12:00:00Z")) + ' r.';
  const subject =
    "Kreatorzy Przyszłości — wstępna kwalifikacja" +
    (row.grammatical_gender === "neutral" ? "" : ` — ${row.salutation_name}`);
  const text = `Dzień dobry,\n\nBardzo miło nam poinformować, że ${name} ${verb} na zajęcia ${course} w ramach bezpłatnego programu „Kreatorzy Przyszłości”.\n\nZajęcia będą odbywać się ${description}.\n\nPierwsze spotkanie odbędzie się ${first}\n\nUprzejmie prosimy o potwierdzenie uczestnictwa przez poniższy formularz:\nWypełnij formularz i potwierdź uczestnictwo: ${url}\n\nW formularzu potwierdzisz, czy termin i miejsce nadal odpowiadają, uzupełnisz dane oraz zapoznasz się z warunkami udziału.\n\nJeśli proponowany termin nie odpowiada, zaznacz to w formularzu i zostaw krótką wiadomość — skontaktujemy się, aby omówić możliwości.\n\nDo zobaczenia!\nuNick Academy Foundation\nhello@unick-academy.pl`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.65;color:#273f35;max-width:660px"><p>Dzień dobry,</p><p>Bardzo miło nam poinformować, że <strong>${escapeHtml(name)} ${verb} na zajęcia ${escapeHtml(course)}</strong> w ramach bezpłatnego programu „Kreatorzy Przyszłości”.</p><p>Zajęcia będą odbywać się <strong>${escapeHtml(description)}</strong>.</p><p><strong>Pierwsze spotkanie odbędzie się ${escapeHtml(first)}</strong></p><p>Uprzejmie prosimy o potwierdzenie uczestnictwa przez poniższy formularz:</p><p><strong><a href="${escapeHtml(url)}" style="color:#315c4b">Wypełnij formularz i potwierdź uczestnictwo</a></strong></p><p>W formularzu potwierdzisz, czy termin i miejsce nadal odpowiadają, uzupełnisz dane oraz zapoznasz się z warunkami udziału.</p><p>Jeśli proponowany termin nie odpowiada, zaznacz to w formularzu i zostaw krótką wiadomość — skontaktujemy się, aby omówić możliwości.</p><p>Do zobaczenia!</p><p><strong>uNick Academy Foundation</strong><br><a href="mailto:hello@unick-academy.pl" style="color:#315c4b">hello@unick-academy.pl</a></p></div>`;
  return { subject, text, html };
}
export async function sendConfirmation(row: MailingRecipient, url: string) {
  if (!process.env.RESEND_API_KEY)
    throw new Error("Brak konfiguracji skrzynki wysyłkowej.");
  const resend = new Resend(process.env.RESEND_API_KEY),
    message = confirmationMessage(row, url);
  const { data, error } = await resend.emails.send(
    {
      from: CONFIRMATION_SENDER,
      to: row.to_email,
      replyTo: "hello@unick-academy.pl",
      ...message,
    },
    { idempotencyKey: `${CONFIRMATION_CAMPAIGN}/${row.id}` },
  );
  if (error || !data?.id)
    throw new Error(
      error?.message ||
        "Brak potwierdzenia przyjęcia wiadomości przez operatora.",
    );
  return data.id;
}
