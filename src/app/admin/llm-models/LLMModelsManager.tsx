"use client";

import { useState, useTransition } from "react";
import { createLLMModel, updateLLMModel, deleteLLMModel } from "../actions";

interface Model {
  id: number;
  name: string;
  provider_model_id: string;
  llm_provider_id: number;
  is_temperature_supported: boolean;
  created_datetime_utc: string | null;
}

interface Provider {
  id: number;
  name: string;
}

const emptyForm = { name: "", provider_model_id: "", llm_provider_id: 0, is_temperature_supported: false };

export default function LLMModelsManager({ models, providers }: { models: Model[]; providers: Provider[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const providerMap = new Map(providers.map((p) => [p.id, p.name]));

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleCreate() {
    if (!form.name.trim() || !form.provider_model_id.trim() || !form.llm_provider_id) return;
    startTransition(async () => {
      const res = await createLLMModel({ ...form, llm_provider_id: Number(form.llm_provider_id) });
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Model created"); setForm(emptyForm); setShowCreate(false); }
    });
  }

  function handleUpdate(id: number) {
    if (!editForm.name.trim() || !editForm.provider_model_id.trim() || !editForm.llm_provider_id) return;
    startTransition(async () => {
      const res = await updateLLMModel(id, { ...editForm, llm_provider_id: Number(editForm.llm_provider_id) });
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Model updated"); setEditingId(null); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteLLMModel(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Model deleted");
      setDeletingId(null);
    });
  }

  function FormFields({ vals, onChange }: { vals: typeof emptyForm; onChange: (v: typeof emptyForm) => void }) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs text-gray-500">Display Name</label>
          <input type="text" value={vals.name} onChange={(e) => onChange({ ...vals, name: e.target.value })}
            placeholder="e.g. GPT-4o" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs text-gray-500">Provider Model ID</label>
          <input type="text" value={vals.provider_model_id} onChange={(e) => onChange({ ...vals, provider_model_id: e.target.value })}
            placeholder="e.g. gpt-4o-2024-08-06" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Provider</label>
          <select value={vals.llm_provider_id} onChange={(e) => onChange({ ...vals, llm_provider_id: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            <option value={0}>— Select provider —</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={vals.is_temperature_supported} onChange={(e) => onChange({ ...vals, is_temperature_supported: e.target.checked })}
              className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-violet-600 focus:ring-violet-500" />
            <span className="text-sm text-gray-300">Temperature supported</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">LLM Models</h1>
          <p className="mt-1 text-gray-400">{models.length} model{models.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Model
        </button>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-violet-800/50 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-violet-300">New Model</h2>
          <FormFields vals={form} onChange={setForm} />
          <div className="mt-4 flex gap-3">
            <button onClick={handleCreate} disabled={isPending || !form.name.trim() || !form.provider_model_id.trim() || !form.llm_provider_id}
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
            <h3 className="text-lg font-semibold text-white">Delete Model?</h3>
            <p className="mt-2 text-sm text-gray-400">This permanently deletes the model. LLM responses referencing it may be affected.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => confirmDelete(deletingId)} disabled={isPending} className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isPending ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Model ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Temp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {models.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-gray-800/30">
                {editingId === m.id ? (
                  <td colSpan={5} className="px-4 py-4">
                    <FormFields vals={editForm} onChange={setEditForm} />
                    <div className="mt-3 flex gap-3">
                      <button onClick={() => handleUpdate(m.id)} disabled={isPending} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700">Cancel</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-4 text-sm font-medium text-white">{m.name}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                        {providerMap.get(m.llm_provider_id) ?? `#${m.llm_provider_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-gray-400">{m.provider_model_id}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs ${m.is_temperature_supported ? "text-emerald-400" : "text-gray-600"}`}>
                        {m.is_temperature_supported ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(m.id); setEditForm({ name: m.name, provider_model_id: m.provider_model_id, llm_provider_id: m.llm_provider_id, is_temperature_supported: m.is_temperature_supported }); }}
                          className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Edit</button>
                        <button onClick={() => setDeletingId(m.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Delete</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No models found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
