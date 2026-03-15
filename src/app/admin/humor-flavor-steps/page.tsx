import { createAdminClient } from "@/utils/supabase/admin";

export default async function HumorFlavorStepsPage() {
  const admin = createAdminClient();

  const [{ data: steps, error }, { data: flavors }] = await Promise.all([
    admin
      .from("humor_flavor_steps")
      .select("id, flavor_id, step_order, instruction, created_at")
      .order("flavor_id", { ascending: true })
      .order("step_order", { ascending: true }),
    admin.from("humor_flavors").select("id, name"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load steps: {error.message}
      </div>
    );
  }

  const flavorMap = new Map((flavors ?? []).map((f) => [f.id, f.name]));

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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Step</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Instruction</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {steps?.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-4 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-300">
                    {flavorMap.get(s.flavor_id) ?? s.flavor_id?.slice(0, 8) ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400">{s.step_order}</td>
                <td className="max-w-md px-4 py-4 text-sm text-gray-300">{s.instruction}</td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </td>
              </tr>
            ))}
            {(!steps || steps.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No steps found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
