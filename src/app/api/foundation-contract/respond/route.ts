import { NextRequest } from "next/server";
import { z } from "zod";
import { tokenSchema } from "@/lib/foundation/contracts/model";
import {
  hashToken,
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
    const { data, error } = await context.db.rpc(
      "foundation_record_schedule_response",
      {
        p_token_hash: hashToken(context.token),
        p_choice: parsed.data.choice,
        p_note: parsed.data.note,
      },
    );
    if (error || !data)
      return json(
        { error: "Nie udało się zapisać odpowiedzi. Spróbuj ponownie." },
        503,
      );
    return json({ choice: data.choice, note: data.note });
  } catch {
    return json(
      { error: "Nie udało się zapisać odpowiedzi. Spróbuj ponownie." },
      400,
    );
  }
}
