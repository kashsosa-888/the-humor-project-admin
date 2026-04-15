import { createAdminClient } from "@/utils/supabase/admin";

export default async function HumorFlavorStepsPage() {
  const admin = createAdminClient();

  const [{ data: steps, error }, { data: flavors }] = await Promise.all([
    admin
      .from("humor_flavor_steps")
      .select("id, humor_flavor_id, order_by, description, llm_model_id, llm_temperature, llm_system_prompt, llm_user_prompt, created_datetime_utc")
      .order("humor_flavor_id", { ascending: true })
      .order("order_by", { ascending: true }),
    admin.from("humor_flavors").select("id, slug"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load steps: {error.message}
      </div>
    );
  }

  const flavorMap = new Map((flavors ?? []).map((f) => [f.id, f.slug]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Humor Flavor Steps</h1>
        <p className="mt-1 text-gray-400">{steps?.length ?? 0} step{(steps?.length ?? 0) !== 1 ? "s" : ""} (read-only)</p>
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Flavor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Model</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Temp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">System Prompt</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {steps?.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-4 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-300">
                    {flavorMap.get(s.humor_flavor_id) ?? s.humor_flavor_id?.slice(0, 8) ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400">{s.order_by}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{s.description ?? <span className="text-gray-600">—</span>}</td>
                <td className="px-4 py-4 font-mono text-xs text-gray-500">{s.llm_model_id ?? "—"}</td>
                <td className="px-4 py-4 text-xs text-gray-500">{s.llm_temperature ?? "—"}</td>
                <td className="max-w-xs px-4 py-4">
                  {s.llm_system_prompt ? (
                    <p className="line-clamp-2 text-xs text-gray-400">{s.llm_system_prompt}</p>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {s.created_datetime_utc
                    ? new Date(s.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </td>
              </tr>
            ))}
            {(!steps || steps.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No steps found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
