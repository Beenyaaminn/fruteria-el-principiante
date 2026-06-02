import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, Printer, Ban } from "lucide-react";
import { getSaleById, getStoreConfig } from "@/lib/actions/sales";
import { formatCLP, formatDateTime } from "@/lib/format";
import { CancelSaleButton } from "./cancel-button";

const paymentLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  CREDITO_CLIENTE: "Crédito cliente",
  MIXTO: "Mixto",
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

export default async function VentaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sale, config] = await Promise.all([
    getSaleById(id),
    getStoreConfig(),
  ]);

  if (!sale) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link href="/ventas">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Venta #{sale.ticketNumber.toString().padStart(6, "0")}
            <Badge
              variant="outline"
              className={
                sale.status === "COMPLETED"
                  ? "bg-green-500/10 text-green-700"
                  : sale.status === "CANCELLED"
                    ? "bg-destructive/10 text-destructive"
                    : ""
              }
            >
              {sale.status === "COMPLETED" ? "Completada" : sale.status === "CANCELLED" ? "Anulada" : sale.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground">{formatDateTime(sale.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/ticket/${sale.ticketNumber}`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir ticket
            </Link>
          </Button>
          {sale.status === "COMPLETED" && (
            <CancelSaleButton saleId={sale.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info de la venta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cajero</span>
              <span className="font-medium">{sale.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">
                {sale.customer?.name || sale.customerName || "Público general"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método de pago</span>
              <span className="font-medium">
                {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
              </span>
            </div>
            {sale.cashReceived != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Efectivo recibido</span>
                <span className="font-medium">{formatCLP(sale.cashReceived)}</span>
              </div>
            )}
            {sale.cashChange != null && sale.cashChange > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vuelto</span>
                <span className="font-medium text-green-600">
                  {formatCLP(sale.cashChange)}
                </span>
              </div>
            )}
            {sale.notes && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Notas</p>
                <p>{sale.notes}</p>
              </div>
            )}
            {sale.cancelReason && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Motivo anulación</p>
                <p className="text-destructive">{sale.cancelReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Productos ({sale.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {unitLabels[item.product.unit] || item.product.unit} × {formatCLP(item.unitPrice)}
                    {item.discount > 0 && ` (-${formatCLP(item.discount)})`}
                  </p>
                </div>
                <p className="font-semibold">{formatCLP(item.subtotal)}</p>
              </div>
            ))}
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCLP(sale.subtotal)}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-destructive">-{formatCLP(sale.discountTotal)}</span>
                </div>
              )}
              {sale.taxTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCLP(sale.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>TOTAL</span>
                <span className="text-primary">{formatCLP(sale.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
