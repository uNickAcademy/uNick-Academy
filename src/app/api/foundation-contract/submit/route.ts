import { NextRequest } from "next/server";
import { validateDetails } from "@/lib/foundation/contracts/details";
import {
  hashToken,
  json,
  liveInvitation,
  readBody,
} from "@/lib/foundation/contracts/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = (await readBody(request)) as { token?: unknown },
      context = await liveInvitation(input?.token);
    if (!context)
      return json(
        { error: "Link wygasł lub został wycofany. Poproś Fundację o nowy." },
        404,
      );
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const validation = validateDetails(input, context.invite, today);
    if (!validation.ok) return json({ error: validation.error }, 400);
    const { error } = await context.db.rpc(
      "foundation_save_participant_details",
      {
        p_token_hash: hashToken(context.token),
        p_participant: validation.data,
        p_needs_review: validation.needsReview,
      },
    );
    if (error?.message?.includes("schedule_not_confirmed"))
      return json({ error: "Najpierw potwierdź termin i miejsce zajęć." }, 409);
    if (error)
      return json(
        { error: "Nie udało się zapisać danych. Spróbuj ponownie." },
        503,
      );
    return json({ ok: true });
  } catch {
    return json(
      {
        error:
          "Nie udało się zapisać danych. Odśwież stronę i spróbuj ponownie.",
      },
      400,
    );
  }
}
