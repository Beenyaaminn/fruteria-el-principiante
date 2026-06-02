"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ban, AlertCircle, Loader2 } from "lucide-react";
import { cancelSale } from "@/lib/actions/sales";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!reason.trim()) {
      toast.error("Debes ingresar un motivo");
      return;
    }
    setSubmitting(true);
    try {
      await cancelSale(saleId, reason);
      toast.success("Venta anulada y stock devuelto");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al anular");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Ban className="mr-2 h-4 w-4" />
          Anular
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular venta</DialogTitle>
          <DialogDescription>
            Se devolverá el stock al inventario. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Solo administradores y supervisores pueden anular ventas.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo de anulación</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Error en la venta, cliente se arrepintió..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={submitting || !reason.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar anulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
