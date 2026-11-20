import { NextRequest } from "next/server";
import {
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
        { error: "Link wygasł lub został wycofany. Poproś Fundację o pomoc." },
        404,
      );
    const { data, error } = await context.db
      .from("foundation_contract_submissions")
      .select("pdf_base64")
      .eq("invite_id", context.invite.id)
      .maybeSingle();
    if (error)
      return json(
        { error: "Nie udało się pobrać dokumentu. Spróbuj ponownie." },
        503,
      );
    return data
      ? pdfResponse(data.pdf_base64)
      : json({ error: "Najpierw uzupełnij formularz." }, 404);
  } catch {
    return json({ error: "Nie udało się pobrać umowy." }, 400);
  }
}
