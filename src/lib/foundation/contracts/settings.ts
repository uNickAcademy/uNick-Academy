import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SETTINGS_DEFAULT,
  settingsSchema,
  type ContractSettings,
} from "./documents";
export async function readContractSettings(
  db: SupabaseClient,
): Promise<ContractSettings> {
  const { data, error } = await db
    .from("foundation_contract_settings")
    .select("settings")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return SETTINGS_DEFAULT;
  const parsed = settingsSchema.safeParse(data.settings);
  return parsed.success ? parsed.data : SETTINGS_DEFAULT;
}
