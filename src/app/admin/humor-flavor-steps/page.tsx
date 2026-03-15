import { createAdminClient } from "@/utils/supabase/admin";

export default async function HumorFlavorStepsPage() {
  const admin = createAdminClient();

  const [{ data: steps, error }, { data: flavors }, { data: models }, { data: stepTypes }] =
    await Promise.all([
      admin
        .from("humor_flavor_steps")
        .select("*")
        .order("humor_flavor_id", { ascending: true })
        .order("order_by", { ascending: true }),
      admin.from("humor_flavors").select("id, slug"),
      admin.from("llm_models").select("id, name"),
      admin.from("humor_flavor_step_types").select("id, slug"),
    ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load steps: {error.message}
      </div>
    );
  }

  const flavorMap = new Map((flavors ?? []).map((f) => [f.id, f.slug]));
  const modelMap = new Map((models ?? []).map((m) => [m.id, m.name]));
  const stepTypeMap = new Map((stepTypes ?? []).map((s) => [s.id, s.slug]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Humor Flavor Steps</h1>
        <p className="mt-1 text-gray-400">{steps?.length ?? 0} step{(steps?.length ?? 0) !== 1 ? "s" : ""} (read-only)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Flavor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Model</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Temp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {steps?.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-4 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-300">
                    {flavorMap.get(s.humor_flavor_id) ?? s.humor_flavor_id}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400">{s.order_by}</td>
                <td className="px-4 py-4 text-xs text-gray-400">{stepTypeMap.get(s.humor_flavor_step_type_id) ?? s.humor_flavor_step_type_id}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{modelMap.get(s.llm_model_id) ?? s.llm_model_id}</td>
                <td className="px-4 py-4 text-sm text-gray-400">{s.llm_temperature ?? "—"}</td>
                <td className="max-w-xs px-4 py-4 text-sm text-gray-400 truncate">{s.description ?? "—"}</td>
              </tr>
            ))}
            {(!steps || steps.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No steps found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail cards for system/user prompts */}
      {steps && steps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step Prompts</h2>
          {steps.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-300">
                  {flavorMap.get(s.humor_flavor_id) ?? `flavor ${s.humor_flavor_id}`}
                </span>
                <span className="text-xs text-gray-500">Step {s.order_by}</span>
                <span className="text-xs text-gray-600">{s.description}</span>
              </div>
              {s.llm_system_prompt && (
                <div className="mb-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">System Prompt</p>
                  <pre className="whitespace-pre-wrap rounded-lg bg-gray-800 p-3 text-xs text-gray-300">{s.llm_system_prompt}</pre>
                </div>
              )}
              {s.llm_user_prompt && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">User Prompt</p>
                  <pre className="whitespace-pre-wrap rounded-lg bg-gray-800 p-3 text-xs text-gray-300">{s.llm_user_prompt}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
