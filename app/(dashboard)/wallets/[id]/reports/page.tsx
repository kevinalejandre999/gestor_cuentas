"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { formatDisplayDate } from "@/lib/date-utils";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

type Period = "this-month" | "last-month" | "last-3-months" | "all";

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

interface WalletData {
  id: string;
  name: string;
  currency: string;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

function getPeriodFilter(period: Period) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from = new Date(2000, 0, 1);

  if (period === "this-month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "last-month") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to.setDate(0);
    to.setHours(23, 59, 59);
  } else if (period === "last-3-months") {
    from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  }

  return { from, to };
}

export default function WalletReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [period, setPeriod] = useState<Period>("this-month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    loadData();
  }, [id]);
  
  const currency = wallet?.currency || "PYG";

  const { from, to } = useMemo(() => getPeriodFilter(period), [period]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, from, to]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      const val = parseFloat(t.amount);
      if (t.type === "INCOME") income += val;
      else expense += val;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.type === "EXPENSE") {
        const cat = t.category || "Sin categoria";
        map.set(cat, (map.get(cat) || 0) + parseFloat(t.amount));
      }
    });
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: getMonthLabel(d),
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const label = getMonthLabel(d);
      const monthEntry = months.find((m) => m.label === label);
      if (monthEntry) {
        const val = parseFloat(t.amount);
        if (t.type === "INCOME") monthEntry.income += val;
        else monthEntry.expense += val;
      }
    });

    return months;
  }, [transactions]);

  const periodButtons: { key: Period; label: string }[] = [
    { key: "this-month", label: "Este mes" },
    { key: "last-month", label: "Mes pasado" },
    { key: "last-3-months", label: "3 meses" },
    { key: "all", label: "Todo" },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PieChartIcon className="h-6 w-6 text-primary" />
          Informes
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {periodButtons.map((p) => (
          <Button
            key={p.key}
            variant={period === p.key ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {loading && <p className="text-center text-muted-foreground">Cargando...</p>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Total Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  +{formatCurrency(totalIncome, currency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  -{formatCurrency(totalExpense, currency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {balance >= 0 ? "+" : ""}
                  {formatCurrency(balance, currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gastos por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {expensesByCategory.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-20">
                      No hay gastos en este periodo
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolucion mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) =>
                          new Intl.NumberFormat("es-ES", { notation: "compact" }).format(v)
                        }
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                      <Legend />
                      <Bar dataKey="income" name="Ingresos" fill="#22c55e" />
                      <Bar dataKey="expense" name="Gastos" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transacciones del periodo</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                  {filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {t.title || t.description || "Sin descripcion"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDisplayDate(t.date)}
                          {t.category ? ` - ${t.category}` : ""}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(parseFloat(t.amount), currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay transacciones en este periodo
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
