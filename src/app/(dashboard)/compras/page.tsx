import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Truck, Receipt, ArrowRight } from "lucide-react";
import { getPurchases } from "@/lib/actions/suppliers";
import { formatCLP, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-orange-500/10 text-orange-700" },
  RECEIVED: { label: "Recibida", className: "bg-green-500/10 text-green-700" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

export default async function ComprasPage() {
  const { purchases, total } = await getPurchases();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">Órdenes de compra a proveedores</p>
        </div>
        <Button asChild>
          <Link href="/compras/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva orden
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay órdenes de compra</p>
              <Button asChild className="mt-4">
                <Link href="/compras/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera orden
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {purchases.map((p) => {
                const status = statusLabels[p.status] || statusLabels.PENDING;
                return (
                  <Link
                    key={p.id}
                    href={`/compras/${p.id}`}
                    className="block p-4 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            OC #{p.id.slice(0, 8).toUpperCase()}
                          </p>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {p.supplier.name} · {p.warehouse.name} · {formatDateTime(p.createdAt)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-lg">{formatCLP(p.total)}</p>
                          <p className="text-xs text-muted-foreground">{p._count.items} items</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
