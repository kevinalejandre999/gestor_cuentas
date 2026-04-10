"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/store";

interface Wallet {
  id: string;
  name: string;
  currency: string;
}

export default function WalletSelector({
  currentId,
}: {
  currentId?: string;
}) {
  const router = useRouter();
  const { lastWalletId, setLastWalletId } = useWalletStore();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWallets(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    setLastWalletId(id);
    router.push(`/wallets/${id}`);
  }

  const selectedId = currentId || lastWalletId || "";

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={handleChange}
        disabled={loading || wallets.length === 0}
        className="h-10 w-full min-w-[180px] appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Seleccionar cartera"
      >
        {wallets.length === 0 && (
          <option value="">Sin carteras</option>
        )}
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} ({w.currency})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
