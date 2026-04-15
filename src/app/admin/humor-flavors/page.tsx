import { createAdminClient } from "@/utils/supabase/admin";
import HumorFlavorsManager from "./HumorFlavorsManager";

export default async function HumorFlavorsPage() {
  const admin = createAdminClient();

  const { data: flavors, error } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load humor flavors: {error.message}
      </div>
    );
  }

  return <HumorFlavorsManager flavors={flavors ?? []} />;
}
