"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";
import { LogOut, Mail, Phone, User, Plus, Trash2, Tag, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useThemeStore } from "@/lib/theme-store";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorias");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error("Error al cargar categorias");
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setAddingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          type: newCategoryType,
          color: newCategoryColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear categoria");
      }

      toast.success("Categoria creada");
      setNewCategoryName("");
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoria?")) return;

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Categoria eliminada");
      loadCategories();
    } catch (err) {
      toast.error("Error al eliminar categoria");
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24 pt-[env(safe-area-inset-top)]">
      <h1 className="text-2xl font-bold">Configuracion</h1>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Claro
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Oscuro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">
                {user?.name} {user?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Telefono</p>
              <p className="font-medium">{user?.phone || "No registrado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Mis Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulario nueva categoria */}
          <form onSubmit={handleAddCategory} className="space-y-3">
            <div className="space-y-2">
              <Label>Nueva categoria</Label>
              <Input
                placeholder="Nombre de la categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={newCategoryType === "INCOME" ? "default" : "outline"}
                onClick={() => setNewCategoryType("INCOME")}
                className="flex-1"
              >
                Ingreso
              </Button>
              <Button
                type="button"
                variant={newCategoryType === "EXPENSE" ? "default" : "outline"}
                onClick={() => setNewCategoryType("EXPENSE")}
                className="flex-1"
              >
                Gasto
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Button type="submit" disabled={addingCategory} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </form>

          {/* Lista de categorias */}
          {loadingCategories ? (
            <p className="text-sm text-muted-foreground">Cargando categorias...</p>
          ) : (
            <div className="space-y-4">
              {/* Gastos */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Gastos ({expenseCategories.length})
                </h3>
                <div className="space-y-1">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || "#6366f1" }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingresos */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Ingresos ({incomeCategories.length})
                </h3>
                <div className="space-y-1">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || "#22c55e" }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Cerrar sesion
      </Button>
    </div>
  );
}
