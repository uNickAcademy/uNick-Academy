import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { validateParticipant } from "@/lib/foundation/contracts/model";
import { generateContractPdf } from "@/lib/foundation/contracts/pdf";
import {
  hashToken,
  json,
  liveInvitation,
  pdfResponse,
  readBody,
} from "@/lib/foundation/contracts/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = (await readBody(request)) as { token?: unknown };
    const context = await liveInvitation(input?.token);
    if (!context)
      return json(
        { error: "Link wygasł lub został wycofany. Poproś Fundację o nowy." },
        404,
      );
    const { db, invite, token } = context;
    const { data: response, error: responseError } = await db
      .from("foundation_contract_responses")
      .select("choice")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (responseError)
      return json(
        { error: "Nie udało się sprawdzić potwierdzenia terminu." },
        503,
      );
    if (response?.choice !== "yes")
      return json(
        { error: "Najpierw potwierdź, że termin i miejsce zajęć odpowiadają." },
        409,
      );
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const validation = validateParticipant(input, invite, today);
    if (!validation.ok) return json({ error: validation.error }, 400);
    const { data: existing, error: existingError } = await db
      .from("foundation_contract_submissions")
      .select("pdf_base64")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (existingError)
      return json(
        { error: "Nie udało się sprawdzić zapisu. Spróbuj ponownie." },
        503,
      );
    if (existing) return pdfResponse(existing.pdf_base64);
    const pdf = await generateContractPdf(
      validation.data,
      invite,
      new Date().toISOString(),
    );
    const { data: id, error } = await db.rpc("foundation_submit_contract", {
      p_token_hash: hashToken(token),
      p_participant: validation.data,
      p_snapshot: invite,
      p_pdf: pdf.toString("base64"),
      p_sha: createHash("sha256").update(pdf).digest("hex"),
    });
    if (error || !id)
      return json(
        {
          error:
            "Nie udało się zapisać umowy. Dane nie zostały potwierdzone. Spróbuj ponownie.",
        },
        503,
      );
    const { data: saved, error: readError } = await db
      .from("foundation_contract_submissions")
      .select("pdf_base64")
      .eq("id", id)
      .single();
    if (readError || !saved)
      return json(
        { error: "Dane zapisano. Pobierz umowę ponownie przez ten sam link." },
        503,
      );
    return pdfResponse(saved.pdf_base64);
  } catch {
    return json(
      {
        error:
          "Nie udało się przygotować umowy. Spróbuj ponownie; w razie trudności skontaktuj się z Fundacją.",
      },
      400,
    );
  }
}
