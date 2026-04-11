"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}

export default function WalletMembersModal({
  walletId,
  onClose,
}: {
  walletId: string;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  async function loadMembers() {
    setFetching(true);
    const res = await fetch(`/api/wallets/${walletId}`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
    setFetching(false);
  }

  useEffect(() => {
    loadMembers();
  }, [walletId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/wallets/${walletId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Error al invitar");
      return;
    }
    toast.success("Miembro invitado");
    setEmail("");
    loadMembers();
  }

  async function handleRemove(userId: string) {
    if (!confirm("¿Eliminar este miembro?")) return;
    setLoading(true);
    const res = await fetch(`/api/wallets/${walletId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Error al eliminar");
      return;
    }
    toast.success("Miembro eliminado");
    loadMembers();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <Card className="w-full max-w-sm max-h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Miembros de la cartera</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="Email del usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </form>

          {fetching ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay miembros</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {m.user.name} {m.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.user.email} · {m.role}
                    </p>
                  </div>
                  {m.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(m.user.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cerrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
