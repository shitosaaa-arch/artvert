"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Pest = {
  id: string;
  classification: string;
  severity: string;
  economicImpact: string;
  scientificName: string | null;
  entity: { name: string; slug: string; publicationState: string };
  symptoms: { value: string }[];
  damagePatterns: { value: string }[];
  lifecycleStages: { value: string }[];
  syncState: { status: string } | null;
};

type PestForm = {
  name: string;
  slug: string;
  classification: string;
  severity: string;
  economicImpact: string;
  scientificName: string;
  description: string;
  aliases: string;
  symptoms: string;
  damagePatterns: string;
  lifecycleStages: string;
};

type Query = {
  page: number;
  q: string;
  classification: string;
  severity: string;
  impact: string;
  sync: string;
  sort: string;
};

const blank: PestForm = {
  name: "",
  slug: "",
  classification: "INSECT",
  severity: "MODERATE",
  economicImpact: "MODERATE",
  scientificName: "",
  description: "",
  aliases: "",
  symptoms: "",
  damagePatterns: "",
  lifecycleStages: "",
};

const classifications = ["INSECT", "MITE", "NEMATODE", "MOLLUSK", "RODENT", "OTHER"];
const severities = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
const impacts = ["LOW", "MODERATE", "HIGH", "SEVERE"];
const syncStates = ["PENDING", "SYNCED", "FAILED"];
const arrayFields = new Set<keyof PestForm>(["aliases", "symptoms", "damagePatterns", "lifecycleStages"]);

function buildSearchParams(query: Query) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: "12", sort: query.sort, direction: "desc" });
  const filters = {
    q: query.q,
    classification: query.classification,
    severity: query.severity,
    economicImpact: query.impact,
    syncStatus: query.sync,
  };

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  return params;
}

function usePestResults(query: Query) {
  const [items, setItems] = useState<Pest[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;

    async function fetchResults() {
      try {
        const response = await fetch(`/api/admin/pests?${buildSearchParams(query)}`, { signal: controller.signal });
        const data = await response.json();

        if (controller.signal.aborted || currentRequest !== requestId.current) return;

        if (!response.ok) {
          setError(data.error ?? "Pests could not be loaded.");
          return;
        }

        setItems(data.items);
        setPageCount(data.pageCount);
        setError("");
      } catch (error) {
        if (controller.signal.aborted || currentRequest !== requestId.current) return;
        setError(error instanceof Error ? error.message : "Pests could not be loaded.");
      }
    }

    void fetchResults();
    return () => controller.abort();
  }, [query, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  return { items, pageCount, error, reload };
}

function formForPest(pest: Pest): PestForm {
  return {
    ...blank,
    name: pest.entity.name,
    slug: pest.entity.slug,
    classification: pest.classification,
    severity: pest.severity,
    economicImpact: pest.economicImpact,
    scientificName: pest.scientificName ?? "",
    symptoms: pest.symptoms.map((value) => value.value).join(", "),
    damagePatterns: pest.damagePatterns.map((value) => value.value).join(", "),
    lifecycleStages: pest.lifecycleStages.map((value) => value.value).join(", "),
  };
}

export default function PestManager() {
  const [query, setQuery] = useState<Query>({ page: 1, q: "", classification: "", severity: "", impact: "", sync: "", sort: "updatedAt" });
  const [form, setForm] = useState<PestForm>(blank);
  const [selected, setSelected] = useState<Pest | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const { items, pageCount, error, reload } = usePestResults(query);
  const page = query.page;

  const updateQuery = (update: Partial<Query>, resetPage = false) => {
    setQuery((current) => ({ ...current, ...update, page: resetPage ? 1 : update.page ?? current.page }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        arrayFields.has(key as keyof PestForm) ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : value,
      ]),
    );
    const response = await fetch(selected ? `/api/admin/pests/${selected.id}` : "/api/admin/pests", {
      method: selected ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Pest could not be saved.");
      return;
    }

    setEditing(false);
    setSelected(data);
    reload();
  };

  const retry = async (pest: Pest) => {
    const response = await fetch(`/api/admin/pests/${pest.id}/sync`, { method: "POST" });
    setMessage(response.ok ? "Knowledge sync completed." : "Knowledge sync failed.");
    reload();
  };

  const openNewPest = () => {
    setForm(blank);
    setSelected(null);
    setEditing(true);
  };

  const selectPest = (pest: Pest) => {
    setSelected(pest);
    setForm(formForPest(pest));
    setEditing(false);
  };

  return (
    <main className="min-h-screen flex-1 bg-[#07140f] p-5 text-white lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex justify-between">
          <h1 className="text-3xl font-black">Pest management</h1>
          <button onClick={openNewPest} className="rounded bg-emerald-300 px-4 py-2 font-bold text-black">
            New pest
          </button>
        </header>

        <div className="mb-4 grid gap-2 md:grid-cols-6">
          <input value={query.q} onChange={(event) => updateQuery({ q: event.target.value }, true)} placeholder="Search name, symptom, damage" />
          <select value={query.classification} onChange={(event) => updateQuery({ classification: event.target.value }, true)}>
            <option value="">All classifications</option>
            {classifications.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={query.severity} onChange={(event) => updateQuery({ severity: event.target.value }, true)}>
            <option value="">All severity</option>
            {severities.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={query.impact} onChange={(event) => updateQuery({ impact: event.target.value }, true)}>
            <option value="">All impact</option>
            {impacts.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={query.sync} onChange={(event) => updateQuery({ sync: event.target.value }, true)}>
            <option value="">All sync states</option>
            {syncStates.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={query.sort} onChange={(event) => updateQuery({ sort: event.target.value })}>
            <option value="updatedAt">Recently updated</option>
            <option value="createdAt">Recently created</option>
            <option value="name">Name</option>
          </select>
        </div>

        {(message || error) && <p className="mb-3">{message || error}</p>}

        <div className="rounded border border-white/10">
          {items.map((pest) => (
            <div key={pest.id} className="flex justify-between border-b border-white/10 p-4">
              <button onClick={() => selectPest(pest)}>
                <b>{pest.entity.name}</b> · {pest.classification} · {pest.severity} · {pest.economicImpact} · {pest.syncState?.status ?? "PENDING"}
              </button>
              <button onClick={() => void retry(pest)}>Retry sync</button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-3">
          <button disabled={page === 1} onClick={() => updateQuery({ page: page - 1 })}>Previous</button>
          <span>{page}/{pageCount}</span>
          <button disabled={page === pageCount} onClick={() => updateQuery({ page: page + 1 })}>Next</button>
        </div>

        {(editing || selected) && (
          <div className="fixed inset-0 overflow-auto bg-black/75 p-5">
            <div className="mx-auto max-w-xl bg-[#0b2118] p-6">
              {editing ? (
                <form onSubmit={submit} className="grid gap-3">
                  {(["name", "slug", "scientificName", "description", "aliases", "symptoms", "damagePatterns", "lifecycleStages"] as const).map((key) => (
                    <input key={key} required={key === "name"} value={form[key]} placeholder={key} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                  ))}
                  <select value={form.classification} onChange={(event) => setForm({ ...form, classification: event.target.value })}>
                    {classifications.map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
                    {severities.map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <select value={form.economicImpact} onChange={(event) => setForm({ ...form, economicImpact: event.target.value })}>
                    {impacts.map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <button>Save pest</button>
                </form>
              ) : selected && (
                <>
                  <h2>{selected.entity.name}</h2>
                  <p>{selected.scientificName}</p>
                  <p>Symptoms: {selected.symptoms.map((symptom) => symptom.value).join(", ")}</p>
                  <p>Damage patterns: {selected.damagePatterns.map((pattern) => pattern.value).join(", ")}</p>
                  <p>Lifecycle: {selected.lifecycleStages.map((stage) => stage.value).join(" → ")}</p>
                  <button onClick={() => setEditing(true)}>Edit</button>
                </>
              )}
              <button onClick={() => { setSelected(null); setEditing(false); }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
