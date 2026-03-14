import { createAdminClient } from "@/utils/supabase/admin";
import Image from "next/image";

interface Caption {
  id: string;
  content: string;
  created_datetime_utc: string | null;
  is_public: boolean;
  image_id: string | null;
  images: { url: string } | null;
}

interface VoteAggregate {
  caption_id: string;
  score: number;
  count: number;
}

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const admin = createAdminClient();
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = admin
    .from("captions")
    .select("id, content, created_datetime_utc, is_public, image_id, images(url)", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filter === "public") query = query.eq("is_public", true);
  if (filter === "private") query = query.eq("is_public", false);

  const { data: captions, error, count } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load captions: {error.message}
      </div>
    );
  }

  // Get vote aggregates
  const { data: allVotes } = await admin
    .from("caption_votes")
    .select("caption_id, vote_value");

  const voteMap = new Map<string, VoteAggregate>();
  for (const row of allVotes ?? []) {
    const existing = voteMap.get(row.caption_id) ?? { caption_id: row.caption_id, score: 0, count: 0 };
    voteMap.set(row.caption_id, {
      caption_id: row.caption_id,
      score: existing.score + row.vote_value,
      count: existing.count + 1,
    });
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Captions</h1>
          <p className="mt-1 text-gray-400">{count ?? 0} total captions</p>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-gray-700 bg-gray-900 p-1">
          {(["all", "public", "private"] as const).map((f) => (
            <a
              key={f}
              href={`/admin/captions?filter=${f}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {f}
            </a>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Image</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Caption</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Votes</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(captions as unknown as Caption[])?.map((caption) => {
              const votes = voteMap.get(caption.id);
              const img = caption.images;
              return (
                <tr key={caption.id} className="transition-colors hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    {img?.url ? (
                      <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-gray-800">
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-800 text-xs text-gray-600">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs px-6 py-4">
                    <p className="line-clamp-2 text-sm text-gray-200">{caption.content}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-600">{caption.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        caption.is_public
                          ? "bg-emerald-900/50 text-emerald-300"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {caption.is_public ? "Public" : "Private"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {votes ? (
                      <span
                        className={`text-sm font-semibold ${
                          votes.score > 0
                            ? "text-emerald-400"
                            : votes.score < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {votes.score > 0 ? "+" : ""}{votes.score}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {votes?.count ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {caption.created_datetime_utc
                      ? new Date(caption.created_datetime_utc).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {(!captions || captions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No captions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/captions?filter=${filter}&page=${page - 1}`}
                className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/captions?filter=${filter}&page=${page + 1}`}
                className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
