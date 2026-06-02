import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  History,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Eye,
  Receipt,
} from "lucide-react";
import { getCurrentCashSession, getCashSessionSummary, getCashSessionHistory } from "@/lib/actions/cash-sessions";
import { formatCLP, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const paymentLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  CREDITO_CLIENTE: "Crédito cliente",
  MIXTO: "Mixto",
};

const paymentIcons: Record<string, any> = {
  EFECTIVO: Banknote,
  DEBITO: CreditCard,
  CREDITO: CreditCard,
  TRANSFERENCIA: Smartphone,
  CREDITO_CLIENTE: Building2,
  MIXTO: CreditCard,
};

export default async function CierreCajaPage() {
  const [currentSession, history] = await Promise.all([
    getCurrentCashSession(),
    getCashSessionHistory({ page: 1, pageSize: 10 }),
  ]);

  const summary = currentSession
    ? await getCashSessionSummary(currentSession.id)
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" />
          Cierre de Caja
        </h1>
        <p className="text-muted-foreground">
          Gestiona las sesiones de caja y turnos
        </p>
      </div>

      {/* Estado actual */}
      {currentSession && summary ? (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Caja abierta
                </CardTitle>
                <CardDescription>
                  Abierta el {formatDateTime(currentSession.openedAt)}
                </CardDescription>
              </div>
              <Badge className="bg-green-500/10 text-green-700">EN TURNO</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Apertura</p>
                <p className="text-xl font-bold">{formatCLP(currentSession.openAmount)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Ventas del turno</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCLP(summary.totalSales)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentSession.sales.length} ventas
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Efectivo esperado</p>
                <p className="text-xl font-bold text-primary">
                  {formatCLP(summary.expectedCash)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Diferencia</p>
                <p className="text-xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">Al cerrar</p>
              </div>
            </div>

            {/* Desglose por método de pago */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Desglose por método de pago</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(summary.byPayment).map(([method, data]) => {
                  if (data.count === 0) return null;
                  const Icon = paymentIcons[method] || CreditCard;
                  return (
                    <div key={method} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {paymentLabels[method] || method}
                      </div>
                      <p className="text-lg font-bold mt-0.5">{formatCLP(data.total)}</p>
                      <p className="text-xs text-muted-foreground">{data.count} ventas</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href="/pos">
                  <Receipt className="mr-2 h-4 w-4" />
                  Ir al POS
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/cierre-caja/${currentSession.id}/cerrar`}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Cerrar caja
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              Caja cerrada
            </CardTitle>
            <CardDescription>
              No tienes una sesión de caja abierta. Abre una para empezar a vender.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/cierre-caja/abrir">
                <Calculator className="mr-2 h-4 w-4" />
                Abrir caja
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">Sin turnos anteriores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead className="text-right">Inicial</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Reportado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-center">Ventas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(s.openedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.closedAt ? formatDateTime(s.closedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCLP(s.openAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.expectedAmount != null ? formatCLP(s.expectedAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.closeAmount != null ? formatCLP(s.closeAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.difference != null ? (
                          <span className={s.difference < 0 ? "text-destructive" : s.difference > 0 ? "text-green-600" : ""}>
                            {s.difference > 0 ? "+" : ""}
                            {formatCLP(s.difference)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{s._count.sales}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            s.status === "OPEN"
                              ? "bg-green-500/10 text-green-700"
                              : "bg-muted"
                          }
                        >
                          {s.status === "OPEN" ? "Abierta" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.status === "CLOSED" && (
                          <Button asChild size="icon-sm" variant="ghost">
                            <Link href={`/cierre-caja/${s.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
