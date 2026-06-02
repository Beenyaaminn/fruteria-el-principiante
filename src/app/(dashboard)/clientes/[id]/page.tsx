import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Phone, Mail, MapPin, CreditCard, Edit, Trash2, AlertTriangle } from "lucide-react";
import { getCustomerById } from "@/lib/actions/customers";
import { formatCLP, formatDateTime } from "@/lib/format";
import { PaymentForm } from "./payment-form";
import { CustomerActions } from "./customer-actions";

export const dynamic = "force-dynamic";

const paymentLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  CREDITO_CLIENTE: "Crédito",
  MIXTO: "Mixto",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const isOverLimit = customer.creditLimit && customer.balance > (customer.creditLimit || 0);
  const percentUsed = customer.creditLimit
    ? Math.min(100, (customer.balance / customer.creditLimit) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/clientes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              {customer.name}
            </h1>
            {customer.notes && (
              <p className="text-muted-foreground mt-1">{customer.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/clientes/${customer.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <CustomerActions customerId={customer.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{customer.address}</span>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.address && (
              <p className="text-muted-foreground text-xs">Sin datos de contacto</p>
            )}
          </CardContent>
        </Card>

        {/* Crédito */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Línea de crédito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite</span>
              <span className="font-semibold">
                {customer.creditLimit ? formatCLP(customer.creditLimit) : "Sin límite"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Días</span>
              <span>{customer.creditDays || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Deuda actual</span>
              <span className={isOverLimit ? "text-destructive" : "text-primary"}>
                {formatCLP(customer.balance)}
              </span>
            </div>
            {customer.creditLimit && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Usado</span>
                  <span>{percentUsed.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOverLimit ? "bg-destructive" : percentUsed > 80 ? "bg-orange-500" : "bg-primary"
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>
            )}
            {isOverLimit && (
              <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                <AlertTriangle className="h-3 w-3" />
                Sobre el límite
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrar pago */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar abono</CardTitle>
            <CardDescription>Reduce la deuda del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm customerId={customer.id} currentBalance={customer.balance} />
          </CardContent>
        </Card>
      </div>

      {/* Ventas y pagos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas ({customer.sales.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customer.sales.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Sin ventas</p>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {customer.sales.map((s) => (
                  <div key={s.id} className="p-3 hover:bg-muted/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          #{s.ticketNumber.toString().padStart(6, "0")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(s.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCLP(s.total)}</p>
                        <Badge variant="outline" className="text-xs">
                          {paymentLabels[s.paymentMethod] || s.paymentMethod}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abonos ({customer.payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customer.payments.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Sin abonos registrados</p>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {customer.payments.map((p) => (
                  <div key={p.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-green-600">
                          -{formatCLP(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(p.createdAt)} · {p.user.name}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
