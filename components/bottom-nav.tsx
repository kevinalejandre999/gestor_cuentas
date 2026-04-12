"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Repeat, List, Settings } from "lucide-react";
import { useWalletStore } from "@/lib/store";

export default function BottomNav() {
  const pathname = usePathname();
  const { lastWalletId } = useWalletStore();

  const walletId = lastWalletId || "0";
  
  const items = [
    { href: "/dashboard", label: "Inicio", icon: Home, id: "inicio" },
    { href: "/wallets", label: "Carteras", icon: Wallet, id: "carteras" },
    { href: `/wallets/${walletId}/transactions`, label: "Movimientos", icon: List, id: "movimientos" },
    { href: `/wallets/${walletId}/recurring`, label: "Fijos", icon: Repeat, id: "fijos" },
    { href: "/settings", label: "Ajustes", icon: Settings, id: "ajustes" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-2">
        {items.map((item) => {
          // Lógica de activación más específica
          let isActive = false;
          
          if (item.id === "inicio") {
            isActive = pathname === "/dashboard";
          } else if (item.id === "carteras") {
            // Solo activo en /wallets exacto, no en subrutas
            isActive = pathname === "/wallets";
          } else if (item.id === "movimientos") {
            isActive = pathname.includes("/transactions");
          } else if (item.id === "fijos") {
            isActive = pathname.includes("/recurring");
          } else if (item.id === "ajustes") {
            isActive = pathname === "/settings";
          }
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 px-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
