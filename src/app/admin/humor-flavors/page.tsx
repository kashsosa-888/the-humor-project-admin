import { createAdminClient } from "@/utils/supabase/admin";

export default async function HumorFlavorsPage() {
  const admin = createAdminClient();

  const { data: flavors, error } = await admin
    .from("humor_flavors")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load humor flavors: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Humor Flavors</h1>
        <p className="mt-1 text-gray-400">{flavors?.length ?? 0} flavor{(flavors?.length ?? 0) !== 1 ? "s" : ""} (read-only)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {flavors?.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4 text-xs font-mono text-gray-500">{f.id.slice(0, 8)}…</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                    {f.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {f.created_at
                    ? new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </td>
              </tr>
            ))}
            {(!flavors || flavors.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No humor flavors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
