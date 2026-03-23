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
  const { user, admin } = await requireSuperadmin();

  const { data, error } = await admin
    .from("images")
    .insert({ url, created_by_user_id: user.id, modified_by_user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true, id: data.id };
}

export async function uploadImage(formData: FormData) {
  const { user, admin } = await requireSuperadmin();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: storageError } = await admin.storage
    .from("images")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (storageError) return { error: storageError.message };

  const { data: { publicUrl } } = admin.storage.from("images").getPublicUrl(fileName);

  const { data, error } = await admin
    .from("images")
    .insert({ url: publicUrl, created_by_user_id: user.id, modified_by_user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true, id: data.id };
}

export async function updateImage(id: string, url: string) {
  const { user, admin } = await requireSuperadmin();

  const { error } = await admin
    .from("images")
    .update({ url, modified_by_user_id: user.id })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true };
}

export async function deleteImage(id: string) {
  const { admin } = await requireSuperadmin();

  await admin.from("captions").delete().eq("image_id", id);
  const { error } = await admin.from("images").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/images");
  return { success: true };
}

// --- LLM PROVIDERS ---

export async function createLLMProvider(name: string) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_providers").insert({ name, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-providers");
  return { success: true };
}

export async function updateLLMProvider(id: number, name: string) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_providers").update({ name, modified_by_user_id: user.id }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-providers");
  revalidatePath("/admin/llm-models");
  return { success: true };
}

export async function deleteLLMProvider(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_providers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-providers");
  revalidatePath("/admin/llm-models");
  return { success: true };
}

// --- LLM MODELS ---

export async function createLLMModel(data: {
  name: string;
  provider_model_id: string;
  llm_provider_id: number;
  is_temperature_supported: boolean;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_models").insert({ ...data, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-models");
  return { success: true };
}

export async function updateLLMModel(id: number, data: {
  name: string;
  provider_model_id: string;
  llm_provider_id: number;
  is_temperature_supported: boolean;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_models").update({ ...data, modified_by_user_id: user.id }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-models");
  return { success: true };
}

export async function deleteLLMModel(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("llm_models").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/llm-models");
  return { success: true };
}

// --- HUMOR MIX ---

export async function updateHumorMix(id: number, caption_count: number) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin
    .from("humor_flavor_mix")
    .update({ caption_count, modified_by_user_id: user.id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/humor-mix");
  return { success: true };
}

// --- TERMS ---

export async function createTerm(data: {
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("terms").insert({ ...data, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/terms");
  return { success: true };
}

export async function updateTerm(id: number, data: {
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("terms").update({ ...data, modified_by_user_id: user.id }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/terms");
  return { success: true };
}

export async function deleteTerm(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("terms").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/terms");
  return { success: true };
}

// --- CAPTION EXAMPLES ---

export async function createCaptionExample(data: {
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("caption_examples").insert({ ...data, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/caption-examples");
  return { success: true };
}

export async function updateCaptionExample(id: number, data: {
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
}) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("caption_examples").update({ ...data, modified_by_user_id: user.id }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/caption-examples");
  return { success: true };
}

export async function deleteCaptionExample(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("caption_examples").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/caption-examples");
  return { success: true };
}

// --- ALLOWED SIGNUP DOMAINS ---

export async function createSignupDomain(apex_domain: string) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("allowed_signup_domains").insert({ apex_domain, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/signup-domains");
  return { success: true };
}

export async function deleteSignupDomain(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("allowed_signup_domains").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/signup-domains");
  return { success: true };
}

// --- WHITELIST EMAIL ADDRESSES ---

export async function createWhitelistEmail(email_address: string) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin.from("whitelist_email_addresses").insert({ email_address, created_by_user_id: user.id, modified_by_user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/whitelist-emails");
  return { success: true };
}

export async function updateWhitelistEmail(id: number, email_address: string) {
  const { user, admin } = await requireSuperadmin();
  const { error } = await admin
    .from("whitelist_email_addresses")
    .update({ email_address, modified_by_user_id: user.id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/whitelist-emails");
  return { success: true };
}

export async function deleteWhitelistEmail(id: number) {
  const { admin } = await requireSuperadmin();
  const { error } = await admin.from("whitelist_email_addresses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/whitelist-emails");
  return { success: true };
}
