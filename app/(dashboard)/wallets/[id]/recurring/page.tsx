"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatNumberInput } from "@/lib/currency";

type TabType = "pending" | "completed";

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

interface WalletData {
  id: string;
  name: string;
  currency: string;
}

// Categorias por defecto
const defaultExpenseCategories = ["Alimentacion", "Transporte", "Hogar", "Salud", "Entretenimiento", "Trabajo", "Otros"];
const defaultIncomeCategories = ["Sueldo", "Freelance", "Inversiones", "Otros"];

export default function RecurringPage() {
  const params = useParams();
  const walletId = params.id as string;

  const [pending, setPending] = useState<Recurring[]>([]);
  const [completed, setCompleted] = useState<Recurring[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [currentMonth, setCurrentMonth] = useState(0);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  
  const currency = wallet?.currency || "PYG";

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const [recurringRes, walletRes] = await Promise.all([
        fetch(`/api/recurring?walletId=${walletId}`),
        fetch(`/api/wallets/${walletId}`),
      ]);
      
      if (!recurringRes.ok) throw new Error("Error al cargar");
      const data = await recurringRes.json();
      setPending(data.pending || []);
      setCompleted(data.completed || []);
      setCurrentMonth(data.currentMonth || new Date().getMonth() + 1);
      
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
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

  const handleComplete = async (id: string) => {
    if (!confirm("¿Marcar esta cuota como completada? Se registrará en los movimientos.")) return;
    
    setCompletingId(id);
    try {
      const res = await fetch("/api/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, walletId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al completar");
      }
      
      toast.success("Cuota completada y registrada en movimientos");
      fetchRecurring();
      // Cambiar a la pestaña de completadas
      setActiveTab("completed");
    } catch (err: any) {
      toast.error(err.message || "Error al completar");
    } finally {
      setCompletingId(null);
    }
  };

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
      fetchRecurring();
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
      setDisplayAmount("");
      setDescription("");
      setDayOfMonth("");
      fetchRecurring();
    } catch {
      toast.error("Error al crear");
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmountDisplay = (value: string) => {
    return formatCurrency(parseFloat(value), currency);
  };

  const availableCategories = categories.length > 0 
    ? categories.map(c => c.name)
    : (type === "INCOME" ? defaultIncomeCategories : defaultExpenseCategories);

  const displayItems = activeTab === "pending" ? pending : completed;

  return (
    <div className="p-4 pb-24 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cuotas fijas</h1>
        <span className="text-sm text-muted-foreground">
          {monthNames[currentMonth - 1]}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === "pending"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendientes ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === "completed"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Completadas ({completed.length})
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {activeTab === "pending" 
              ? "No hay cuotas pendientes para este mes." 
              : "No hay cuotas completadas este mes."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.type === "INCOME" ? (
                        <span className="text-green-600 font-medium">Ingreso</span>
                      ) : (
                        <span className="text-red-600 font-medium">Gasto</span>
                      )}{" "}
                      {formatAmountDisplay(item.amount)} - Dia {item.dayOfMonth}
                    </p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(item.id)}
                        disabled={completingId === item.id}
                        className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        {completingId === item.id ? (
                          "..."
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Completar
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
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
                    type="text"
                    inputMode="numeric"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="font-mono text-lg"
                    required
                  />
                  {amount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      = {formatCurrency(Number(amount), currency)}
                    </p>
                  )}
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
