import {
  adminContext,
  json,
  pdfResponse,
} from "@/lib/foundation/contracts/server";
import { readContractSettings } from "@/lib/foundation/contracts/settings";
import { contractPreview } from "@/lib/foundation/contracts/preview";
import { generateContractPdf } from "@/lib/foundation/contracts/pdf";
export const runtime = "nodejs";
export async function GET() {
  const context = await adminContext();
  if (!context) return json({ error: "Brak uprawnień." }, 403);
  try {
    const { invitation, participant } = contractPreview(
      await readContractSettings(context.db),
    );
    const pdf = await generateContractPdf(
      participant,
      invitation,
      new Date().toISOString(),
    );
    return pdfResponse(pdf.toString("base64"));
  } catch {
    return json(
      { error: "Nie udało się przygotować podglądu dokumentów." },
      503,
    );
  }
}
