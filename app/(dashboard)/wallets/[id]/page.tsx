"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/store";

export default function WalletPage({
  params,
}: {
  params: { id: string };
}) {
  const { setLastWalletId } = useWalletStore();

  useEffect(() => {
    setLastWalletId(params.id);
  }, [params.id, setLastWalletId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Dashboard de Cartera</h1>
      <p className="text-muted-foreground">
        ID: {params.id} — El contenido completo se implementará en la siguiente
        fase.
      </p>
    </div>
  );
}
