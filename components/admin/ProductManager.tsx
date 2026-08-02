"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProductListItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  entity: {
    publicationState: string;
  };
  syncState?: {
    status: string;
  } | null;
};

type ProductListResponse = {
  items?: ProductListItem[];
};

function useProductResults() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;

    async function fetchResults() {
      try {
        const response = await fetch("/api/admin/products", { signal: controller.signal });
        const data = (await response.json()) as ProductListResponse;

        if (controller.signal.aborted || currentRequest !== requestId.current) {
          return;
        }

        if (!response.ok) {
          setError("Could not load products.");
          return;
        }

        setItems(data.items ?? []);
        setError("");
      } catch {
        if (controller.signal.aborted || currentRequest !== requestId.current) {
          return;
        }

        setError("Could not load products.");
      }
    }

    void fetchResults();

    return () => {
      controller.abort();
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { items, error, reload };
}

export default function ProductManager() {
  const { items, error } = useProductResults();

  return (
    <main className="min-h-screen flex-1 p-6 text-white">
      <h1 className="text-3xl font-black">Product management</h1>
      <p className="mt-2 text-white/60">
        Manage catalog data, publication, recommendations, images, and knowledge sync.
      </p>

      {error && <p className="mt-4 text-red-300">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-right">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Sync</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id} className="border-t border-white/10">
                <td className="p-3">
                  {product.nameAr}{" "}
                  <span className="text-white/40">{product.nameEn}</span>
                </td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{product.entity.publicationState}</td>
                <td className="p-3">{product.syncState?.status ?? "PENDING"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
