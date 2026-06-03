import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductById } from "@/lib/actions/products";
import { getWarehouses } from "@/lib/actions/warehouses";
import { getCategories } from "@/lib/actions/categories";
import { getStockMovements } from "@/lib/actions/warehouses";
import { formatCLP, formatNumber, formatDateTime } from "@/lib/format";
import { ProductForm } from "../product-form";
import { StockAdjustForm } from "./stock-adjust-form";
import { Package, Warehouse, AlertTriangle } from "lucide-react";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, warehouses] = await Promise.all([
    getProductById(id),
    getCategories(),
    getWarehouses(),
  ]);

  if (!product) notFound();

  const movements = await getStockMovements({ productId: id, pageSize: 10 });

  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    categoryId: product.categoryId,
    unit: product.unit as any,
    priceCost: product.priceCost,
    priceSale: product.priceSale,
    priceWholesale: product.priceWholesale || undefined,
    wholesaleMinQty: product.wholesaleMinQty || undefined,
    taxRate: product.taxRate,
    minStock: product.minStock,
    maxStock: product.maxStock || undefined,
  };

  const unitLabels: Record<string, string> = {
    UNIDAD: "unidad", KILO: "kg", GRAMO: "g", LITRO: "L",
    PACK: "pack", CAJA: "cja", MANOJO: "manojo", MALLA: "malla",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar producto</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>

      {/* Stock actual por bodega + ajuste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Stock actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {warehouses.map((wh) => {
              const stock = product.stocks.find((s) => s.warehouseId === wh.id);
              const qty = stock?.quantity || 0;
              const isLow = qty > 0 && qty <= (product.minStock || 0);
              const isOut = qty <= 0;

              return (
                <div
                  key={wh.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{wh.name}</p>
                      <p className={`text-sm font-bold ${isOut ? "text-destructive" : isLow ? "text-orange-600" : "text-green-600"}`}>
                        {formatNumber(qty, 2)} {unitLabels[product.unit] || product.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOut && <Badge variant="destructive">Agotado</Badge>}
                    {isLow && <Badge className="bg-orange-500/10 text-orange-700">Bajo</Badge>}
                    <StockAdjustForm
                      productId={product.id}
                      warehouseId={wh.id}
                      warehouseName={wh.name}
                      currentStock={qty}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Últimos movimientos */}
          {movements.movements.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Últimos movimientos</p>
                <div className="space-y-1 text-sm">
                  {movements.movements.slice(0, 5).map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <div key={m.id} className="flex items-center justify-between text-muted-foreground">
                        <span>
                          <span className={`font-medium ${isPositive ? "text-green-600" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}{formatNumber(m.quantity, 2)}
                          </span>
                          {" "}· {m.warehouse.name} · {m.type}
                        </span>
                        <span className="text-xs">{formatDateTime(m.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProductForm categories={categories} initialData={initialData} mode="edit" />
    </div>
  );
}
