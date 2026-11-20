import { z } from "zod";
import { calculateAgeOnDate } from "../options";
import { dateSchema, tokenSchema, type ContractInvitation } from "./model";
const personName = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{M} .’'\-]+$/u);
export const detailsSchema = z
  .object({
    token: tokenSchema,
    participantFirstName: personName,
    participantLastName: personName,
    birthDate: dateSchema,
    municipality: z.enum([
      "tarnowo_podgorne",
      "rokietnica",
      "kazmierz",
      "szamotuly",
    ]),
    address: z
      .string()
      .trim()
      .min(8)
      .max(500)
      .refine((value) => !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)),
    contactRole: z.enum(["parent", "guardian", "adult"]),
    contactFirstName: personName,
    contactLastName: personName,
    email: z.string().trim().email().max(180),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,30}$/),
  })
  .strict();
export type ParticipantDetails = Omit<
  z.infer<typeof detailsSchema>,
  "token" | "birthDate"
> & { ageAtStart: number };
export function validateDetails(
  input: unknown,
  invite: ContractInvitation,
  today: string,
) {
  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      error:
        "Sprawdź dane uczestnika, pełny adres zamieszkania i dane kontaktowe.",
    };
  const value = parsed.data;
  const age = calculateAgeOnDate(value.birthDate, today),
    ageAtStart = calculateAgeOnDate(value.birthDate, invite.first_support);
  if (age === null || ageAtStart === null || age > 110)
    return { ok: false as const, error: "Sprawdź datę urodzenia." };
  if (age >= 18 !== (value.contactRole === "adult"))
    return {
      ok: false as const,
      error:
        "Dla osoby niepełnoletniej podaj rodzica lub opiekuna; osoba pełnoletnia podaje własne dane kontaktowe.",
    };
  if (
    value.contactRole === "adult" &&
    (value.contactFirstName !== value.participantFirstName ||
      value.contactLastName !== value.participantLastName)
  )
    return {
      ok: false as const,
      error: "Jako osoba pełnoletnia podaj swoje dane kontaktowe.",
    };
  const { token: _token, birthDate: _birthDate, ...data } = value;
  void _token;
  void _birthDate;
  const normalize = (name: string) =>
    name
      .normalize("NFC")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("pl-PL");
  const needsReview =
    normalize(`${data.participantFirstName} ${data.participantLastName}`) !==
      normalize(invite.participant_label) ||
    invite.groups.some(
      (group) => ageAtStart < group.minAge || ageAtStart > group.maxAge,
    );
  return {
    ok: true as const,
    data: { ...data, ageAtStart } satisfies ParticipantDetails,
    needsReview,
  };
}
