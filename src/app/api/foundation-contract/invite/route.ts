import { NextRequest } from "next/server";
import {
  json,
  liveInvitation,
  readBody,
} from "@/lib/foundation/contracts/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = (await readBody(request)) as { token?: unknown };
    const context = await liveInvitation(body?.token);
    if (!context)
      return json(
        { error: "Link wygasł lub został wycofany. Poproś Fundację o nowy." },
        404,
      );
    const { db, invite } = context;
    const { data, error } = await db
      .from("foundation_participant_details")
      .select("invite_id")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (error)
      return json(
        { error: "Nie udało się sprawdzić dokumentu. Spróbuj ponownie." },
        503,
      );
    const { data: response, error: responseError } = await db
      .from("foundation_contract_responses")
      .select("choice")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (responseError)
      return json(
        { error: "Nie udało się sprawdzić odpowiedzi. Spróbuj ponownie." },
        503,
      );
    // The link carries no child's name; details are entered by the recipient.
    return json({
      groups: invite.groups,
      firstSupport: invite.first_support,
      lastSupport: invite.last_support,
      documents: { contact: invite.documents.contact },
      submitted: Boolean(data),
      choice: response?.choice ?? null,
    });
  } catch {
    return json(
      {
        error:
          "Nie udało się otworzyć formularza. Spróbuj ponownie lub skontaktuj się z Fundacją.",
      },
      400,
    );
  }
}
