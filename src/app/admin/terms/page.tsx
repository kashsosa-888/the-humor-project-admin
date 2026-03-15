import { createAdminClient } from "@/utils/supabase/admin";
import TermsManager from "./TermsManager";

export default async function TermsPage() {
  const admin = createAdminClient();

  const [{ data: terms, error }, { data: termTypes }] = await Promise.all([
    admin
      .from("terms")
      .select("id, term, definition, example, priority, term_type_id, created_datetime_utc, modified_datetime_utc")
      .order("priority", { ascending: false })
      .order("id", { ascending: true }),
    admin.from("term_types").select("id, name").order("name"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load terms: {error.message}
      </div>
    );
  }

  return <TermsManager terms={terms ?? []} termTypes={termTypes ?? []} />;
}
