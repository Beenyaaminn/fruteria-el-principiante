"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Loader2, Save, AlertCircle, Search } from "lucide-react";
import { createStockEntry } from "@/lib/actions/warehouses";
import { toast } from "sonner";

type Warehouse = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  sku?: string | null;
  priceCost: number;
  unit: string;
  totalStock: number;
};

type EntryItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
};

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

export function EntryForm({
  warehouses,
  products,
  preselectedProduct,
}: {
  warehouses: Warehouse[];
  products: Product[];
  preselectedProduct?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EntryItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Preseleccionar producto si viene por query param
  useEffect(() => {
    if (preselectedProduct) {
      const product = products.find(
        (p) =>
          p.name.toLowerCase() === preselectedProduct.toLowerCase() ||
          p.sku?.toLowerCase() === preselectedProduct.toLowerCase()
      );
      if (product) addProduct(product);
    }
  }, [preselectedProduct, products]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  function addProduct(product: Product) {
    if (items.find((i) => i.productId === product.id)) {
      toast.error("Producto ya agregado");
      return;
    }
    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.priceCost,
      },
    ]);
    setProductSearch("");
  }

  function updateItem(idx: number, field: keyof EntryItem, value: any) {
    setItems((arr) =>
      arr.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId) {
      setError("Selecciona una bodega");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStockEntry({
        warehouseId,
        notes: notes || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      });
      toast.success("Recepción registrada correctamente");
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
          <CardTitle className="text-base">Datos de la recepción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Bodega de destino *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Notas / Observaciones</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: Compra a proveedor X, factura #123"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Productos ({items.length})</span>
            <span className="text-base font-bold text-primary">
              Total: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(total)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Buscador de productos */}
          <div className="space-y-2">
            <Label>Agregar producto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-10"
              />
            </div>
            {productSearch && (
              <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                {filteredProducts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left p-2 hover:bg-muted flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock actual: {p.totalStock} {unitLabels[p.unit] || p.unit}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground text-center">
                    No se encontraron productos
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lista de items */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-md">
              Busca y agrega productos arriba
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center gap-2 p-3 border border-border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock actual: {product?.totalStock || 0} {unitLabels[product?.unit || "UNIDAD"] || product?.unit}
                      </p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitCost}
                        onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                        className="h-8"
                        placeholder="Costo"
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-semibold">
                      {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(item.quantity * item.unitCost)}
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeItem(idx)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/bodegas">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting || items.length === 0}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Registrar recepción
        </Button>
      </div>
    </form>
  );
}
