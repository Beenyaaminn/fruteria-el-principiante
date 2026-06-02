"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Loader2, Save, AlertCircle, Search } from "lucide-react";
import { createPurchase } from "@/lib/actions/suppliers";
import { toast } from "sonner";
import { formatCLP } from "@/lib/format";

type Supplier = { id: string; name: string };
type Warehouse = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  priceCost: number;
  totalStock: number;
};

type PurchaseItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
};

export function PurchaseForm({
  suppliers,
  warehouses,
  products,
}: {
  suppliers: Supplier[];
  warehouses: Warehouse[];
  products: Product[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  function addProduct(p: Product) {
    if (items.find((i) => i.productId === p.id)) {
      toast.error("Producto ya agregado");
      return;
    }
    setItems([...items, {
      productId: p.id,
      productName: p.name,
      quantity: 1,
      unitCost: p.priceCost,
    }]);
    setSearch("");
  }

  function updateItem(idx: number, field: keyof PurchaseItem, value: any) {
    setItems((arr) => arr.map((i, k) => k === idx ? { ...i, [field]: value } : i));
  }

  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, k) => k !== idx));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supplierId) return setError("Selecciona un proveedor");
    if (!warehouseId) return setError("Selecciona una bodega");
    if (items.length === 0) return setError("Agrega al menos un producto");
    setSubmitting(true);
    try {
      const purchase = await createPurchase({
        supplierId,
        warehouseId,
        notes: notes || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      });
      toast.success("Orden de compra creada");
      router.push(`/compras/${purchase.id}`);
    } catch (err: any) {
      setError(err.message || "Error");
      toast.error(err.message || "Error");
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
        <CardHeader><CardTitle className="text-base">Datos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Bodega destino *</Label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ej: Factura #123, pedido para el lunes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Productos ({items.length})</span>
            <span className="text-base font-bold text-primary">Total: {formatCLP(total)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Buscar producto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" />
            </div>
            {search && (
              <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                {filtered.slice(0, 10).map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} className="w-full text-left p-2 hover:bg-muted flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Stock actual: {p.totalStock}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-md">
              Busca productos arriba
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-2 p-3 border border-border rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                  </div>
                  <div className="w-24">
                    <Input type="number" min="0.01" step="any" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="h-8" />
                  </div>
                  <div className="w-28">
                    <Input type="number" min="0" step="any" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)} className="h-8" />
                  </div>
                  <div className="w-24 text-right text-sm font-semibold">
                    {formatCLP(item.quantity * item.unitCost)}
                  </div>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeItem(idx)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/compras">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting || items.length === 0}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Crear orden
        </Button>
      </div>
    </form>
  );
}
