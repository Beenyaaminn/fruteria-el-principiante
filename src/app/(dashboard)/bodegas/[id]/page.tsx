import Link from "next/link";
import { notFound } from "next/navigation";
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
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  Plus,
  Search,
  Boxes,
  DollarSign,
  History,
} from "lucide-react";
import { getWarehouseById, getWarehouseStock } from "@/lib/actions/warehouses";
import { formatCLP, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const unitLabels: Record<string, string> = {
  UNIDAD: "un",
  KILO: "kg",
  GRAMO: "g",
  LITRO: "L",
  PACK: "pack",
  CAJA: "cja",
  MANOJO: "manojo",
  MALLA: "malla",
};

export default async function BodegaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; low?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [warehouse, stock] = await Promise.all([
    getWarehouseById(id),
    getWarehouseStock(id, sp.q, sp.low === "1"),
  ]);

  if (!warehouse) notFound();

  const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
  const totalValue = stock.reduce((sum, s) => sum + s.value, 0);
  const lowCount = stock.filter((s) => s.quantity > 0 && s.quantity <= s.minStock).length;
  const outCount = stock.filter((s) => s.quantity <= 0).length;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/bodegas">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a bodegas
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <WarehouseIcon className="h-7 w-7 text-primary" />
              {warehouse.name}
            </h1>
            {warehouse.location && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {warehouse.location}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/bodegas/entradas">
                <Plus className="mr-2 h-4 w-4" />
                Recibir
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/bodegas/traspasos">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Traspasar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/bodegas/mermas">
                <Trash2 className="mr-2 h-4 w-4" />
                Merma
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/bodegas/movimientos?warehouseId=${warehouse.id}`}>
                <History className="mr-2 h-4 w-4" />
                Historial
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Productos</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {stock.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unidades totales</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Boxes className="h-5 w-5 text-blue-600" />
              {formatNumber(totalUnits, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor a costo</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {formatCLP(totalValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${outCount + lowCount > 0 ? "text-orange-600" : "text-green-600"}`} />
              {outCount + lowCount}
            </CardTitle>
            <div className="flex gap-1.5 mt-1">
              {outCount > 0 && <Badge variant="destructive" className="text-xs">{outCount} agotados</Badge>}
              {lowCount > 0 && <Badge className="bg-orange-500/10 text-orange-700 text-xs">{lowCount} bajo</Badge>}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-64">
              <label className="text-xs font-medium">Buscar producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={sp.q}
                  placeholder="Nombre, SKU o código de barra..."
                  className="pl-10"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="low"
                value="1"
                defaultChecked={sp.low === "1"}
                className="h-4 w-4 rounded border-input"
              />
              Solo stock bajo
            </label>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {stock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {sp.q || sp.low ? "No hay coincidencias" : "Bodega vacía"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((s) => {
                    const isOut = s.quantity <= 0;
                    const isLow = !isOut && s.quantity <= s.minStock;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <p className="font-medium">{s.name}</p>
                          {s.barcode && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {s.barcode}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.sku || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.categoryName}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isOut ? "text-destructive font-semibold" : isLow ? "text-orange-600 font-semibold" : "font-medium"}>
                            {formatNumber(s.quantity, 2)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {unitLabels[s.unit] || s.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatNumber(s.minStock, 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCLP(s.priceCost)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCLP(s.value)}
                        </TableCell>
                        <TableCell>
                          {isOut ? (
                            <Badge variant="destructive">Agotado</Badge>
                          ) : isLow ? (
                            <Badge className="bg-orange-500/10 text-orange-700">
                              Bajo
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-700">
                              OK
                            </Badge>
                          )}
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
    </div>
  );
}
