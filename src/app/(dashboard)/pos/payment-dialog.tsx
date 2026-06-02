"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, CreditCard, Smartphone, AlertCircle, Loader2, User } from "lucide-react";
import { formatCLP } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaymentMethod = "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA" | "CREDITO_CLIENTE";

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
  color: string;
  needsCustomer?: boolean;
}[] = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote, color: "text-green-600" },
  { id: "DEBITO", label: "Débito", icon: CreditCard, color: "text-blue-600" },
  { id: "CREDITO", label: "Crédito", icon: CreditCard, color: "text-purple-600" },
  { id: "TRANSFERENCIA", label: "Transferencia", icon: Smartphone, color: "text-orange-600" },
  { id: "CREDITO_CLIENTE", label: "A crédito", icon: User, color: "text-pink-600", needsCustomer: true },
];

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isSubmitting,
  requireCustomer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (method: PaymentMethod, cashReceived?: number, cashChange?: number) => void;
  isSubmitting: boolean;
  requireCustomer?: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
  const [cashReceived, setCashReceived] = useState("");

  useEffect(() => {
    if (open) {
      setMethod("EFECTIVO");
      setCashReceived("");
    }
  }, [open]);

  const cashNumber = parseInt(cashReceived) || 0;
  const change = method === "EFECTIVO" ? Math.max(0, cashNumber - total) : 0;
  const cashShort = method === "EFECTIVO" && cashNumber < total;
  const canConfirm =
    total > 0 &&
    (method !== "EFECTIVO" || cashNumber >= total) &&
    (!requireCustomer || method !== "CREDITO_CLIENTE" ? true : !requireCustomer);

  const quickAmounts = total > 0
    ? [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
        .filter((v, i, arr) => arr.indexOf(v) === i)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar pago</DialogTitle>
          <DialogDescription>Selecciona el método de pago y confirma la venta</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total a cobrar</p>
            <p className="text-4xl font-bold text-primary mt-1">{formatCLP(total)}</p>
          </div>

          {requireCustomer && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Para venta a crédito, primero asigna un cliente al carrito (icono de usuario arriba).
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="mb-2 block">Método de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                const selected = method === pm.id;
                const disabled = pm.needsCustomer && requireCustomer;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => !disabled && setMethod(pm.id)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", pm.color)} />
                    <span className="font-medium text-sm">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {method === "EFECTIVO" && (
            <div className="space-y-2">
              <Label htmlFor="cash">Efectivo recibido</Label>
              <Input
                id="cash"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="h-12 text-lg"
                autoFocus
              />
              {quickAmounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCashReceived(amount.toString())}
                    >
                      {formatCLP(amount)}
                    </Button>
                  ))}
                </div>
              )}
              {cashNumber > 0 && (
                <div className={cn(
                  "rounded-lg p-3 text-center font-semibold",
                  change > 0 ? "bg-green-500/10 text-green-700" : cashShort ? "bg-destructive/10 text-destructive" : "bg-muted"
                )}>
                  {change > 0 ? (
                    <>
                      <p className="text-xs uppercase tracking-wider opacity-70">Vuelto</p>
                      <p className="text-2xl">{formatCLP(change)}</p>
                    </>
                  ) : cashShort ? (
                    <p className="text-sm">Faltan {formatCLP(total - cashNumber)}</p>
                  ) : (
                    <p className="text-sm">Pago exacto</p>
                  )}
                </div>
              )}
            </div>
          )}

          {method === "CREDITO_CLIENTE" && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Se registrará como deuda del cliente. Podrás registrar abonos desde la página del cliente.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm(
                method,
                method === "EFECTIVO" ? cashNumber : total,
                method === "EFECTIVO" ? change : 0
              )
            }
            disabled={!canConfirm || isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
            ) : (
              <>Confirmar {total > 0 && formatCLP(total)}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
