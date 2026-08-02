"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

type DeficiencyItem = {
  id: string;
  nutrientCode: string;
  nutrientNameAr: string;
  nutrientNameEn: string;
  classification: string;
  mobility: string;
  syncState: { status: string } | null;
};

type DeficiencyListResponse = {
  items: DeficiencyItem[];
  error?: string;
};

const classifications = [
  "MACRONUTRIENT",
  "SECONDARY_NUTRIENT",
  "MICRONUTRIENT",
  "BENEFICIAL_ELEMENT",
  "OTHER",
];

const mobilities = ["MOBILE", "IMMOBILE", "CONTEXT_DEPENDENT", "UNKNOWN"];

const initialForm = {
  nutrientCode: "",
  nutrientNameAr: "",
  nutrientNameEn: "",
  classification: "MACRONUTRIENT",
  mobility: "UNKNOWN",
  aliases: "",
  visualPatterns: "",
  causes: "",
  aggravatingConditions: "",
};

export default function DeficiencyManager() {
  const [items, setItems] = useState<DeficiencyItem[]>([]);
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState("");
  const [mobility, setMobility] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const searchParams = new URLSearchParams({
      page: "1",
      pageSize: "50",
      q: query,
      classification,
      mobility,
      sort: "name",
      direction: "asc",
    });
    const response = await fetch(`/api/admin/deficiencies?${searchParams}`);
    const data = (await response.json()) as DeficiencyListResponse;

    if (response.ok) {
      setItems(data.items);
    } else {
      setMessage(data.error ?? "Could not load deficiencies.");
    }
  }, [classification, mobility, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...form,
      aliases: form.aliases.split(",").filter(Boolean),
      visualPatterns: form.visualPatterns.split(",").filter(Boolean),
      causes: form.causes.split(",").filter(Boolean),
      aggravatingConditions: form.aggravatingConditions.split(",").filter(Boolean),
    };
    const response = await fetch("/api/admin/deficiencies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };

    setMessage(response.ok ? "Deficiency saved." : (data.error ?? "Could not save deficiency."));

    if (response.ok) {
      await load();
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-[#07140f] p-5 text-white lg:p-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        <section>
          <h1 className="mb-5 text-3xl font-black">Nutrient deficiency management</h1>

          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search nutrient, alias, symptom"
            />
            <select
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
            >
              <option value="">All classifications</option>
              {classifications.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select value={mobility} onChange={(event) => setMobility(event.target.value)}>
              <option value="">All mobility states</option>
              {mobilities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>

          {items.map((item) => (
            <article key={item.id} className="border-b border-white/10 p-3">
              <b>
                {item.nutrientNameEn} ({item.nutrientCode})
              </b>
              <p>
                {item.nutrientNameAr} · {item.classification} · {item.mobility} ·{" "}
                {item.syncState?.status ?? "PENDING"}
              </p>
            </article>
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Add deficiency</h2>

          <form onSubmit={submit} className="grid gap-3">
            {Object.entries(form).map(([key, value]) => {
              if (key === "classification") {
                return (
                  <select
                    key={key}
                    value={value}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  >
                    {classifications.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                );
              }

              if (key === "mobility") {
                return (
                  <select
                    key={key}
                    value={value}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  >
                    {mobilities.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                );
              }

              return (
                <input
                  key={key}
                  required={["nutrientCode", "nutrientNameAr", "nutrientNameEn"].includes(key)}
                  value={value}
                  placeholder={key}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              );
            })}

            <button className="rounded bg-emerald-300 p-2 font-bold text-black">
              Save deficiency
            </button>
          </form>

          {message && <p className="mt-3">{message}</p>}
        </section>
      </div>
    </main>
  );
}
