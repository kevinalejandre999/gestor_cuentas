"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const { lastWalletId } = useWalletStore();

  useEffect(() => {
    if (lastWalletId) {
      router.replace(`/wallets/${lastWalletId}`);
    }
  }, [lastWalletId, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-muted-foreground">
        Selecciona una cartera para comenzar
      </p>
    </div>
  );
}
