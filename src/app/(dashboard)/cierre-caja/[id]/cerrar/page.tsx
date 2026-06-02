import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, Eye } from "lucide-react";
import { getCashSessionSummary } from "@/lib/actions/cash-sessions";
import { formatCLP, formatDateTime } from "@/lib/format";
import { CloseSessionForm } from "./close-form";

export const dynamic = "force-dynamic";

export default async function CerrarCajaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = await getCashSessionSummary(id);
  if (!summary) notFound();
  if (summary.status === "CLOSED") {
    redirect(`/cierre-caja/${id}`);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/cierre-caja">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" />
          Cerrar caja
        </h1>
        <p className="text-muted-foreground">
          Confirma el cierre del turno actual
        </p>
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Resumen del turno</CardTitle>
          <CardDescription>
            Abierta el {formatDateTime(summary.openedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Efectivo inicial</p>
              <p className="text-2xl font-bold">{formatCLP(summary.openAmount)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Ventas totales</p>
              <p className="text-2xl font-bold text-green-600">{formatCLP(summary.totalSales)}</p>
              <p className="text-xs text-muted-foreground">{summary.sales.length} ventas</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Por método de pago</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary.byPayment).map(([method, data]) => {
                if (data.count === 0) return null;
                return (
                  <div key={method} className="flex justify-between p-2 border border-border rounded">
                    <span className="text-sm">{method.replace("_", " ")}</span>
                    <span className="text-sm font-semibold">
                      {formatCLP(data.total)} <span className="text-muted-foreground">({data.count})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">Efectivo esperado en caja</p>
            <p className="text-3xl font-bold text-primary">{formatCLP(summary.expectedCash)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Inicial + ventas efectivo - vueltos
            </p>
          </div>
        </CardContent>
      </Card>

      <CloseSessionForm
        sessionId={id}
        expectedCash={summary.expectedCash}
      />
    </div>
  );
}
