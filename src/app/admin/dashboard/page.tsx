import { createAdminClient } from "@/utils/supabase/admin";
import Image from "next/image";

interface StatCard {
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sublabel, color, icon }: StatCard) {
  return (
    <div className={`rounded-xl border ${color} bg-gray-900 p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
        </div>
        <div className="rounded-lg bg-gray-800 p-2 text-gray-400">{icon}</div>
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-800">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-gray-400">{value}</span>
    </div>
  );
}

export default async function DashboardPage() {
  const admin = createAdminClient();

  // --- Overview counts ---
  const [
    { count: totalUsers },
    { count: totalImages },
    { count: totalCaptions },
    { count: totalVotes },
    { count: positiveVotes },
    { count: publicCaptions },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("images").select("*", { count: "exact", head: true }),
    admin.from("captions").select("*", { count: "exact", head: true }),
    admin.from("caption_votes").select("*", { count: "exact", head: true }),
    admin.from("caption_votes").select("*", { count: "exact", head: true }).gt("vote_value", 0),
    admin.from("captions").select("*", { count: "exact", head: true }).eq("is_public", true),
  ]);

  const positiveRate =
    totalVotes && totalVotes > 0
      ? Math.round(((positiveVotes ?? 0) / totalVotes) * 100)
      : 0;

  // --- Top captions by score ---
  const { data: topCaptionsRaw } = await admin
    .from("caption_votes")
    .select("caption_id, vote_value")
    .order("caption_id");

  // Aggregate votes per caption in JS (Supabase anon key can't do GROUP BY via RPC without a function)
  const voteMap = new Map<string, { score: number; count: number }>();
  for (const row of topCaptionsRaw ?? []) {
    const existing = voteMap.get(row.caption_id) ?? { score: 0, count: 0 };
    voteMap.set(row.caption_id, {
      score: existing.score + row.vote_value,
      count: existing.count + 1,
    });
  }

  const topCaptionIds = [...voteMap.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topCaptionDetails } =
    topCaptionIds.length > 0
      ? await admin
          .from("captions")
          .select("id, content, images(url)")
          .in("id", topCaptionIds)
      : { data: [] };

  const topCaptions = topCaptionIds.map((id) => ({
    ...(topCaptionDetails?.find((c: { id: string }) => c.id === id) ?? { id, content: "Unknown", images: null }),
    score: voteMap.get(id)?.score ?? 0,
    votes: voteMap.get(id)?.count ?? 0,
  }));

  // --- Most controversial captions ---
  const controversialCaptions = [...voteMap.entries()]
    .filter(([, v]) => v.count >= 3)
    .map(([id, v]) => {
      const upvotes = topCaptionsRaw?.filter((r) => r.caption_id === id && r.vote_value > 0).length ?? 0;
      const downvotes = topCaptionsRaw?.filter((r) => r.caption_id === id && r.vote_value < 0).length ?? 0;
      const controversy =
        Math.max(upvotes, downvotes) === 0
          ? 0
          : Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes);
      return { id, upvotes, downvotes, controversy, total: v.count };
    })
    .sort((a, b) => b.controversy - a.controversy || b.total - a.total)
    .slice(0, 5);

  const controversialIds = controversialCaptions.map((c) => c.id);
  const { data: controversialDetails } =
    controversialIds.length > 0
      ? await admin
          .from("captions")
          .select("id, content")
          .in("id", controversialIds)
      : { data: [] };

  // --- Images with most captions ---
  const { data: allCaptionsForImages } = await admin
    .from("captions")
    .select("image_id");

  const imageCaptionCount = new Map<string, number>();
  for (const row of allCaptionsForImages ?? []) {
    if (!row.image_id) continue;
    imageCaptionCount.set(row.image_id, (imageCaptionCount.get(row.image_id) ?? 0) + 1);
  }

  const topImageIds = [...imageCaptionCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topImageDetails } =
    topImageIds.length > 0
      ? await admin.from("images").select("id, url").in("id", topImageIds)
      : { data: [] };

  const topImages = topImageIds.map((id) => ({
    ...(topImageDetails?.find((img: { id: string }) => img.id === id) ?? { id, url: "" }),
    captions: imageCaptionCount.get(id) ?? 0,
  }));

  // --- Recent captions (last 7 days grouped by day) ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentCaptions } = await admin
    .from("captions")
    .select("created_datetime_utc")
    .gte("created_datetime_utc", sevenDaysAgo.toISOString())
    .order("created_datetime_utc", { ascending: true });

  const dayCount = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dayCount.set(d.toISOString().split("T")[0], 0);
  }
  for (const row of recentCaptions ?? []) {
    const day = row.created_datetime_utc.split("T")[0];
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
  }
  const activityData = [...dayCount.entries()].map(([date, count]) => ({
    date,
    label: new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    count,
  }));
  const maxActivity = Math.max(...activityData.map((d) => d.count), 1);

  // --- Most active voters ---
  const { data: allVotes } = await admin
    .from("caption_votes")
    .select("profile_id");

  const voterCount = new Map<string, number>();
  for (const row of allVotes ?? []) {
    voterCount.set(row.profile_id, (voterCount.get(row.profile_id) ?? 0) + 1);
  }

  const topVoterIds = [...voterCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topVoterDetails } =
    topVoterIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", topVoterIds)
      : { data: [] };

  const topVoters = topVoterIds.map((id) => ({
    ...(topVoterDetails?.find((p: { id: string }) => p.id === id) ?? { id, full_name: null, email: null, avatar_url: null }),
    votes: voterCount.get(id) ?? 0,
  }));
  const maxVotes = topVoters[0]?.votes ?? 1;

  const superadminCount = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_superadmin", true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">Platform statistics and insights</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={totalUsers ?? 0}
          sublabel={`${superadminCount.count ?? 0} superadmin(s)`}
          color="border-violet-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Images"
          value={totalImages ?? 0}
          color="border-blue-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Captions"
          value={totalCaptions ?? 0}
          sublabel={`${publicCaptions ?? 0} public`}
          color="border-emerald-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          }
        />
        <StatCard
          label="Total Votes"
          value={totalVotes ?? 0}
          color="border-amber-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
            </svg>
          }
        />
        <StatCard
          label="Positive Vote Rate"
          value={`${positiveRate}%`}
          sublabel={`${positiveVotes ?? 0} upvotes / ${(totalVotes ?? 0) - (positiveVotes ?? 0)} downvotes`}
          color="border-green-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          label="Captions per Image"
          value={
            (totalImages ?? 0) > 0
              ? ((totalCaptions ?? 0) / (totalImages ?? 1)).toFixed(1)
              : "0"
          }
          sublabel="average"
          color="border-pink-800/50"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
      </div>

      {/* 7-day activity + top voters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity chart */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Captions Created — Last 7 Days
          </h2>
          <div className="space-y-3">
            {activityData.map((d) => (
              <div key={d.date}>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{d.label}</span>
                  <span>{d.count}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-800">
                  <div
                    className="h-3 rounded-full bg-violet-600 transition-all"
                    style={{ width: `${maxActivity === 0 ? 0 : (d.count / maxActivity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top voters */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Most Active Voters
          </h2>
          <div className="space-y-4">
            {topVoters.length === 0 ? (
              <p className="text-sm text-gray-500">No votes yet</p>
            ) : (
              topVoters.map((voter, i) => (
                <div key={voter.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-xs text-gray-600">#{i + 1}</span>
                      {voter.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={voter.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-800 text-xs font-bold text-white">
                          {(voter.full_name || voter.email || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-300">
                        {voter.full_name || voter.email?.split("@")[0] || "Unknown"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{voter.votes} votes</span>
                  </div>
                  <MiniBar value={voter.votes} max={maxVotes} color="bg-amber-500" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top captions + Controversial */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top captions by score */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Highest Rated Captions
          </h2>
          <div className="space-y-3">
            {topCaptions.length === 0 ? (
              <p className="text-sm text-gray-500">No votes yet</p>
            ) : (
              topCaptions.map((caption, i) => {
                const img = caption.images as { url: string } | null;
                return (
                  <div key={caption.id} className="flex gap-3 rounded-lg bg-gray-800/50 p-3">
                    <span className="mt-0.5 w-5 shrink-0 text-sm font-bold text-gray-600">#{i + 1}</span>
                    {img?.url && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                        <Image src={img.url} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-gray-200">{caption.content}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-emerald-400">+{caption.score > 0 ? caption.score : caption.score}</span>
                        <span>{caption.votes} votes</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most controversial */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Most Controversial Captions
          </h2>
          <p className="mb-3 text-xs text-gray-600">Captions with the most split opinions (≥3 votes)</p>
          <div className="space-y-3">
            {controversialCaptions.length === 0 ? (
              <p className="text-sm text-gray-500">Not enough votes to determine</p>
            ) : (
              controversialCaptions.map((c, i) => {
                const detail = controversialDetails?.find((d: { id: string }) => d.id === c.id);
                return (
                  <div key={c.id} className="rounded-lg bg-gray-800/50 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 w-5 shrink-0 text-sm font-bold text-gray-600">#{i + 1}</span>
                      <p className="line-clamp-2 text-sm text-gray-200">{detail?.content || "Unknown"}</p>
                    </div>
                    <div className="mt-2 flex gap-4 pl-5 text-xs">
                      <span className="text-green-400">👍 {c.upvotes}</span>
                      <span className="text-red-400">👎 {c.downvotes}</span>
                      <span className="text-gray-500">{Math.round(c.controversy * 100)}% split</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Images with most captions */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Images with the Most Captions
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {topImages.length === 0 ? (
            <p className="col-span-5 text-sm text-gray-500">No images yet</p>
          ) : (
            topImages.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl bg-gray-800">
                {img.url ? (
                  <div className="relative aspect-square">
                    <Image src={img.url} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="200px" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-gray-700">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-center text-sm font-bold text-white">{img.captions} captions</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
