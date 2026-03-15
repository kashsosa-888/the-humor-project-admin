import { createAdminClient } from "@/utils/supabase/admin";
import WhitelistEmailsManager from "./WhitelistEmailsManager";

export default async function WhitelistEmailsPage() {
  const admin = createAdminClient();

  const { data: emails, error } = await admin
    .from("whitelist_email_addresses")
    .select("id, email_address, created_datetime_utc, modified_datetime_utc")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load whitelist emails: {error.message}
      </div>
    );
  }

  return <WhitelistEmailsManager emails={emails ?? []} />;
}
