import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletStore {
  lastWalletId: string | null;
  setLastWalletId: (id: string | null) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      lastWalletId: null,
      setLastWalletId: (id) => {
        set({ lastWalletId: id });
        if (typeof document !== "undefined") {
          if (id) {
            document.cookie = `lastWalletId=${id};path=/;max-age=31536000`;
          } else {
            document.cookie = `lastWalletId=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        }
      },
    }),
    { name: "gestor-cuentas-wallet" }
  )
);
