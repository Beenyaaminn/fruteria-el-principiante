import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  History,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Edit,
  Undo2,
  Trash2,
  X,
} from "lucide-react";
import { getStockMovements, getWarehouses } from "@/lib/actions/warehouses";
import { formatDateTime, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const movementConfig: Record<string, { label: string; className: string; icon: any }> = {
  ENTRADA: {
    label: "Entrada",
    className: "bg-green-500/10 text-green-700",
    icon: TrendingUp,
  },
  SALIDA: {
    label: "Salida",
    className: "bg-blue-500/10 text-blue-700",
    icon: TrendingDown,
  },
  MERMA: {
    label: "Merma",
    className: "bg-destructive/10 text-destructive",
    icon: Trash2,
  },
  TRASPASO: {
    label: "Traspaso",
    className: "bg-purple-500/10 text-purple-700",
    icon: ArrowRightLeft,
  },
  AJUSTE: {
    label: "Ajuste",
    className: "bg-orange-500/10 text-orange-700",
    icon: Edit,
  },
  DEVOLUCION: {
    label: "Devolución",
    className: "bg-yellow-500/10 text-yellow-700",
    icon: Undo2,
  },
};

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{
    warehouseId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const [warehouses, data] = await Promise.all([
    getWarehouses(),
    getStockMovements({
      warehouseId: params.warehouseId,
      type: params.type,
      startDate: params.from ? new Date(params.from) : undefined,
      endDate: params.to ? new Date(params.to + "T23:59:59") : undefined,
      page: parseInt(params.page || "1"),
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/bodegas">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a bodegas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-7 w-7 text-primary" />
          Movimientos de stock
        </h1>
        <p className="text-muted-foreground">
          {data.total} movimientos registrados
        </p>
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
              <label className="text-xs font-medium">Bodega</label>
              <select
                name="warehouseId"
                defaultValue={params.warehouseId || ""}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Todas</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tipo</label>
              <select
                name="type"
                defaultValue={params.type || ""}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(movementConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
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
            <Button type="submit" size="sm">Aplicar</Button>
            {(params.warehouseId || params.type || params.from || params.to) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/bodegas/movimientos">
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
        <CardContent className="p-0">
          {data.movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Bodega</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movements.map((m) => {
                    const config = movementConfig[m.type] || {
                      label: m.type,
                      className: "bg-muted",
                      icon: History,
                    };
                    const Icon = config.icon;
                    const isPositive = m.quantity > 0;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.className}>
                            <Icon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{m.product.name}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.warehouse.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}
                            {formatNumber(m.quantity, 2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {m.reason || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.user.name}
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
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              asChild
              variant={p === data.page ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={{
                  pathname: "/bodegas/movimientos",
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
