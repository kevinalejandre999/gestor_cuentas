"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { X } from "lucide-react";
import { formatCurrency, formatNumberInput, parseFormattedNumber, CURRENCY_CONFIG } from "@/lib/currency";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string | null;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  title: string | null;
  description: string | null;
  category: string | null;
  date: string;
}

interface TransactionFormProps {
  walletId: string;
  transaction?: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

// Categorias por defecto si el usuario no tiene ninguna
const defaultExpenseCategories = [
  "Alimentacion", "Transporte", "Hogar", "Salud", 
  "Entretenimiento", "Trabajo", "Otros"
];
const defaultIncomeCategories = [
  "Sueldo", "Freelance", "Inversiones", "Otros"
];

export default function TransactionForm({
  walletId,
  transaction,
  onClose,
  onSuccess,
  currency = "PYG",
}: TransactionFormProps) {
  const isEdit = !!transaction;
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Cargar categorias del usuario
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`/api/categories?type=${type}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [type]);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || "");
      setType(transaction.type);
      setAmount(transaction.amount);
      // Formatear el monto para mostrar
      const numAmount = parseFloat(transaction.amount);
      setDisplayAmount(formatNumberInput(Math.round(numAmount).toString(), currency));
      setDescription(transaction.description || "");
      setCategory(transaction.category || "");
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
    }
  }, [transaction, currency]);

  useEffect(() => {
    if (!isEdit && categories.length > 0) {
      setCategory(categories[0].name);
    }
  }, [categories, isEdit]);

  // Obtener lista de categorias a mostrar
  const availableCategories = categories.length > 0 
    ? categories.map(c => c.name)
    : (type === "INCOME" ? defaultIncomeCategories : defaultExpenseCategories);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    
    if (numericValue) {
      setAmount(numericValue);
      setDisplayAmount(formatNumberInput(numericValue, currency));
    } else {
      setAmount("");
      setDisplayAmount("");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type,
      amount: Number(amount),
      title: title || null,
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
      toast.error(data.error || "Error al guardar");
      return;
    }

    toast.success(isEdit ? "Transaccion actualizada" : "Transaccion creada");
    onSuccess();
    onClose();
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!confirm("Estas seguro de eliminar esta transaccion?")) return;

    setLoading(true);
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE",
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al eliminar");
      toast.error(data.error || "Error al eliminar");
      return;
    }

    toast.success("Transaccion eliminada");
    onSuccess();
    onClose();
  }

  const currencyConfig = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.PYG;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm max-h-[80vh] flex flex-col relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
          <CardTitle className="text-lg">
            {isEdit ? "Editar transaccion" : "Nueva transaccion"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto pb-32">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="tf-title">Titulo</Label>
              <Input
                id="tf-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Compra supermercado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-amount">
                Monto {currencyConfig.isPrefix ? `(${currencyConfig.symbol})` : `(Gs.)`}
              </Label>
              <Input
                id="tf-amount"
                type="text"
                inputMode="numeric"
                required
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="0"
                className="font-mono text-lg"
              />
              {amount && (
                <p className="text-sm text-muted-foreground">
                  = {formatCurrency(Number(amount), currency)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-category">
                Categoria
                {categories.length === 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Puedes crear categorias personalizadas en Configuracion)
                  </span>
                )}
              </Label>
              <select
                id="tf-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-desc">Descripcion (opcional)</Label>
              <Input
                id="tf-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles adicionales..."
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
          </form>
        </CardContent>
        {/* Botones fijos en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t rounded-b-lg z-10">
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
            <Button 
              type="submit"
              form="transaction-form"
              className="flex-1" 
              disabled={loading}
            >
              {loading ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
