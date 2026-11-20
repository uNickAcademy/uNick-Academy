import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { tokenSchema, type ContractInvitation } from "./model";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: privateHeaders });
}
export async function readBody(request: NextRequest) {
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (request.headers.get("origin") &&
      request.headers.get("origin") !== request.nextUrl.origin)
  )
    throw new Error("origin");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 128000) {
      await reader.cancel();
      throw new Error("size");
    }
    chunks.push(part.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
export async function adminContext() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? { db: createAdminClient(), user } : null;
}
export async function liveInvitation(token: unknown) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const db = createAdminClient();
  const { data, error } = await db
    .from("foundation_contract_invites")
    .select(
      "id,declaration_id,participant_label,groups,first_support,last_support,documents,created_at,expires_at,revoked_at",
    )
    .eq("token_hash", hashToken(parsed.data))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("database");
  return data
    ? { db, invite: data as ContractInvitation, token: parsed.data }
    : null;
}
export function pdfResponse(base64: string) {
  return new Response(new Uint8Array(Buffer.from(base64, "base64")), {
    headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Umowa-Kreatorzy-Przyszlosci.pdf"',
    },
  });
}
