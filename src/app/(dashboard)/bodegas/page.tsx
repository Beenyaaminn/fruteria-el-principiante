import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRightLeft,
  Trash2,
  History,
  Eye,
  DollarSign,
  Boxes,
} from "lucide-react";
import { getWarehouses } from "@/lib/actions/warehouses";
import { formatCLP, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BodegasPage() {
  const warehouses = await getWarehouses();

  const totalProducts = warehouses.reduce((sum, w) => sum + w.totalProducts, 0);
  const totalUnits = warehouses.reduce((sum, w) => sum + w.totalUnits, 0);
  const totalValue = warehouses.reduce((sum, w) => sum + w.totalValue, 0);
  const totalLowStock = warehouses.reduce((sum, w) => sum + w.lowStock, 0);
  const totalOutOfStock = warehouses.reduce((sum, w) => sum + w.outOfStock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bodegas</h1>
          <p className="text-muted-foreground">
            {warehouses.length} bodegas activas · {totalProducts} productos · {formatNumber(totalUnits, 0)} unidades
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/bodegas/movimientos">
              <History className="mr-2 h-4 w-4" />
              Movimientos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bodegas/traspasos">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Traspaso
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bodegas/entradas">
              <Plus className="mr-2 h-4 w-4" />
              Recepción
            </Link>
          </Button>
        </div>
      </div>

      {(totalLowStock > 0 || totalOutOfStock > 0) && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <p className="text-sm">
              Tienes <strong>{totalOutOfStock} productos agotados</strong> y {totalLowStock} con stock bajo entre todas las bodegas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {warehouses.map((w) => (
          <Card key={w.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <WarehouseIcon className="h-5 w-5 text-primary" />
                    {w.name}
                  </CardTitle>
                  {w.location && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {w.location}
                    </CardDescription>
                  )}
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/bodegas/${w.id}`}>
                    <Eye className="mr-1 h-3 w-3" />
                    Ver
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    Productos
                  </div>
                  <p className="text-2xl font-bold mt-0.5">{w.totalProducts}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Boxes className="h-3 w-3" />
                    Unidades
                  </div>
                  <p className="text-2xl font-bold mt-0.5">{formatNumber(w.totalUnits, 0)}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Valor a costo
                </div>
                <p className="text-xl font-bold mt-0.5">{formatCLP(w.totalValue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Venta: {formatCLP(w.totalSaleValue)}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {w.outOfStock > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {w.outOfStock} agotados
                  </Badge>
                )}
                {w.lowStock > 0 && (
                  <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 text-xs">
                    {w.lowStock} stock bajo
                  </Badge>
                )}
                {w.outOfStock === 0 && w.lowStock === 0 && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                    Todo OK
                  </Badge>
                )}
              </div>

              <div className="flex gap-1.5 pt-2 border-t">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href={`/bodegas/${w.id}`}>
                    <Package className="mr-1 h-3 w-3" />
                    Stock
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href="/bodegas/traspasos">
                    <ArrowRightLeft className="mr-1 h-3 w-3" />
                    Traspasar
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href="/bodegas/mermas">
                    <Trash2 className="mr-1 h-3 w-3" />
                    Merma
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
