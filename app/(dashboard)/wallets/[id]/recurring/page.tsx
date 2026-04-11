"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Recurring {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  category: string | null;
  description: string | null;
  dayOfMonth: number;
  active: boolean;
  user: { name: string; lastName: string };
}

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

// Categorias por defecto
const defaultExpenseCategories = ["Alimentacion", "Transporte", "Hogar", "Salud", "Entretenimiento", "Trabajo", "Otros"];
const defaultIncomeCategories = ["Sueldo", "Freelance", "Inversiones", "Otros"];

export default function RecurringPage() {
  const params = useParams();
  const walletId = params.id as string;

  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recurring?walletId=${walletId}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      toast.error("Error al cargar cuotas fijas");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`/api/categories?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  useEffect(() => {
    if (walletId) fetchRecurring();
  }, [walletId]);

  useEffect(() => {
    loadCategories();
  }, [type]);

  useEffect(() => {
    const availableCats = categories.length > 0 
      ? categories.map(c => c.name)
      : (type === "INCOME" ? defaultIncomeCategories : defaultExpenseCategories);
    setCategory(availableCats[0] || "");
  }, [type, categories]);

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta cuota fija?")) return;
    try {
      const res = await fetch("/api/recurring", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Cuota fija eliminada");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dayOfMonth) {
      toast.error("Completa los campos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          amount,
          category,
          description,
          dayOfMonth: Number(dayOfMonth),
          walletId,
        }),
      });
      if (!res.ok) throw new Error("Error al crear");
      toast.success("Cuota fija creada");
      setShowModal(false);
      setTitle("");
      setAmount("");
      setDescription("");
      setDayOfMonth("");
      fetchRecurring();
    } catch {
      toast.error("Error al crear");
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (value: string) => {
    return new Intl.NumberFormat("es-ES").format(parseFloat(value));
  };

  const availableCategories = categories.length > 0 
    ? categories.map(c => c.name)
    : (type === "INCOME" ? defaultIncomeCategories : defaultExpenseCategories);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Cuotas fijas</h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No hay cuotas fijas.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.type === "INCOME" ? (
                      <span className="text-green-600 font-medium">Ingreso</span>
                    ) : (
                      <span className="text-red-600 font-medium">Gasto</span>
                    )}{" "}
                    {formatAmount(item.amount)} - Dia {item.dayOfMonth}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        className="fixed bottom-20 right-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowModal(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-lg">Nueva cuota fija</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto pb-32">
              <form id="recurring-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="block mb-2">Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={type === "INCOME" ? "default" : "outline"}
                      onClick={() => setType("INCOME")}
                      className="flex-1"
                    >
                      Ingreso
                    </Button>
                    <Button
                      type="button"
                      variant={type === "EXPENSE" ? "default" : "outline"}
                      onClick={() => setType("EXPENSE")}
                      className="flex-1"
                    >
                      Gasto
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Titulo</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Alquiler"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">
                    Categoria
                    {categories.length === 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Crea categorias en Configuracion)
                      </span>
                    )}
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="dayOfMonth">Dia del mes</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    required
                  />
                </div>

              </form>
            </CardContent>
            {/* Botones fijos en la parte inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t rounded-b-lg z-10">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  form="recurring-form"
                  className="flex-1" 
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Crear"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
