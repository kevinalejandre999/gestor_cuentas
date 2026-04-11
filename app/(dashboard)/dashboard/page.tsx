"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateWalletModal from "@/components/create-wallet-modal";

export default function DashboardPage() {
  const router = useRouter();
  const { lastWalletId, setLastWalletId } = useWalletStore();
  const [hasWallets, setHasWallets] = useState<boolean | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => res.json())
      .then((data) => {
        const wallets = Array.isArray(data) ? data : [];
        setHasWallets(wallets.length > 0);
        if (wallets.length > 0 && lastWalletId) {
          const exists = wallets.find((w: any) => w.id === lastWalletId);
          if (exists) {
            router.replace(`/wallets/${lastWalletId}`);
          } else {
            setLastWalletId(wallets[0].id);
            router.replace(`/wallets/${wallets[0].id}`);
          }
        }
      })
      .catch(() => setHasWallets(false));
  }, [lastWalletId, router, setLastWalletId]);

  if (hasWallets === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground">
          {hasWallets
            ? "Selecciona una cartera desde el menú superior"
            : "Creá tu primera cartera para empezar a gestionar tus finanzas"}
        </p>
      </div>

      {!hasWallets && (
        <Button
          onClick={() => setShowCreate(true)}
          className="h-12 px-6 text-base"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear cartera
        </Button>
      )}

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setHasWallets(true);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
