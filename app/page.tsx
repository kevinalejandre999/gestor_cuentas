import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">GestorCuentas</h1>
        <p className="text-muted-foreground">
          Gestión de cuentas y carteras compartidas
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 text-base">Iniciar sesión</Button>
        </Link>
        <Link href="/register" className="w-full">
          <Button variant="outline" className="w-full h-12 text-base">
            Crear cuenta
          </Button>
        </Link>
      </div>
    </div>
  );
}
