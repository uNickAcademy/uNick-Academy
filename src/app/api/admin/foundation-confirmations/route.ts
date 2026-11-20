import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  adminContext,
  hashToken,
  json,
  privateHeaders,
  readBody,
} from "@/lib/foundation/contracts/server";
import { draftContractDocuments } from "@/lib/foundation/contracts/documents";
import { readContractSettings } from "@/lib/foundation/contracts/settings";
import {
  CONFIRMATION_CAMPAIGN,
  CONFIRMATION_SENDER,
  sendConfirmation,
  type MailingRecipient,
} from "@/lib/foundation/contracts/mailing";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  const { data: rows, error } = await context.db
    .from("foundation_confirmation_mailings")
    .select(
      "id,participant_label,to_email,status,sender,sent_at,last_error,provider_message_id",
    )
    .eq("campaign", CONFIRMATION_CAMPAIGN)
    .order("sort_order")
    .limit(200);
  if (error)
    return json({ error: "Nie udało się pobrać rejestru wysyłki." }, 503);
  const { count, error: detailsError } = await context.db
    .from("foundation_participant_details")
    .select("invite_id", { count: "exact", head: true });
  if (detailsError)
    return json({ error: "Nie udało się sprawdzić potwierdzeń." }, 503);
  if (request.nextUrl.searchParams.get("format") === "csv") {
    const { data: details, error: exportError } = await context.db
      .from("foundation_participant_details")
      .select(
        "participant,created_at,name_needs_review,foundation_contract_invites(participant_label,groups)",
      )
      .order("created_at")
      .limit(1000);
    if (exportError)
      return json({ error: "Nie udało się pobrać danych." }, 503);
    const cell = (value: unknown) => {
      const raw = String(value ?? "");
      return (
        '"' +
        (/^[\s\uFEFF]*[=+\-@]/u.test(raw) ? "'" + raw : raw).replaceAll(
          '"',
          '""',
        ) +
        '"'
      );
    };
    const csv =
      "\uFEFF" +
      [
        [
          "Uczestnik",
          "Wiek na pierwsze zajęcia",
          "Gmina",
          "Adres zamieszkania",
          "Kontakt",
          "Rodzic/opiekun/uczestnik",
          "E-mail",
          "Telefon",
          "Wymaga wyjaśnienia danych",
          "Data zapisu",
        ],
        ...(details ?? []).map((row) => {
          const p = row.participant;
          return [
            `${p.participantFirstName} ${p.participantLastName}`,
            p.ageAtStart,
            p.municipality,
            p.address,
            p.contactRole,
            `${p.contactFirstName} ${p.contactLastName}`,
            p.email,
            p.phone,
            row.name_needs_review ? "tak" : "nie",
            row.created_at,
          ];
        }),
      ]
        .map((row) => row.map(cell).join(";"))
        .join("\r\n");
    return new Response(csv, {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="Kreatorzy-dane-do-umow.csv"',
      },
    });
  }
  return json({ rows, sender: CONFIRMATION_SENDER, detailsCount: count ?? 0 });
}
export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  if (!process.env.RESEND_API_KEY)
    return json(
      { error: "Nie skonfigurowano wysyłki z hello@unick-academy.pl." },
      503,
    );
  let id: string | undefined;
  try {
    const input = z
      .object({ id: z.string().uuid() })
      .strict()
      .safeParse(await readBody(request));
    if (!input.success)
      return json({ error: "Wybierz odbiorcę z przygotowanej listy." }, 400);
    id = input.data.id;
    // Only one request can claim a recipient. Uncertain sends are never retried automatically.
    const { data: row, error: claimError } = await context.db
      .from("foundation_confirmation_mailings")
      .update({ status: "sending" })
      .eq("id", id)
      .eq("campaign", CONFIRMATION_CAMPAIGN)
      .eq("status", "queued")
      .select("*")
      .maybeSingle();
    if (claimError)
      return json({ error: "Nie udało się rozpocząć wysyłki." }, 503);
    if (!row)
      return json(
        { error: "Ta wiadomość została już obsłużona lub trwa jej wysyłka." },
        409,
      );
    const { data: declaration, error: sourceError } = await context.db
      .from("foundation_interest_declarations")
      .select("email,participant_first_name")
      .eq("id", row.declaration_id)
      .single();
    if (
      sourceError ||
      !declaration ||
      declaration.email.toLowerCase().trim() !==
        row.to_email.toLowerCase().trim()
    )
      throw new Error(
        "Adres kontaktowy zmienił się od przygotowania listy. Sprawdź zgłoszenie.",
      );
    if (!z.string().email().safeParse(row.to_email).success)
      throw new Error("Adres e-mail wymaga poprawienia.");
    const { error: revokeError } = await context.db
      .from("foundation_contract_invites")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: context.user.id,
      })
      .eq("declaration_id", row.declaration_id)
      .is("revoked_at", null);
    if (revokeError)
      throw new Error("Nie udało się przygotować aktualnego linku.");
    const token = randomBytes(32).toString("base64url"),
      documents = draftContractDocuments(
        await readContractSettings(context.db),
      );
    const { data: invite, error: inviteError } = await context.db
      .from("foundation_contract_invites")
      .insert({
        declaration_id: row.declaration_id,
        participant_label: row.participant_label,
        groups: row.groups,
        first_support: row.first_support,
        last_support: row.last_support,
        documents,
        created_by: context.user.id,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      })
      .select("id")
      .single();
    if (inviteError || !invite)
      throw new Error(
        "Nie udało się utworzyć linku. Sprawdź limit miejsc i przydział.",
      );
    const { error: linkError } = await context.db
      .from("foundation_confirmation_mailings")
      .update({ invite_id: invite.id })
      .eq("id", row.id)
      .eq("status", "sending");
    if (linkError)
      throw new Error("Nie udało się zapisać przydziału do wysyłki.");
    const providerId = await sendConfirmation(
      row as MailingRecipient,
      `https://unick-academy.pl/uczestnictwo#token=${token}`,
    );
    const { error: saveError } = await context.db
      .from("foundation_confirmation_mailings")
      .update({
        status: "sent",
        provider_message_id: providerId,
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id)
      .eq("status", "sending");
    if (saveError)
      return json(
        {
          error:
            "Operator przyjął wiadomość, lecz nie udało się zaktualizować rejestru. Nie ponawiaj wysyłki.",
        },
        503,
      );
    return json({ ok: true, sender: "hello@unick-academy.pl", providerId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nie udało się wysłać wiadomości.";
    if (id)
      await context.db
        .from("foundation_confirmation_mailings")
        .update({ status: "error", last_error: message.slice(0, 500) })
        .eq("id", id)
        .eq("status", "sending");
    return json({ error: message }, 503);
  }
}
