"use client";

import { useEffect, useMemo, useState } from "react";
import { useWalletStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TransactionForm from "@/components/transaction-form";
import WalletMembersModal from "@/components/wallet-members-modal";
import { Users, TrendingUp, TrendingDown, Plus } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Period = "this-month" | "last-month" | "last-3-months";

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
  balance: number;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amount);
}

function getPeriodDates(period: Period) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from = new Date();

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

export default function WalletPage({
  params,
}: {
  params: { id: string };
}) {
  const { setLastWalletId } = useWalletStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("this-month");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    setLastWalletId(params.id);
  }, [params.id, setLastWalletId]);

  async function loadData() {
    setLoading(true);
    const [walletRes, txRes] = await Promise.all([
      fetch(`/api/wallets/${params.id}`),
      fetch(`/api/transactions?walletId=${params.id}`),
    ]);

    if (walletRes.ok) {
      const w = await walletRes.json();
      setWallet(w);
    }
    if (txRes.ok) {
      const t = await txRes.json();
      setTransactions(t);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id]);

  const { from, to } = useMemo(() => getPeriodDates(period), [period]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, from, to]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      const val = parseFloat(t.amount);
      if (t.type === "INCOME") income += val;
      else expense += val;
    });
    return { income, expense };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    if (!wallet) return [];

    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const periodChange = sorted.reduce((acc, t) => {
      return acc + (t.type === "INCOME" ? -parseFloat(t.amount) : parseFloat(t.amount));
    }, 0);

    let runningBalance = wallet.balance + periodChange;
    const data: { date: string; balance: number }[] = [];

    const dateMap = new Map<string, number>();
    sorted.forEach((t) => {
      const d = new Date(t.date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
      const change = t.type === "INCOME" ? parseFloat(t.amount) : -parseFloat(t.amount);
      dateMap.set(d, (dateMap.get(d) || 0) + change);
    });

    dateMap.forEach((change, dateLabel) => {
      runningBalance += change;
      data.push({ date: dateLabel, balance: runningBalance });
    });

    if (data.length === 0) {
      return [
        {
          date: from.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
          balance: wallet.balance,
        },
      ];
    }

    return data;
  }, [filteredTransactions, wallet, from]);

  const last5 = filteredTransactions.slice(0, 5);

  return (
    <div className="p-4 pb-24 max-w-md mx-auto space-y-6">
      {loading && <p className="text-center text-muted-foreground">Cargando...</p>}

      {wallet && (
        <>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">{wallet.name}</p>
              <button
                onClick={() => setShowMembers(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
            <h1 className="text-4xl font-bold">
              {formatCurrency(wallet.balance, wallet.currency)}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Saldo actual
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {(
              [
                { key: "this-month", label: "Este mes" },
                { key: "last-month", label: "Mes pasado" },
                { key: "last-3-months", label: "3 meses" },
              ] as { key: Period; label: string }[]
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600">
                  +{formatCurrency(stats.income, wallet.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(stats.expense, wallet.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolucion del saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) =>
                        new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: wallet.currency,
                          notation: "compact",
                        }).format(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        formatCurrency(value, wallet.currency)
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ultimas transacciones</CardTitle>
              <Link href={`/wallets/${wallet.id}/transactions`}>
                <span className="text-sm text-primary hover:underline cursor-pointer">Ver todas</span>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {last5.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No hay transacciones en este periodo
                </p>
              ) : (
                last5.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.title || t.description || "Sin descripcion"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("es-ES")} {" "}
                        {t.user.name} {t.user.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <p
                        className={`text-sm font-semibold ${
                          t.type === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(parseFloat(t.amount), wallet.currency)}
                      </p>
                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          setShowForm(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary underline"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </button>

          {showForm && (
            <TransactionForm
              walletId={wallet.id}
              transaction={editingTransaction}
              onClose={() => {
                setShowForm(false);
                setEditingTransaction(null);
              }}
              onSuccess={loadData}
            />
          )}

          {showMembers && (
            <WalletMembersModal
              walletId={wallet.id}
              onClose={() => setShowMembers(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
