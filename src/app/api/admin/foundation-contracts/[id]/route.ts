import { NextRequest } from "next/server";
import { z } from "zod";
import {
  adminContext,
  json,
  pdfResponse,
  readBody,
} from "@/lib/foundation/contracts/server";
export const runtime = "nodejs";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return json({ error: "Nieprawidłowy numer dokumentu." }, 400);
  const { data, error } = await context.db
    .from("foundation_contract_submissions")
    .select("pdf_base64")
    .eq("id", id)
    .maybeSingle();
  if (error) return json({ error: "Nie udało się pobrać umowy." }, 503);
  return data
    ? pdfResponse(data.pdf_base64)
    : json({ error: "Nie znaleziono umowy." }, 404);
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success)
      return json({ error: "Nieprawidłowy numer." }, 400);
    const parsed = z
      .object({ action: z.enum(["signed", "scan", "revoke"]) })
      .strict()
      .safeParse(await readBody(request));
    if (!parsed.success) return json({ error: "Nieprawidłowa operacja." }, 400);
    if (parsed.data.action === "signed") {
      const { data, error } = await context.db
        .from("foundation_contract_submissions")
        .update({
          signed_at: new Date().toISOString(),
          signed_by: context.user.id,
        })
        .eq("id", id)
        .is("signed_at", null)
        .select("id");
      if (error)
        return json(
          { error: "Nie udało się zapisać potwierdzenia podpisu." },
          503,
        );
      if (!data?.length)
        return json(
          { error: "Umowa nie istnieje albo podpis był już potwierdzony." },
          409,
        );
    } else if (parsed.data.action === "scan") {
      const { data, error } = await context.db
        .from("foundation_contract_submissions")
        .update({
          scan_received_at: new Date().toISOString(),
          scan_received_by: context.user.id,
        })
        .eq("id", id)
        .is("scan_received_at", null)
        .select("id");
      if (error)
        return json({ error: "Nie udało się zapisać odbioru skanu." }, 503);
      if (!data?.length)
        return json(
          { error: "Skany tej umowy już oznaczono lub umowa nie istnieje." },
          409,
        );
    } else {
      const { data, error } = await context.db
        .from("foundation_contract_invites")
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: context.user.id,
        })
        .eq("id", id)
        .is("revoked_at", null)
        .select("id");
      if (error) return json({ error: "Nie udało się wycofać linku." }, 503);
      if (!data?.length)
        return json({ error: "Link nie istnieje albo był już wycofany." }, 409);
    }
    return json({ ok: true });
  } catch {
    return json({ error: "Nie udało się zapisać zmiany." }, 400);
  }
}
