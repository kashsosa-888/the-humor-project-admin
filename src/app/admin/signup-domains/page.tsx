import { createAdminClient } from "@/utils/supabase/admin";
import SignupDomainsManager from "./SignupDomainsManager";

export default async function SignupDomainsPage() {
  const admin = createAdminClient();

  const { data: domains, error } = await admin
    .from("allowed_signup_domains")
    .select("id, apex_domain, created_datetime_utc")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load signup domains: {error.message}
      </div>
    );
  }

  return <SignupDomainsManager domains={domains ?? []} />;
}
