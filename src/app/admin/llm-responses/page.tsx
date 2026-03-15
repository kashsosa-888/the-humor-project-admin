import { createAdminClient } from "@/utils/supabase/admin";

export default async function LLMResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = createAdminClient();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const [{ data: responses, error, count }, { data: models }, { data: flavors }] =
    await Promise.all([
      admin
        .from("llm_model_responses")
        .select("id, created_datetime_utc, llm_model_id, humor_flavor_id, processing_time_seconds, llm_temperature, caption_request_id, llm_model_response", { count: "exact" })
        .order("created_datetime_utc", { ascending: false })
        .range(offset, offset + pageSize - 1),
      admin.from("llm_models").select("id, name"),
      admin.from("humor_flavors").select("id, slug"),
    ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load LLM responses: {error.message}
      </div>
    );
  }

  const modelMap = new Map((models ?? []).map((m) => [m.id, m.name]));
  const flavorMap = new Map((flavors ?? []).map((f) => [f.id, f.slug]));
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">LLM Responses</h1>
        <p className="mt-1 text-gray-400">{count ?? 0} total responses (read-only)</p>
      </div>

      <div className="space-y-3">
        {responses?.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-900/40 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                {modelMap.get(r.llm_model_id) ?? `model ${r.llm_model_id}`}
              </span>
              {r.humor_flavor_id && (
                <span className="rounded-full bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                  {flavorMap.get(r.humor_flavor_id) ?? `flavor ${r.humor_flavor_id}`}
                </span>
              )}
              {r.processing_time_seconds != null && (
                <span className="text-xs text-gray-500">{r.processing_time_seconds}s</span>
              )}
              {r.llm_temperature != null && (
                <span className="text-xs text-gray-500">temp={r.llm_temperature}</span>
              )}
              <span className="ml-auto text-xs text-gray-600">
                req#{r.caption_request_id}
              </span>
              <span className="text-xs text-gray-600">
                {r.created_datetime_utc
                  ? new Date(r.created_datetime_utc).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-800 p-3 text-xs text-gray-300 max-h-40 overflow-y-auto">
              {r.llm_model_response}
            </pre>
          </div>
        ))}
        {(!responses || responses.length === 0) && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
            No LLM responses found
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/llm-responses?page=${page - 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">Previous</a>
            )}
            {page < totalPages && (
              <a href={`/admin/llm-responses?page=${page + 1}`} className="rounded-lg bg-gray-800 px-3 py-1.5 transition-colors hover:bg-gray-700">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
