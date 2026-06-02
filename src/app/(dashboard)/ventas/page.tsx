import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Eye, Calendar, Filter, X, RotateCcw } from "lucide-react";
import { getSales } from "@/lib/actions/sales";
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

const statusLabels: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "Completada", className: "bg-green-500/10 text-green-700" },
  CANCELLED: { label: "Anulada", className: "bg-destructive/10 text-destructive" },
  PENDING: { label: "Pendiente", className: "bg-orange-500/10 text-orange-700" },
};

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; method?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const filters = {
    page,
    pageSize: 20,
    status: params.status,
    paymentMethod: params.method,
    startDate: params.from ? new Date(params.from) : undefined,
    endDate: params.to ? new Date(params.to + "T23:59:59") : undefined,
  };

  const { sales, total, totalPages } = await getSales(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Historial de ventas y reimpresión de tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/pos">
              <Receipt className="mr-2 h-4 w-4" />
              Nueva venta
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Desde</label>
              <input
                type="date"
                name="from"
                defaultValue={params.from}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Hasta</label>
              <input
                type="date"
                name="to"
                defaultValue={params.to}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Estado</label>
              <select
                name="status"
                defaultValue={params.status || ""}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Todos</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Anulada</option>
              </select>
            </div>
            <Button type="submit" size="sm">
              Aplicar
            </Button>
            {(params.from || params.to || params.status) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/ventas">
                  <X className="mr-1 h-3 w-3" />
                  Limpiar
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {total} ventas encontradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay ventas registradas</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/pos">Hacer primera venta</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ticket</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const status = statusLabels[sale.status] || statusLabels.COMPLETED;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium">
                          #{sale.ticketNumber.toString().padStart(6, "0")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(sale.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.user.name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.customer?.name || sale.customerName || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{sale._count.items}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCLP(sale.total)}
                        </TableCell>
                        <TableCell>
                          <Button asChild size="icon-sm" variant="ghost">
                            <Link href={`/ventas/${sale.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              asChild
              variant={p === page ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={{
                  pathname: "/ventas",
                  query: { ...params, page: p.toString() },
                }}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
