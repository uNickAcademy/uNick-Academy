import type { Metadata } from "next";
import ContractForm from "@/app/components/foundation/contracts/ContractForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Potwierdzenie uczestnictwa | Kreatorzy Przyszłości",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return <ContractForm />;
}
