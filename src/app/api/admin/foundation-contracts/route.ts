import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { contractGroups } from "@/lib/foundation/contracts/groups";
import {
  contactsCsv,
  inviteInputSchema,
  type ContractInvitation,
  type ParticipantData,
} from "@/lib/foundation/contracts/model";
import {
  configurationIssue,
  contractDocuments,
  draftContractDocuments,
} from "@/lib/foundation/contracts/documents";
import {
  adminContext,
  hashToken,
  json,
  privateHeaders,
  readBody,
} from "@/lib/foundation/contracts/server";
import { readContractSettings } from "@/lib/foundation/contracts/settings";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = await adminContext();
  if (!context)
    return json({ error: "Zaloguj się jako administrator Fundacji." }, 403);
  const rows: {
    id: string;
    created_at: string;
    participant: ParticipantData;
    snapshot: ContractInvitation;
    signed_at: string | null;
  }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await context.db
      .from("foundation_contract_submissions")
      .select("id,created_at,participant,snapshot,signed_at,scan_received_at")
      .order("created_at")
      .order("id")
      .range(offset, offset + 499);
    if (error)
      return json({ error: "Nie udało się pobrać kompletu umów." }, 503);
    rows.push(...data);
    if (data.length < 500) break;
  }
  if (request.nextUrl.searchParams.get("format") === "csv")
    return new Response(contactsCsv(rows), {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="Kreatorzy-uczestnicy-kontakty.csv"',
      },
    });
  // Administrative UI does not download PDFs until explicitly requested.
  return json({ submissions: rows });
}
export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (!context)
    return json({ error: "Zaloguj się jako administrator Fundacji." }, 403);
  try {
    const parsed = inviteInputSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return json(
        { error: "Sprawdź uczestnika, daty i przypisane grupy." },
        400,
      );
    const input = parsed.data;
    const settings = await readContractSettings(context.db);
    const issue = configurationIssue(settings);
    if (issue && !input.draft) return json({ error: issue }, 409);
    const { data: declaration, error: declarationError } = await context.db
      .from("foundation_interest_declarations")
      .select("id,participant_first_name")
      .eq("id", input.declarationId)
      .maybeSingle();
    if (declarationError)
      return json({ error: "Nie udało się sprawdzić zgłoszenia." }, 503);
    if (!declaration)
      return json({ error: "Nie znaleziono wybranego uczestnika." }, 404);
    if (
      String(declaration.participant_first_name)
        .normalize("NFC")
        .trim()
        .toLocaleLowerCase("pl-PL") !==
      input.participantLabel.normalize("NFC").trim().toLocaleLowerCase("pl-PL")
    )
      return json(
        {
          error:
            "Imię i nazwisko musi odpowiadać wybranemu zgłoszeniu. Najpierw wyjaśnij ewentualną pomyłkę w danych.",
        },
        400,
      );
    const groups = input.groupIds.map((id) =>
      contractGroups.find((g) => g.id === id),
    );
    if (groups.some((g) => !g))
      return json({ error: "Nieprawidłowa grupa." }, 400);
    const firstDate = groups.map((g) => g!.firstSupport).sort()[0];
    if (input.firstSupport !== firstDate || input.lastSupport !== "2027-04-30")
      return json(
        {
          error: `Dla wybranych grup pierwsze wsparcie przypada ${firstDate}, a koniec projektu 2027-04-30.`,
        },
        400,
      );
    const token = randomBytes(32).toString("base64url");
    const documents = input.draft
      ? draftContractDocuments(settings)
      : contractDocuments(settings);
    documents.regionalNotice = `${request.nextUrl.origin}${documents.regionalNotice}`;
    const { data, error } = await context.db
      .from("foundation_contract_invites")
      .insert({
        declaration_id: input.declarationId,
        participant_label: input.participantLabel,
        token_hash: hashToken(token),
        created_by: context.user.id,
        first_support: input.firstSupport,
        last_support: input.lastSupport,
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
        documents,
        groups: groups.map((g) => {
          const {
            firstSupport: _firstSupport,
            label: _label,
            ...snapshot
          } = g!;
          void _firstSupport;
          void _label;
          return snapshot;
        }),
      })
      .select("id")
      .single();
    if (error?.code === "P0001")
      return json(
        {
          error:
            "Grupa ma już 12 aktywnych przydziałów. Sprawdź aktualne listy przed utworzeniem kolejnego linku.",
        },
        409,
      );
    if (error?.code === "23505")
      return json(
        {
          error:
            "Ta osoba ma już aktywny link. Wycofaj go przed przygotowaniem nowej wersji; poprzedni zapis pozostanie w historii.",
        },
        409,
      );
    if (error || !data)
      return json({ error: "Nie udało się przygotować linku." }, 503);
    // Fragment keeps the bearer secret out of HTTP URLs, access logs and referrers.
    return json(
      {
        id: data.id,
        url: `${request.nextUrl.origin}/uczestnictwo#token=${token}`,
      },
      201,
    );
  } catch {
    return json(
      { error: "Nie udało się przygotować linku. Sprawdź dane." },
      400,
    );
  }
}
