"use client";

import { useState, useTransition } from "react";
import { createTerm, updateTerm, deleteTerm } from "../actions";

interface Term {
  id: number;
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
}

interface TermType {
  id: number;
  name: string;
}

const emptyForm = { term: "", definition: "", example: "", priority: 0, term_type_id: 0 };

export default function TermsManager({ terms, termTypes }: { terms: Term[]; termTypes: TermType[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const typeMap = new Map(termTypes.map((t) => [t.id, t.name]));

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleCreate() {
    if (!form.term.trim() || !form.definition.trim()) return;
    startTransition(async () => {
      const res = await createTerm({ ...form, priority: Number(form.priority), term_type_id: Number(form.term_type_id) });
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Term created"); setForm(emptyForm); setShowCreate(false); }
    });
  }

  function handleUpdate(id: number) {
    if (!editForm.term.trim() || !editForm.definition.trim()) return;
    startTransition(async () => {
      const res = await updateTerm(id, { ...editForm, priority: Number(editForm.priority), term_type_id: Number(editForm.term_type_id) });
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Term updated"); setEditingId(null); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteTerm(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Term deleted");
      setDeletingId(null);
    });
  }

  function FormFields({ vals, onChange }: { vals: typeof emptyForm; onChange: (v: typeof emptyForm) => void }) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Term *</label>
            <input type="text" value={vals.term} onChange={(e) => onChange({ ...vals, term: e.target.value })}
              placeholder="e.g. Punchline" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Type</label>
              <select value={vals.term_type_id} onChange={(e) => onChange({ ...vals, term_type_id: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
                <option value={0}>— None —</option>
                {termTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Priority</label>
              <input type="number" value={vals.priority} onChange={(e) => onChange({ ...vals, priority: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Definition *</label>
          <textarea rows={2} value={vals.definition} onChange={(e) => onChange({ ...vals, definition: e.target.value })}
            placeholder="What does this term mean?" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Example</label>
          <textarea rows={2} value={vals.example} onChange={(e) => onChange({ ...vals, example: e.target.value })}
            placeholder="Example usage..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Terms</h1>
          <p className="mt-1 text-gray-400">{terms.length} term{terms.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Term
        </button>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-violet-800/50 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-violet-300">New Term</h2>
          <FormFields vals={form} onChange={setForm} />
          <div className="mt-4 flex gap-3">
            <button onClick={handleCreate} disabled={isPending || !form.term.trim() || !form.definition.trim()}
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
            <h3 className="text-lg font-semibold text-white">Delete Term?</h3>
            <p className="mt-2 text-sm text-gray-400">This permanently deletes the term and cannot be undone.</p>
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
        {terms.map((t) => (
          <div key={t.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            {editingId === t.id ? (
              <>
                <FormFields vals={editForm} onChange={setEditForm} />
                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleUpdate(t.id)} disabled={isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold text-white">{t.term}</span>
                      {t.term_type_id ? (
                        <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-xs text-violet-300">{typeMap.get(t.term_type_id) ?? `type ${t.term_type_id}`}</span>
                      ) : null}
                      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">priority {t.priority}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">{t.definition}</p>
                    {t.example && <p className="mt-1 text-xs italic text-gray-500">"{t.example}"</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => { setEditingId(t.id); setEditForm({ term: t.term, definition: t.definition, example: t.example, priority: t.priority, term_type_id: t.term_type_id }); }}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Edit</button>
                    <button onClick={() => setDeletingId(t.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {terms.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">No terms yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
