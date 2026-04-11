"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import TransactionForm from "@/components/transaction-form";
import { formatCurrency } from "@/lib/currency";

interface Transaction {
  id: string;
  title: string | null;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string | null;
  category: string | null;
  date: string;
  user: { name: string; lastName: string };
}

interface Wallet {
  id: string;
  name: string;
  currency: string;
}

export default function TransactionsPage() {
  const { id } = useParams<{ id: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function loadData() {
    setLoading(true);
    try {
      const [txRes, walletRes] = await Promise.all([
        fetch(`/api/transactions?walletId=${id}`),
        fetch(`/api/wallets/${id}`),
      ]);
      
      if (!txRes.ok) throw new Error("Error al cargar transacciones");
      const txData = await txRes.json();
      setTransactions(txData);
      
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          (t.title?.toLowerCase().includes(term) ?? false) ||
          (t.description?.toLowerCase().includes(term) ?? false) ||
          (t.category?.toLowerCase().includes(term) ?? false)
      );
    }

    if (typeFilter !== "ALL") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = parseFloat(a.amount) - parseFloat(b.amount);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, categoryFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      const val = parseFloat(t.amount);
      if (t.type === "INCOME") income += val;
      else expense += val;
    });
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const currency = wallet?.currency || "PYG";

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            {stats.count} transacciones
          </p>
        </div>
        <Button onClick={() => {
          setEditingTransaction(null);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Stats cards con texto auto-ajustable */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">
                +{formatCurrency(stats.income, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full shrink-0">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 truncate">
                -{formatCurrency(stats.expense, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {[
                { key: "ALL", label: "Todos" },
                { key: "INCOME", label: "Ingresos" },
                { key: "EXPENSE", label: "Gastos" },
              ].map((opt) => (
                <Button
                  key={opt.key}
                  variant={typeFilter === opt.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(opt.key as any)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="ALL">Todas las categorias</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === "date") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("date");
                  setSortOrder("desc");
                }
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Fecha
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === "amount") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("amount");
                  setSortOrder("desc");
                }
              }}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Monto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resultados ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay transacciones</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {t.title || t.description || "Sin titulo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("es-ES")}
                      {t.category ? ` · ${t.category}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <p className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                      t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(parseFloat(t.amount), currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTransaction(t);
                        setShowForm(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <TransactionForm
          walletId={id}
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSuccess={loadData}
          currency={currency}
        />
      )}
    </div>
  );
}
