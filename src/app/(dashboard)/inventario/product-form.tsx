"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { toast } from "sonner";

type ProductFormData = {
  id?: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  unit: "UNIDAD" | "KILO" | "GRAMO" | "LITRO" | "PACK" | "CAJA" | "MANOJO" | "MALLA";
  priceCost: number;
  priceSale: number;
  priceWholesale?: number;
  wholesaleMinQty?: number;
  taxRate: number;
  minStock: number;
  maxStock?: number;
};

const units = [
  { value: "UNIDAD", label: "Unidad" },
  { value: "KILO", label: "Kilogramo" },
  { value: "GRAMO", label: "Gramo" },
  { value: "LITRO", label: "Litro" },
  { value: "PACK", label: "Pack" },
  { value: "CAJA", label: "Caja" },
  { value: "MANOJO", label: "Manojo" },
  { value: "MALLA", label: "Malla" },
];

export function ProductForm({
  categories,
  initialData,
  mode,
}: {
  categories: { id: string; name: string }[];
  initialData?: ProductFormData;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductFormData>(
    initialData || {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: categories[0]?.id || "",
      unit: "UNIDAD",
      priceCost: 0,
      priceSale: 0,
      taxRate: 0,
      minStock: 0,
    }
  );

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        await createProduct(form);
        toast.success("Producto creado");
      } else {
        await updateProduct(form.id!, form);
        toast.success("Producto actualizado");
      }
      router.push("/inventario");
    } catch (err: any) {
      setError(err.message || "Error al guardar");
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button asChild variant="ghost" size="sm" type="button" className="-ml-3">
        <Link href="/inventario">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del producto *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                placeholder="Ej: Manzana Roja"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Categoría *</Label>
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unidad de medida *</Label>
              <select
                id="unit"
                value={form.unit}
                onChange={(e) => update("unit", e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                placeholder="MANZANA-ROJA"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => update("barcode", e.target.value)}
                placeholder="7801234567890"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="priceCost">Precio costo</Label>
              <Input
                id="priceCost"
                type="number"
                min="0"
                step="any"
                value={form.priceCost}
                onChange={(e) => update("priceCost", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceSale">Precio venta *</Label>
              <Input
                id="priceSale"
                type="number"
                min="0"
                step="any"
                value={form.priceSale}
                onChange={(e) => update("priceSale", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceWholesale">Precio mayoreo</Label>
              <Input
                id="priceWholesale"
                type="number"
                min="0"
                step="any"
                value={form.priceWholesale || ""}
                onChange={(e) =>
                  update("priceWholesale", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wholesaleMinQty">Cantidad mín. mayoreo</Label>
              <Input
                id="wholesaleMinQty"
                type="number"
                min="1"
                value={form.wholesaleMinQty || ""}
                onChange={(e) =>
                  update("wholesaleMinQty", e.target.value ? parseInt(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">IVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => update("taxRate", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="minStock">Stock mínimo (alerta)</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                step="any"
                value={form.minStock}
                onChange={(e) => update("minStock", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxStock">Stock máximo</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                step="any"
                value={form.maxStock || ""}
                onChange={(e) =>
                  update("maxStock", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Opcional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/inventario">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
