"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CreateWalletModal from "@/components/create-wallet-modal";
import { useWalletStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const { lastWalletId } = useWalletStore();
  const [loading, setLoading] = useState(true);
  const [hasWallets, setHasWallets] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => res.json())
      .then((data) => {
        const wallets = Array.isArray(data) ? data : [];
        if (wallets.length > 0) {
          // Si hay una última cartera seleccionada y existe en la lista, usar esa
          const lastWallet = lastWalletId && wallets.find((w: any) => w.id === lastWalletId);
          if (lastWallet) {
            router.replace(`/wallets/${lastWalletId}`);
          } else {
            // Si no, redirigir a la primera
            router.replace(`/wallets/${wallets[0].id}`);
          }
        } else {
          setHasWallets(false);
          setLoading(false);
        }
      })
      .catch(() => {
        setHasWallets(false);
        setLoading(false);
      });
  }, [router, lastWalletId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 pt-[env(safe-area-inset-top)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 pt-[env(safe-area-inset-top)] gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground">
          Crea tu primera cartera para empezar a gestionar tus finanzas
        </p>
      </div>

      <Button
        onClick={() => setShowCreate(true)}
        className="h-12 px-6 text-base"
      >
        <Plus className="h-5 w-5 mr-2" />
        Crear cartera
      </Button>

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
