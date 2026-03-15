import { createAdminClient } from "@/utils/supabase/admin";
import LLMProvidersManager from "./LLMProvidersManager";

export default async function LLMProvidersPage() {
  const admin = createAdminClient();

  const { data: providers, error } = await admin
    .from("llm_providers")
    .select("id, name, created_datetime_utc")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load LLM providers: {error.message}
      </div>
    );
  }

  return <LLMProvidersManager providers={providers ?? []} />;
}
