import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getWarehouses } from "@/lib/actions/warehouses";
import { getProducts } from "@/lib/actions/products";
import { PurchaseForm } from "./purchase-form";

export const dynamic = "force-dynamic";

export default async function NuevaCompraPage() {
  const [suppliers, warehouses, products] = await Promise.all([
    getSuppliers(),
    getWarehouses(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/compras">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-7 w-7 text-primary" />
          Nueva orden de compra
        </h1>
        <p className="text-muted-foreground">Registra una compra a proveedor para luego recibirla en bodega</p>
      </div>
      <PurchaseForm
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          priceCost: p.priceCost,
          totalStock: p.totalStock,
        }))}
      />
    </div>
  );
}
