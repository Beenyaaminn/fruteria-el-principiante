import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getWarehouses } from "@/lib/actions/warehouses";
import { getProducts } from "@/lib/actions/products";
import { WasteForm } from "./waste-form";

export const dynamic = "force-dynamic";

export default async function MermasPage() {
  const [warehouses, products] = await Promise.all([
    getWarehouses(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/bodegas">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a bodegas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trash2 className="h-7 w-7 text-destructive" />
          Registrar merma
        </h1>
        <p className="text-muted-foreground">
          Descuenta del inventario productos perdidos, vencidos o dañados
        </p>
      </div>
      <WasteForm
        warehouses={warehouses}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          totalStock: p.totalStock,
          stocks: p.stocks,
        }))}
      />
    </div>
  );
}
