"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { createImage, uploadImage, updateImage, deleteImage } from "../actions";

interface Caption {
  id: string;
  content: string;
  is_public: boolean;
}

interface ImageWithCaptions {
  id: string;
  url: string;
  created_datetime_utc: string | null;
  captions: Caption[];
}

export default function ImageManager({ images }: { images: ImageWithCaptions[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"url" | "upload">("url");
  const [newUrl, setNewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleCreate() {
    if (createMode === "url") {
      if (!newUrl.trim()) return;
      startTransition(async () => {
        const res = await createImage(newUrl.trim());
        if (res.error) {
          showFeedback("error", res.error);
        } else {
          showFeedback("success", "Image created");
          setNewUrl("");
          setShowCreate(false);
        }
      });
    } else {
      if (!selectedFile) return;
      startTransition(async () => {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await uploadImage(formData);
        if (res.error) {
          showFeedback("error", res.error);
        } else {
          showFeedback("success", "Image uploaded");
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setShowCreate(false);
        }
      });
    }
  }

  function handleUpdate(id: string) {
    if (!editUrl.trim()) return;
    startTransition(async () => {
      const res = await updateImage(id, editUrl.trim());
      if (res.error) {
        showFeedback("error", res.error);
      } else {
        showFeedback("success", "Image updated");
        setEditingId(null);
        setEditUrl("");
      }
    });
  }

  function confirmDelete(id: string) {
    startTransition(async () => {
      const res = await deleteImage(id);
      if (res.error) {
        showFeedback("error", res.error);
      } else {
        showFeedback("success", "Image deleted");
      }
      setDeletingId(null);
    });
  }

  const canCreate = createMode === "url" ? !!newUrl.trim() : !!selectedFile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Images</h1>
          <p className="mt-1 text-gray-400">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Image
        </button>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
              : "border-red-800 bg-red-950/40 text-red-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-violet-800/50 bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-violet-300">New Image</h2>
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-0.5">
              <button
                onClick={() => setCreateMode("url")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  createMode === "url" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                URL
              </button>
              <button
                onClick={() => setCreateMode("upload")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  createMode === "upload" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {createMode === "url" ? (
            <>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
                />
                <button
                  onClick={handleCreate}
                  disabled={isPending || !canCreate}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                  {isPending ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewUrl(""); }}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
              {newUrl && (
                <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newUrl} alt="Preview" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </>
          ) : (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50 p-8 transition-colors hover:border-violet-600"
              >
                <svg className="mb-2 h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-400">{selectedFile ? selectedFile.name : "Click to select image"}</p>
                {selectedFile && <p className="mt-1 text-xs text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {filePreview && (
                <div className="mb-3 relative aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview} alt="Preview" className="h-full w-full object-contain" />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={isPending || !canCreate}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                  {isPending ? "Uploading…" : "Upload"}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setSelectedFile(null); setFilePreview(null); }}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Image?</h3>
            <p className="mt-2 text-sm text-gray-400">
              This will permanently delete the image and all its captions. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => confirmDelete(deletingId)}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Images grid */}
      <div className="grid gap-4">
        {images.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
            No images yet. Add one above.
          </div>
        )}
        {images.map((img) => (
          <div
            key={img.id}
            className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-colors hover:border-gray-700"
          >
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                {img.url && (
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === img.id ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdate(img.id)}
                      disabled={isPending}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditUrl(""); }}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-sm font-mono text-gray-400">{img.url}</p>
                )}
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                  <span className="font-mono">{img.id.slice(0, 8)}…</span>
                  {img.created_datetime_utc && (
                    <span>
                      {new Date(img.created_datetime_utc).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <span>{img.captions.length} caption{img.captions.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-start gap-2">
                {img.captions.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === img.id ? null : img.id)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700"
                  >
                    {expandedId === img.id ? "Hide" : "Captions"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(img.id);
                    setEditUrl(img.url);
                  }}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(img.id)}
                  className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Captions expand */}
            {expandedId === img.id && img.captions.length > 0 && (
              <div className="border-t border-gray-800 bg-gray-900/50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Captions
                </p>
                <ul className="space-y-1.5">
                  {img.captions.map((caption) => (
                    <li key={caption.id} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
                          caption.is_public
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {caption.is_public ? "public" : "private"}
                      </span>
                      <span className="text-sm text-gray-300">{caption.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
