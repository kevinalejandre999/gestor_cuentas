"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const expenseCategories = [
  "Comida",
  "Transporte",
  "Hogar",
  "Salud",
  "Entretenimiento",
  "Trabajo",
  "Otros",
];

const incomeCategories = ["Sueldo", "Freelance", "Inversiones", "Otros"];

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string | null;
  category: string | null;
  date: string;
}

interface TransactionFormProps {
  walletId: string;
  transaction?: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({
  walletId,
  transaction,
  onClose,
  onSuccess,
}: TransactionFormProps) {
  const isEdit = !!transaction;
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount);
      setDescription(transaction.description || "");
      setCategory(transaction.category || "");
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
    }
  }, [transaction]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type,
      amount: Number(amount),
      description: description || null,
      category: category || null,
      date,
      walletId,
    };

    const url = isEdit
      ? `/api/transactions/${transaction!.id}`
      : "/api/transactions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar");
      return;
    }

    onSuccess();
    onClose();
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!confirm("¿Estás seguro de eliminar esta transacción?")) return;

    setLoading(true);
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE",
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al eliminar");
      return;
    }

    onSuccess();
    onClose();
  }

  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {isEdit ? "Editar transacción" : "Nueva transacción"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "INCOME" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("INCOME")}
              >
                Ingreso
              </Button>
              <Button
                type="button"
                variant={type === "EXPENSE" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("EXPENSE")}
              >
                Gasto
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-amount">Monto</Label>
              <Input
                id="tf-amount"
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-category">Categoría</Label>
              <select
                id="tf-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecciona...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-desc">Descripción</Label>
              <Input
                id="tf-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-date">Fecha</Label>
              <Input
                id="tf-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="flex gap-2">
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Eliminar
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
