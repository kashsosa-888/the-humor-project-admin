import { createAdminClient } from "@/utils/supabase/admin";
import CaptionExamplesManager from "./CaptionExamplesManager";

export default async function CaptionExamplesPage() {
  const admin = createAdminClient();

  const { data: examples, error } = await admin
    .from("caption_examples")
    .select("id, image_description, caption, explanation, priority, image_id, created_datetime_utc, modified_datetime_utc")
    .order("priority", { ascending: false })
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load caption examples: {error.message}
      </div>
    );
  }

  return <CaptionExamplesManager examples={examples ?? []} />;
}
