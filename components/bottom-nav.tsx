"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User } from "lucide-react";
import { useWalletStore } from "@/lib/store";

export default function BottomNav() {
  const pathname = usePathname();
  const { lastWalletId } = useWalletStore();

  const walletHref = lastWalletId ? `/wallets/${lastWalletId}` : "/dashboard";

  const items = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: walletHref, label: "Cartera", icon: Wallet },
    { href: "/settings", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
