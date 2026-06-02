import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { getWarehouses } from "@/lib/actions/warehouses";
import { getProducts } from "@/lib/actions/products";
import { TransferForm } from "./transfer-form";

export const dynamic = "force-dynamic";

export default async function TraspasosPage() {
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
          <ArrowRightLeft className="h-7 w-7 text-primary" />
          Traspaso entre bodegas
        </h1>
        <p className="text-muted-foreground">
          Mueve stock de una bodega a otra
        </p>
      </div>
      {warehouses.length < 2 ? (
        <div className="text-center py-12 text-muted-foreground">
          Necesitas al menos 2 bodegas para hacer traspasos
        </div>
      ) : (
        <TransferForm
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
      )}
    </div>
  );
}
