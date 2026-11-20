import { NextRequest } from "next/server";
import {
  adminContext,
  json,
  readBody,
} from "@/lib/foundation/contracts/server";
import { settingsSchema } from "@/lib/foundation/contracts/documents";
export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  try {
    const parsed = settingsSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return json(
        {
          error:
            "Uzupełnij numer grantu, adres HTTPS informacji LGD oraz konkretny okres archiwizacji.",
        },
        400,
      );
    const { error } = await context.db
      .from("foundation_contract_settings")
      .upsert({
        id: true,
        settings: parsed.data,
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
      });
    return error
      ? json({ error: "Nie udało się zapisać danych projektu." }, 503)
      : json({ ok: true });
  } catch {
    return json({ error: "Sprawdź dane projektu." }, 400);
  }
}
