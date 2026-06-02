import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { OpenSessionForm } from "./open-form";

export default function AbrirCajaPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/cierre-caja">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" />
          Abrir caja
        </h1>
        <p className="text-muted-foreground">
          Ingresa el monto inicial con el que arrancas el turno
        </p>
      </div>
      <OpenSessionForm />
    </div>
  );
}
