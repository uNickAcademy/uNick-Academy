import { z } from "zod";
import { calculateAgeOnDate, municipalityOptions } from "../options";

export const CONTRACT_VERSION = "2026-11-20.1";
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const name = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[\p{L}\p{M} .’'\-]+$/u,
    "Wpisz imię lub nazwisko, bez cyfr i znaków specjalnych.",
  );
const text = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => !/[\x00-\x1f]/.test(value));
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => calculateAgeOnDate(value, value) === 0, "Sprawdź datę.");
export const inviteInputSchema = z
  .object({
    declarationId: z.string().uuid(),
    participantLabel: text,
    groupIds: z
      .array(z.string().max(100))
      .min(1)
      .max(8)
      .refine((values) => new Set(values).size === values.length),
    firstSupport: dateSchema,
    lastSupport: dateSchema,
    draft: z.boolean().default(false),
  })
  .strict()
  .refine((value) => value.firstSupport <= value.lastSupport, {
    message: "Zakończenie nie może poprzedzać pierwszych zajęć.",
  });

export type ContractGroup = {
  id: string;
  title: string;
  location: string;
  schedule: string;
  minAge: number;
  maxAge: number;
};
export type ContractDocuments = {
  version: string;
  organizer: string;
  address: string;
  representative: string;
  contact: string;
  project: string;
  projectNumber: string;
  grantNumber: string;
  terms: string[];
  privacy: string[];
  lgdNotice: string;
  regionalNotice: string;
  lgdPrivacy?: string;
  returnEmail?: string;
  draft?: boolean;
};
export type ContractInvitation = {
  id: string;
  declaration_id: string;
  participant_label: string;
  groups: ContractGroup[];
  first_support: string;
  last_support: string;
  documents: ContractDocuments;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};
export const formSchema = z
  .object({
    token: tokenSchema,
    participantFirstName: name,
    participantLastName: name,
    birthDate: dateSchema,
    sex: z.enum(["K", "M"]),
    municipality: z.enum([
      "tarnowo_podgorne",
      "rokietnica",
      "kazmierz",
      "szamotuly",
    ]),
    town: text,
    signerType: z.enum(["parent", "guardian", "adult"]),
    signerFirstName: name,
    signerLastName: name,
    email: z.string().trim().email("Sprawdź adres e-mail.").max(180),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,30}$/, "Sprawdź numer telefonu."),
    accessibilityContact: z.boolean(),
    participationAccepted: z.literal(true),
    residenceConfirmed: z.literal(true),
    privacyAcknowledged: z.literal(true),
    authorityConfirmed: z.literal(true),
  })
  .strict();
export type ContractForm = z.infer<typeof formSchema>;
export type ParticipantData = Omit<ContractForm, "token" | "birthDate"> & {
  ageAtStart: number;
};

export function validateParticipant(
  input: unknown,
  invite: ContractInvitation,
  today: string,
) {
  const parsed = formSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      error:
        "Sprawdź wymagane pola, dane kontaktowe i potwierdzenia w formularzu.",
    };
  const form = parsed.data;
  const normalizedName = (value: string) =>
    value
      .normalize("NFC")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("pl-PL");
  if (
    normalizedName(
      `${form.participantFirstName} ${form.participantLastName}`,
    ) !== normalizedName(invite.participant_label)
  )
    return {
      ok: false as const,
      error:
        "Dane uczestnika różnią się od danych przyjętej osoby. Skontaktuj się z Fundacją, aby je poprawić.",
    };
  const ageAtStart = calculateAgeOnDate(form.birthDate, invite.first_support);
  const ageToday = calculateAgeOnDate(form.birthDate, today);
  if (ageAtStart === null || ageToday === null)
    return { ok: false as const, error: "Sprawdź datę urodzenia." };
  if (
    invite.groups.some(
      (group) => ageAtStart < group.minAge || ageAtStart > group.maxAge,
    )
  ) {
    return {
      ok: false as const,
      error:
        "Podana data urodzenia nie pasuje do przypisanej grupy. Skontaktuj się z Fundacją, aby wyjaśnić dane.",
    };
  }
  if (ageToday >= 18 !== (form.signerType === "adult"))
    return {
      ok: false as const,
      error:
        ageToday >= 18
          ? "Pełnoletni uczestnik podpisuje umowę samodzielnie."
          : "Umowę osoby niepełnoletniej podpisuje rodzic lub opiekun prawny.",
    };
  if (
    form.signerType === "adult" &&
    (form.signerFirstName !== form.participantFirstName ||
      form.signerLastName !== form.participantLastName)
  )
    return {
      ok: false as const,
      error: "Wpisz własne imię i nazwisko jako osoby podpisującej.",
    };
  const { token: _token, birthDate: _birthDate, ...data } = form;
  void _token;
  void _birthDate; // Intentionally excluded from every persisted document and contact export.
  return {
    ok: true as const,
    data: { ...data, ageAtStart } satisfies ParticipantData,
  };
}

export function contactsCsv(
  rows: {
    id: string;
    created_at: string;
    participant: ParticipantData;
    snapshot: ContractInvitation;
    signed_at: string | null;
  }[],
) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    const safe = /^[\s\uFEFF]*[=+\-@]/u.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = [
    "Numer umowy",
    "Uczestnik",
    "Osoba do kontaktu",
    "E-mail",
    "Telefon",
    "Gmina zamieszkania",
    "Miejscowość",
    "Przypisane grupy",
    "Data zapisu danych",
    "Podpis papierowy",
  ];
  // Corrections create a new document, while the contact list keeps one latest row per participant.
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of [...rows].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  ))
    latest.set(row.snapshot.declaration_id, row);
  return (
    "\uFEFF" +
    [
      header,
      ...Array.from(latest.values()).map((row) => [
        `KP/${row.snapshot.id}`,
        `${row.participant.participantFirstName} ${row.participant.participantLastName}`,
        `${row.participant.signerFirstName} ${row.participant.signerLastName}`,
        row.participant.email,
        row.participant.phone,
        municipalityOptions.find(
          (m) => m.value === row.participant.municipality,
        )?.label,
        row.participant.town,
        row.snapshot.groups
          .map((g) => `${g.title} — ${g.location}`)
          .join(" | "),
        row.created_at,
        row.signed_at ? "otrzymany" : "oczekuje",
      ]),
    ]
      .map((row) => row.map(cell).join(";"))
      .join("\r\n")
  );
}
