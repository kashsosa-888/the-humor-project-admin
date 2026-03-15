"use client";

import { useState, useTransition } from "react";
import { createCaptionExample, updateCaptionExample, deleteCaptionExample } from "../actions";

interface Example {
  id: number;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
}

const emptyForm = { image_description: "", caption: "", explanation: "", priority: 0, image_id: "" };

export default function CaptionExamplesManager({ examples }: { examples: Example[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function toPayload(f: typeof emptyForm) {
    return {
      image_description: f.image_description,
      caption: f.caption,
      explanation: f.explanation,
      priority: Number(f.priority),
      image_id: f.image_id?.trim() || null,
    };
  }

  function handleCreate() {
    if (!form.image_description.trim() || !form.caption.trim()) return;
    startTransition(async () => {
      const res = await createCaptionExample(toPayload(form));
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Example created"); setForm(emptyForm); setShowCreate(false); }
    });
  }

  function handleUpdate(id: number) {
    if (!editForm.image_description.trim() || !editForm.caption.trim()) return;
    startTransition(async () => {
      const res = await updateCaptionExample(id, toPayload(editForm));
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Example updated"); setEditingId(null); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteCaptionExample(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Example deleted");
      setDeletingId(null);
    });
  }

  function FormFields({ vals, onChange }: { vals: typeof emptyForm; onChange: (v: typeof emptyForm) => void }) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Image Description *</label>
          <textarea rows={2} value={vals.image_description} onChange={(e) => onChange({ ...vals, image_description: e.target.value })}
            placeholder="Describe the image for the LLM..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Caption *</label>
          <textarea rows={2} value={vals.caption} onChange={(e) => onChange({ ...vals, caption: e.target.value })}
            placeholder="Example caption text..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Explanation</label>
          <textarea rows={2} value={vals.explanation} onChange={(e) => onChange({ ...vals, explanation: e.target.value })}
            placeholder="Why is this a good caption?" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Priority</label>
            <input type="number" value={vals.priority} onChange={(e) => onChange({ ...vals, priority: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Image ID (optional UUID)</label>
            <input type="text" value={vals.image_id} onChange={(e) => onChange({ ...vals, image_id: e.target.value })}
              placeholder="UUID or leave blank" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Caption Examples</h1>
          <p className="mt-1 text-gray-400">{examples.length} example{examples.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Example
        </button>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-violet-800/50 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-violet-300">New Caption Example</h2>
          <FormFields vals={form} onChange={setForm} />
          <div className="mt-4 flex gap-3">
            <button onClick={handleCreate} disabled={isPending || !form.image_description.trim() || !form.caption.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {isPending ? "Creating…" : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setForm(emptyForm); }} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Example?</h3>
            <p className="mt-2 text-sm text-gray-400">This permanently deletes the caption example.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => confirmDelete(deletingId)} disabled={isPending} className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isPending ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {examples.map((ex) => (
          <div key={ex.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            {editingId === ex.id ? (
              <>
                <FormFields vals={editForm} onChange={setEditForm} />
                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleUpdate(ex.id)} disabled={isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">priority {ex.priority}</span>
                    {ex.image_id && <span className="font-mono text-xs text-gray-600">{ex.image_id.slice(0, 8)}…</span>}
                  </div>
                  <p className="text-xs text-gray-500 italic">img: {ex.image_description}</p>
                  <p className="text-sm font-medium text-white">"{ex.caption}"</p>
                  {ex.explanation && <p className="text-xs text-gray-400">{ex.explanation}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => { setEditingId(ex.id); setEditForm({ image_description: ex.image_description, caption: ex.caption, explanation: ex.explanation, priority: ex.priority, image_id: ex.image_id ?? "" }); }}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Edit</button>
                  <button onClick={() => setDeletingId(ex.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {examples.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">No examples yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
