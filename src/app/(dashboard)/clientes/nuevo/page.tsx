import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { CustomerForm } from "../customer-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/clientes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-primary" />
          Nuevo cliente
        </h1>
        <p className="text-muted-foreground">
          Registra un cliente para ventas a crédito
        </p>
      </div>
      <CustomerForm mode="create" />
    </div>
  );
}
