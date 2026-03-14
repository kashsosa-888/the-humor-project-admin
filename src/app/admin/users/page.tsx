import { createAdminClient } from "@/utils/supabase/admin";

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_superadmin: boolean | null;
  created_datetime_utc: string | null;
}

export default async function UsersPage() {
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name, is_superadmin, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load profiles: {error.message}
      </div>
    );
  }

  // Get vote counts per user
  const { data: voteCounts } = await admin
    .from("caption_votes")
    .select("profile_id");

  const voteMap = new Map<string, number>();
  for (const row of voteCounts ?? []) {
    voteMap.set(row.profile_id, (voteMap.get(row.profile_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="mt-1 text-gray-400">
            {profiles?.length ?? 0} registered profile{(profiles?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Votes Cast</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(profiles as Profile[])?.map((profile) => {
              const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
              const initial = (displayName || profile.email || "?")[0].toUpperCase();
              return (
                <tr key={profile.id} className="transition-colors hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-800 text-sm font-bold text-white">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {displayName || "—"}
                        </p>
                        <p className="font-mono text-xs text-gray-600">{profile.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{profile.email || "—"}</td>
                  <td className="px-6 py-4">
                    {profile.is_superadmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-900/50 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-700/50">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        Superadmin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{voteMap.get(profile.id) ?? 0}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {profile.created_datetime_utc
                      ? new Date(profile.created_datetime_utc).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No profiles found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
