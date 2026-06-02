import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator, CheckCircle2 } from "lucide-react";
import { getCashSessionSummary } from "@/lib/actions/cash-sessions";
import { formatCLP, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CashSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = await getCashSessionSummary(id);
  if (!summary) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/cierre-caja">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" />
          Turno del {formatDateTime(summary.openedAt)}
          <Badge className={summary.status === "OPEN" ? "bg-green-500/10 text-green-700" : "bg-muted"}>
            {summary.status === "OPEN" ? "Abierta" : "Cerrada"}
          </Badge>
        </h1>
        {summary.user && (
          <p className="text-muted-foreground">Cajero: {summary.user.name}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Apertura</span>
              <span className="font-semibold">{formatCLP(summary.openAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cierre</span>
              <span className="font-semibold">
                {summary.closeAmount != null ? formatCLP(summary.closeAmount) : "—"}
              </span>
            </div>
            {summary.status === "CLOSED" && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esperado</span>
                  <span>{formatCLP(summary.expectedAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Diferencia</span>
                  <span
                    className={
                      (summary.difference || 0) < 0
                        ? "text-destructive"
                        : (summary.difference || 0) > 0
                          ? "text-blue-600"
                          : "text-green-600"
                    }
                  >
                    {summary.difference != null
                      ? `${summary.difference > 0 ? "+" : ""}${formatCLP(summary.difference)}`
                      : "—"}
                  </span>
                </div>
                {summary.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-xs mb-1">Notas</p>
                    <p>{summary.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por método</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(summary.byPayment).map(([method, data]) => (
              <div key={method} className="flex justify-between">
                <span className="text-muted-foreground">
                  {method.replace("_", " ")}
                </span>
                <span>
                  {data.count > 0 ? (
                    <>
                      <span className="font-semibold">{formatCLP(data.total)}</span>
                      <span className="text-muted-foreground ml-1">({data.count})</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-base font-semibold pt-1">
              <span>Total</span>
              <span className="text-primary">{formatCLP(summary.totalSales)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas del turno ({summary.sales.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {summary.sales.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Sin ventas en este turno</p>
          ) : (
            <div className="divide-y">
              {summary.sales.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-sm">#{s.ticketNumber.toString().padStart(6, "0")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(s.createdAt)} · {s.paymentMethod.replace("_", " ")}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCLP(s.total)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
