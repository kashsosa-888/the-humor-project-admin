import { createAdminClient } from "@/utils/supabase/admin";
import HumorMixManager from "./HumorMixManager";

export default async function HumorMixPage() {
  const admin = createAdminClient();

  const [{ data: mix, error }, { data: flavors }] = await Promise.all([
    admin
      .from("humor_flavor_mix")
      .select("id, humor_flavor_id, caption_count, created_datetime_utc")
      .order("id", { ascending: true }),
    admin.from("humor_flavors").select("id, slug, description"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load humor mix: {error.message}
      </div>
    );
  }

  const enriched = (mix ?? []).map((m) => ({
    ...m,
    flavor: (flavors ?? []).find((f) => f.id === m.humor_flavor_id) ?? null,
  }));

  return <HumorMixManager mix={enriched} />;
}
