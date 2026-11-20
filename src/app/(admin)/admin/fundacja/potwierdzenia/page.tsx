import { redirect } from "next/navigation";
import Link from "next/link";
import { adminContext } from "@/lib/foundation/contracts/server";
import ConfirmationMailing from "./ConfirmationMailing";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await adminContext())) redirect("/login");
  return (
    <main className="mx-auto max-w-6xl p-5 md:p-8">
      <Link className="text-teal-800 underline" href="/admin/fundacja">
        ← Fundacja
      </Link>
      <h1 className="mt-5 text-3xl font-semibold">
        Potwierdzenia uczestnictwa
      </h1>
      <p className="mt-3 text-stone-600">
        Osobna wiadomość dla każdego uczestnika, z jego zajęciami i
        indywidualnym formularzem.
      </p>
      <ConfirmationMailing />
    </main>
  );
}
