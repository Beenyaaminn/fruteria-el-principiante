import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { getPurchaseById } from "@/lib/actions/suppliers";
import { formatCLP, formatDateTime } from "@/lib/format";
import { PurchaseActions } from "./purchase-actions";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente de recibir", className: "bg-orange-500/10 text-orange-700" },
  RECEIVED: { label: "Recibida", className: "bg-green-500/10 text-green-700" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

const unitLabels: Record<string, string> = {
  UNIDAD: "un", KILO: "kg", GRAMO: "g", LITRO: "L",
  PACK: "pack", CAJA: "cja", MANOJO: "manojo", MALLA: "malla",
};

export default async function CompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await getPurchaseById(id);
  if (!purchase) notFound();

  const status = statusLabels[purchase.status] || statusLabels.PENDING;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/compras">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              OC #{purchase.id.slice(0, 8).toUpperCase()}
              <Badge className={status.className}>{status.label}</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">{formatDateTime(purchase.createdAt)}</p>
          </div>
          {purchase.status === "PENDING" && (
            <PurchaseActions purchaseId={purchase.id} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Truck className="h-4 w-4" />
              {purchase.supplier.name}
            </div>
            {purchase.supplier.contactName && <p className="text-muted-foreground">{purchase.supplier.contactName}</p>}
            {purchase.supplier.phone && <p className="text-muted-foreground text-xs">{purchase.supplier.phone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" />
              {purchase.warehouse.name}
            </div>
            {purchase.warehouse.location && <p className="text-muted-foreground text-xs">{purchase.warehouse.location}</p>}
            <p className="text-muted-foreground text-xs">Usuario: {purchase.user.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{formatCLP(purchase.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {purchase.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {unitLabels[item.product.unit] || item.product.unit} × {formatCLP(item.unitCost)}
                  </p>
                </div>
                <p className="font-semibold">{formatCLP(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Notas</p>
            <p>{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
