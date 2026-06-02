"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, Save, AlertCircle, Search } from "lucide-react";
import { createStockWaste } from "@/lib/actions/warehouses";
import { toast } from "sonner";

type Warehouse = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  totalStock: number;
  stocks: { warehouseId: string; warehouseName: string; quantity: number }[];
};

const commonReasons = [
  "Producto vencido",
  "Producto podrido",
  "Daño en transporte",
  "Daño en almacenamiento",
  "Error de inventario",
  "Devolución a proveedor",
  "Otro",
];

export function WasteForm({
  warehouses,
  products,
}: {
  warehouses: Warehouse[];
  products: Product[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState(commonReasons[0]);
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );
  const stockInWarehouse = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.stocks.find((s) => s.warehouseId === warehouseId)?.quantity || 0;
  }, [selectedProduct, warehouseId]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!productId) {
      setError("Selecciona un producto");
      return;
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    if (quantity > stockInWarehouse) {
      setError(`Stock insuficiente en bodega. Disponible: ${stockInWarehouse}`);
      return;
    }
    if (!reason.trim()) {
      setError("Indica el motivo");
      return;
    }
    setSubmitting(true);
    try {
      await createStockWaste({
        warehouseId,
        productId,
        quantity,
        reason,
      });
      toast.success("Merma registrada");
      router.push(`/bodegas/${warehouseId}`);
    } catch (err: any) {
      setError(err.message || "Error al registrar");
      toast.error(err.message || "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bodega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Bodega *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Producto y cantidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!productId ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-10"
                />
              </div>
              {search && (
                <div className="border border-border rounded-md max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 15).map((p) => {
                    const stock = p.stocks.find((s) => s.warehouseId === warehouseId)?.quantity || 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setProductId(p.id); setSearch(""); }}
                        disabled={stock <= 0}
                        className="w-full text-left p-2 hover:bg-muted flex justify-between items-center disabled:opacity-50"
                      >
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {stock}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-md">
                <div>
                  <p className="font-medium">{selectedProduct?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock en bodega:{" "}
                    <span className="font-semibold">{stockInWarehouse}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setProductId(""); setQuantity(1); }}
                >
                  Cambiar
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad a descartar</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  max={stockInWarehouse}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {commonReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`p-2 text-sm rounded-md border transition-colors text-left ${
                  reason === r
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "Otro" && (
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Especifica el motivo"
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/bodegas">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={submitting || !productId || quantity <= 0}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Trash2 className="mr-2 h-4 w-4" />
          Registrar merma
        </Button>
      </div>
    </form>
  );
}
