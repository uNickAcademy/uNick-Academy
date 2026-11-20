import { redirect } from "next/navigation";
import { adminContext } from "@/lib/foundation/contracts/server";
import { readContractSettings } from "@/lib/foundation/contracts/settings";
import { contractPreview } from "@/lib/foundation/contracts/preview";
import ContractForm from "@/app/components/foundation/contracts/ContractForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const context = await adminContext();
  if (!context) redirect("/login");
  const { invitation } = contractPreview(
    await readContractSettings(context.db),
  );
  return (
    <ContractForm
      preview={{
        groups: invitation.groups,
        firstSupport: invitation.first_support,
        lastSupport: invitation.last_support,
        documents: invitation.documents,
        submitted: false,
      }}
    />
  );
}
