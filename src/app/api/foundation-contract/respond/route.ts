import { NextRequest } from "next/server";
import { z } from "zod";
import { tokenSchema } from "@/lib/foundation/contracts/model";
import {
  json,
  liveInvitation,
  readBody,
} from "@/lib/foundation/contracts/server";
export const runtime = "nodejs";
const responseSchema = z
  .object({
    token: tokenSchema,
    choice: z.enum(["yes", "no"]),
    note: z
      .string()
      .trim()
      .max(1500)
      .refine((value) => !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
      .default(""),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const parsed = responseSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return json(
        { error: "Wybierz odpowiedź i skróć wiadomość do 1500 znaków." },
        400,
      );
    const context = await liveInvitation(parsed.data.token);
    if (!context)
      return json(
        { error: "Link wygasł lub został wycofany. Poproś Fundację o nowy." },
        404,
      );
    // A response is immutable; corrections use a new invitation and retain the history.
    const { error } = await context.db
      .from("foundation_contract_responses")
      .upsert(
        {
          invite_id: context.invite.id,
          choice: parsed.data.choice,
          note: parsed.data.note,
        },
        { onConflict: "invite_id", ignoreDuplicates: true },
      );
    if (error)
      return json(
        { error: "Nie udało się zapisać odpowiedzi. Spróbuj ponownie." },
        503,
      );
    const { data, error: readError } = await context.db
      .from("foundation_contract_responses")
      .select("choice")
      .eq("invite_id", context.invite.id)
      .single();
    if (readError)
      return json(
        {
          error:
            "Nie udało się sprawdzić odpowiedzi. Otwórz ponownie ten sam link.",
        },
        503,
      );
    return json({ choice: data.choice });
  } catch {
    return json(
      { error: "Nie udało się zapisać odpowiedzi. Spróbuj ponownie." },
      400,
    );
  }
}
