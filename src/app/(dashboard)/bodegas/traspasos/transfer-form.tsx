"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, Loader2, Save, AlertCircle, Search, ArrowRight } from "lucide-react";
import { createStockTransfer } from "@/lib/actions/warehouses";
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

export function TransferForm({
  warehouses,
  products,
}: {
  warehouses: Warehouse[];
  products: Product[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState(warehouses[0]?.id || "");
  const [toId, setToId] = useState(warehouses[1]?.id || "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );
  const stockInFrom = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.stocks.find((s) => s.warehouseId === fromId)?.quantity || 0;
  }, [selectedProduct, fromId]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fromId === toId) {
      setError("Las bodegas de origen y destino deben ser diferentes");
      return;
    }
    if (!productId) {
      setError("Selecciona un producto");
      return;
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    if (quantity > stockInFrom) {
      setError(`Stock insuficiente en bodega origen. Disponible: ${stockInFrom}`);
      return;
    }
    setSubmitting(true);
    try {
      await createStockTransfer({
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        productId,
        quantity,
        notes: notes || null,
      });
      toast.success("Traspaso realizado correctamente");
      router.push("/bodegas");
    } catch (err: any) {
      setError(err.message || "Error al traspasar");
      toast.error(err.message || "Error al traspasar");
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
          <CardTitle className="text-base">Origen y destino</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 space-y-1.5 w-full">
              <Label>Bodega origen</Label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div className="flex-1 space-y-1.5 w-full">
              <Label>Bodega destino</Label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Producto a traspasar</CardTitle>
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
                    const stock = p.stocks.find((s) => s.warehouseId === fromId)?.quantity || 0;
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
                          <p className="text-xs text-muted-foreground">
                            Stock en origen: {stock}
                          </p>
                        </div>
                        {stock > 0 && <ArrowRightLeft className="h-4 w-4 text-primary" />}
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
                    Stock disponible en origen:{" "}
                    <span className="font-semibold text-primary">
                      {stockInFrom}
                    </span>
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
                <Label htmlFor="quantity">Cantidad a traspasar</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  max={stockInFrom}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Motivo del traspaso..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/bodegas">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={submitting || !productId || quantity <= 0}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Realizar traspaso
        </Button>
      </div>
    </form>
  );
}
