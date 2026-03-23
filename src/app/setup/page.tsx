import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const admin = createAdminClient();

  // Check how many superadmins exist
  const { count: superadminCount } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_superadmin", true);

  // Get current user's profile
  const { data: myProfile } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email, is_superadmin")
    .eq("id", user.id)
    .single();

  // If already superadmin, redirect to dashboard
  if (myProfile?.is_superadmin) {
    redirect("/admin/dashboard");
  }

  async function grantSuperadmin(formData: FormData) {
    "use server";
    void formData;

    const supabaseSrv = await createClient();
    const { data: { user: currentUser } } = await supabaseSrv.auth.getUser();
    if (!currentUser) return;

    const adminClient = createAdminClient();

    // Final check: only allow if still no superadmin exists
    const { count } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_superadmin", true);

    if ((count ?? 0) > 0) {
      redirect("/setup?error=already_exists");
    }

    const { error } = await adminClient
      .from("profiles")
      .update({ is_superadmin: true, modified_by_user_id: currentUser.id })
      .eq("id", currentUser.id);

    if (error) {
      redirect(`/setup?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin");
    redirect("/setup?done=1");
  }

  const displayName =
    [myProfile?.first_name, myProfile?.last_name].filter(Boolean).join(" ") ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Unknown";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-amber-600/20 p-3">
            <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">First-Time Setup</h1>
          <p className="mt-2 text-gray-400 text-sm">Bootstrap superadmin access</p>
        </div>

        {params.done === "1" ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-800 p-4 text-emerald-300">
              <p className="font-medium">You are now a superadmin!</p>
            </div>
            <a
              href="/admin/dashboard"
              className="inline-block rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Go to Admin Dashboard
            </a>
          </div>
        ) : (
          <>
            {params.error && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
                {params.error === "already_exists"
                  ? "A superadmin already exists. Contact them for access."
                  : `Error: ${params.error}`}
              </div>
            )}

            {(superadminCount ?? 0) > 0 ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-4 text-amber-300">
                  <p className="text-sm">
                    A superadmin already exists. This setup page is disabled.
                    Contact the existing superadmin for access.
                  </p>
                </div>
                <a href="/" className="inline-block text-sm text-gray-400 hover:text-white">
                  Return to login
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                  <p className="text-sm text-gray-400">
                    No superadmin exists yet. You can grant yourself superadmin access below.
                    This option will be permanently disabled once a superadmin is set.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
                  <p className="text-xs text-gray-500 mb-1">Granting access to:</p>
                  <p className="text-sm font-medium text-white">{displayName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>

                <form action={grantSuperadmin}>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                  >
                    Grant Myself Superadmin Access
                  </button>
                </form>

                <p className="text-center text-xs text-gray-600">
                  This action is logged and cannot be undone without database access.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
