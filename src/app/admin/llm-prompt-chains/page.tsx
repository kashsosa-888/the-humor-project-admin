import { createAdminClient } from "@/utils/supabase/admin";

export default async function LLMPromptChainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = createAdminClient();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  const { data: chains, error, count } = await admin
    .from("llm_prompt_chains")
    .select("id, created_datetime_utc, caption_request_id", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load prompt chains: {error.message}
      </div>
    );
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">LLM Prompt Chains</h1>
        <p className="mt-1 text-gray-400">{count ?? 0} total chains (read-only)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Caption Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {chains?.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{c.id}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-400">{c.caption_request_id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {c.created_datetime_utc
                    ? new Date(c.created_datetime_utc).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
            {(!chains || chains.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No prompt chains found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/llm-prompt-chains?page=${page - 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">Previous</a>
            )}
            {page < totalPages && (
              <a href={`/admin/llm-prompt-chains?page=${page + 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
