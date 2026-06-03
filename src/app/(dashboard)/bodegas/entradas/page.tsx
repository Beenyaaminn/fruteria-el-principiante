import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { getWarehouses } from "@/lib/actions/warehouses";
import { getProducts } from "@/lib/actions/products";
import { EntryForm } from "./entry-form";

export const dynamic = "force-dynamic";

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>;
}) {
  const [warehouses, products] = await Promise.all([
    getWarehouses(),
    getProducts(),
  ]);
  const params = await searchParams;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/bodegas">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a bodegas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Plus className="h-7 w-7 text-primary" />
          Recepción de mercadería
        </h1>
        <p className="text-muted-foreground">
          {params.producto
            ? `Agregando stock para: ${params.producto}`
            : "Registra entradas de productos al inventario (compras, devoluciones)"}
        </p>
      </div>
      <EntryForm
        preselectedProduct={params.producto || undefined}
        warehouses={warehouses}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          priceCost: p.priceCost,
          unit: p.unit,
          totalStock: p.totalStock,
        }))}
      />
    </div>
  );
}
