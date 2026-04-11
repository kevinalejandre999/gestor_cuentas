"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Wallet, 
  Users, 
  Trash2, 
  ChevronRight,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import CreateWalletModal from "@/components/create-wallet-modal";
import WalletMembersModal from "@/components/wallet-members-modal";

interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  ownerId: string;
  members?: any[];
  _count?: {
    members: number;
    transactions: number;
  };
}

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    try {
      setLoading(true);
      const res = await fetch("/api/wallets");
      if (!res.ok) throw new Error("Error al cargar carteras");
      const data = await res.json();
      setWallets(data);
    } catch (err) {
      toast.error("Error al cargar carteras");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(walletId: string, walletName: string) {
    if (!confirm(`¿Eliminar la cartera "${walletName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/wallets/${walletId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }

      toast.success("Cartera eliminada");
      loadWallets();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(amount);
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Carteras</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Cargando carteras...</p>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No tienes carteras aún. Crea tu primera cartera para empezar.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear cartera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <Card 
              key={wallet.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/wallets/${wallet.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {wallet.name}
                      </h3>
                      <Badge variant="secondary">{wallet.currency}</Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(wallet.balance, wallet.currency)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {wallet._count?.members || wallet.members?.length || 1} miembro(s)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWallet(wallet);
                        setShowMembers(true);
                      }}
                      title="Gestionar miembros"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(wallet.id, wallet.name);
                      }}
                      title="Eliminar cartera"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            loadWallets();
          }}
        />
      )}

      {showMembers && selectedWallet && (
        <WalletMembersModal
          walletId={selectedWallet.id}
          onClose={() => {
            setShowMembers(false);
            setSelectedWallet(null);
          }}
        />
      )}
    </div>
  );
}
