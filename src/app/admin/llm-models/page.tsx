import { createAdminClient } from "@/utils/supabase/admin";
import LLMModelsManager from "./LLMModelsManager";

export default async function LLMModelsPage() {
  const admin = createAdminClient();

  const [{ data: models, error }, { data: providers }] = await Promise.all([
    admin
      .from("llm_models")
      .select("id, name, provider_model_id, llm_provider_id, is_temperature_supported, created_datetime_utc")
      .order("llm_provider_id", { ascending: true })
      .order("id", { ascending: true }),
    admin.from("llm_providers").select("id, name").order("name"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load LLM models: {error.message}
      </div>
    );
  }

  return <LLMModelsManager models={models ?? []} providers={providers ?? []} />;
}
