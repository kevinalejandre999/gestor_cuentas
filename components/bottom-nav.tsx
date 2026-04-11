"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, PieChart, Repeat, List, Settings } from "lucide-react";
import { useWalletStore } from "@/lib/store";

export default function BottomNav() {
  const pathname = usePathname();
  const { lastWalletId } = useWalletStore();

  // Si no hay wallet seleccionada, redirigir a dashboard
  const walletId = lastWalletId || "0";
  
  const items = [
    { href: "/dashboard", label: "Inicio", icon: Home, id: "inicio" },
    { href: `/wallets/${walletId}`, label: "Cartera", icon: Wallet, id: "cartera" },
    { href: `/wallets/${walletId}/transactions`, label: "Movimientos", icon: List, id: "movimientos" },
    { href: `/wallets/${walletId}/recurring`, label: "Fijos", icon: Repeat, id: "fijos" },
    { href: "/settings", label: "Ajustes", icon: Settings, id: "ajustes" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || 
                          pathname.startsWith(item.href + "/") ||
                          (item.id === "cartera" && pathname.includes("/wallets/") && !pathname.includes("/transactions") && !pathname.includes("/recurring") && !pathname.includes("/reports")) ||
                          (item.id === "movimientos" && pathname.includes("/transactions")) ||
                          (item.id === "fijos" && pathname.includes("/recurring"));
          
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
