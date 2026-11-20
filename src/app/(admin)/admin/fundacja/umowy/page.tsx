import { redirect } from "next/navigation";
import Link from "next/link";
import { adminContext } from "@/lib/foundation/contracts/server";
import { listFoundationDeclarations } from "@/lib/foundation/declarations";
import { contractGroups } from "@/lib/foundation/contracts/groups";
import { configurationIssue } from "@/lib/foundation/contracts/documents";
import ContractAdmin from "./ContractAdmin";
import ContractSettingsForm from "./ContractSettingsForm";
import { readContractSettings } from "@/lib/foundation/contracts/settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const context = await adminContext();
  if (!context) redirect("/login");
  const [{ data, error }, { data: invites, error: inviteError }] =
    await Promise.all([
      listFoundationDeclarations(context.db),
      context.db
        .from("foundation_contract_invites")
        .select(
          "id,participant_label,created_at,expires_at,revoked_at,groups,foundation_contract_responses(choice,note,created_at)",
        )
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
  const settings = await readContractSettings(context.db);
  const problem = configurationIssue(settings);
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <Link href="/admin/fundacja" className="text-sm text-teal-700">
        ← Fundacja
      </Link>
      <h1 className="mt-4 text-3xl font-bold">
        Potwierdzenia i umowy uczestników
      </h1>
      <p className="mt-2 text-gray-600">
        Potwierdzenie terminu, dane rodziny, gotowy pakiet PDF oraz osobno
        odbiór skanu i papierowego oryginału.
      </p>
      {problem && (
        <p
          role="status"
          className="my-4 rounded-xl bg-amber-50 p-4 text-amber-900"
        >
          {problem} Panel można przeglądać; linki dla rodziców będą dostępne po
          uzupełnieniu danych projektu.
        </p>
      )}
      <div className="my-5 flex flex-wrap gap-4">
        <Link
          href="/admin/fundacja/umowy/podglad"
          className="text-teal-800 underline"
        >
          Podgląd formularza dla rodzica
        </Link>
        <Link
          prefetch={false}
          href="/api/admin/foundation-contracts/preview"
          className="text-teal-800 underline"
        >
          Pobierz przykładowy pakiet PDF
        </Link>
      </div>
      <ContractSettingsForm initial={settings} />
      {error || inviteError ? (
        <p role="alert" className="my-6 rounded-xl bg-red-50 p-4">
          Nie udało się pobrać kompletu danych. Odśwież stronę.
        </p>
      ) : (
        <ContractAdmin
          declarations={(data ?? []).map((row) => ({
            id: String(row.id),
            label: String(row.participant_first_name),
          }))}
          groups={contractGroups.map((g) => ({
            id: g.id,
            label: g.label,
            firstSupport: g.firstSupport,
          }))}
          invitations={invites ?? []}
          ready={!problem}
          returnEmail={settings.returnEmail}
        />
      )}
    </div>
  );
}
