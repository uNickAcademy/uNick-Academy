import { json } from "@/lib/foundation/contracts/server";
/** This stage only collects participant/contact details; no contract is issued or accepted. */
export async function POST() {
  return json(
    {
      error:
        "Na podstawie przesłanych danych Fundacja przygotuje umowę. Dokumenty przekażemy osobno.",
    },
    409,
  );
}
