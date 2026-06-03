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
import { Plus, Search, Package, Tags, AlertTriangle, PackagePlus } from "lucide-react";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { formatCLP, formatNumber } from "@/lib/format";
import { ProductActions } from "./product-actions";

export const dynamic = "force-dynamic";

const unitLabels: Record<string, string> = {
  UNIDAD: "Unidad",
  KILO: "Kilogramo",
  GRAMO: "Gramo",
  LITRO: "Litro",
  PACK: "Pack",
  CAJA: "Caja",
  MANOJO: "Manojo",
  MALLA: "Malla",
};

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [allProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const products = allProducts.filter((p) => {
    if (params.category && p.categoryId !== params.category) return false;
    if (params.q) {
      const q = params.q.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = allProducts.filter((p) => p.totalStock <= p.minStock).length;
  const outOfStockCount = allProducts.filter((p) => p.totalStock <= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            {allProducts.length} productos · {lowStockCount} con stock bajo · {outOfStockCount} agotados
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/inventario/categorias">
              <Tags className="mr-2 h-4 w-4" />
              Categorías
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventario/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </div>

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <p className="text-sm">
              Tienes <strong>{outOfStockCount} productos agotados</strong> y {lowStockCount} con stock bajo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-64">
              <label className="text-xs font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Nombre, SKU o código de barra..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Categoría</label>
              <select
                name="category"
                defaultValue={params.category || ""}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No se encontraron productos</p>
              <Button asChild className="mt-4">
                <Link href="/inventario/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer producto
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Venta</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isLow = p.totalStock > 0 && p.totalStock <= p.minStock;
                    const isOut = p.totalStock <= 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-medium">{p.name}</p>
                          {p.barcode && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {p.barcode}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.sku || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.categoryName}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {unitLabels[p.unit] || p.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCLP(p.priceCost)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCLP(p.priceSale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              isOut
                                ? "text-destructive font-semibold"
                                : isLow
                                  ? "text-orange-600 font-semibold"
                                  : ""
                            }
                          >
                            {formatNumber(p.totalStock, 2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOut ? (
                              <Badge variant="destructive">Agotado</Badge>
                            ) : isLow ? (
                              <Badge className="bg-orange-500/10 text-orange-700">Bajo</Badge>
                            ) : (
                              <Badge className="bg-green-500/10 text-green-700">OK</Badge>
                            )}
                            {(isOut || isLow) && (
                              <Link href={`/bodegas/entradas?producto=${encodeURIComponent(p.name)}`}>
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                                  <PackagePlus className="mr-1 h-3 w-3" />
                                  Reponer
                                </Badge>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ProductActions productId={p.id} productName={p.name} />
                          </div>
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
