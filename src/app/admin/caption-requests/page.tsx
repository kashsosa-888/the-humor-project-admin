import { createAdminClient } from "@/utils/supabase/admin";

export default async function CaptionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = createAdminClient();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  const { data: requests, error, count } = await admin
    .from("caption_requests")
    .select("id, created_datetime_utc, profile_id, image_id", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load caption requests: {error.message}
      </div>
    );
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Caption Requests</h1>
        <p className="mt-1 text-gray-400">{count ?? 0} total requests (read-only)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Profile ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Image ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {requests?.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{r.id}</td>
                <td className="px-6 py-4 text-xs font-mono text-gray-400">{r.profile_id?.slice(0, 8)}…</td>
                <td className="px-6 py-4 text-xs font-mono text-gray-400">{r.image_id?.slice(0, 8)}…</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {r.created_datetime_utc
                    ? new Date(r.created_datetime_utc).toLocaleString("en-US", {
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
            {(!requests || requests.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No caption requests found</td>
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
              <a href={`/admin/caption-requests?page=${page - 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={`/admin/caption-requests?page=${page + 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
