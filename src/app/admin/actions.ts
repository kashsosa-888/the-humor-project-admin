"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) throw new Error("Not authorized");
  return { user, admin };
}

// --- IMAGE ACTIONS ---

export async function createImage(url: string) {
  const { admin } = await requireSuperadmin();

  const { data, error } = await admin
    .from("images")
    .insert({ url })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true, id: data.id };
}

export async function updateImage(id: string, url: string) {
  const { admin } = await requireSuperadmin();

  const { error } = await admin
    .from("images")
    .update({ url })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true };
}

export async function deleteImage(id: string) {
  const { admin } = await requireSuperadmin();

  // Delete all captions linked to this image first (cascade not assumed)
  await admin.from("captions").delete().eq("image_id", id);

  const { error } = await admin.from("images").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true };
}
