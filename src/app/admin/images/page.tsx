import { createAdminClient } from "@/utils/supabase/admin";
import ImageManager from "./ImageManager";

interface Image {
  id: string;
  url: string;
  created_at: string | null;
}

interface Caption {
  id: string;
  content: string;
  is_public: boolean;
  image_id: string;
}

export default async function ImagesPage() {
  const admin = createAdminClient();

  const { data: images, error } = await admin
    .from("images")
    .select("id, url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-400">
        Failed to load images: {error.message}
      </div>
    );
  }

  // Get caption counts per image
  const { data: captions } = await admin
    .from("captions")
    .select("id, content, is_public, image_id");

  const captionsByImage = new Map<string, Caption[]>();
  for (const caption of captions ?? []) {
    const existing = captionsByImage.get(caption.image_id) ?? [];
    captionsByImage.set(caption.image_id, [...existing, caption]);
  }

  const imagesWithCaptions = (images as Image[])?.map((img) => ({
    ...img,
    captions: captionsByImage.get(img.id) ?? [],
  }));

  return <ImageManager images={imagesWithCaptions} />;
}
