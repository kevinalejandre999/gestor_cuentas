import Link from "next/link";
import WalletSelector from "@/components/wallet-selector";
import LogoutButton from "@/components/logout-button";
import BottomNav from "@/components/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-bold text-lg">
            GestorCuentas
          </Link>
          <div className="flex items-center gap-3">
            <WalletSelector />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
