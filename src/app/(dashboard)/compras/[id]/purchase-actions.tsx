"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, Truck } from "lucide-react";
import { receivePurchase, cancelPurchase } from "@/lib/actions/suppliers";
import { toast } from "sonner";

export function PurchaseActions({ purchaseId }: { purchaseId: string }) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleReceive() {
    setSubmitting(true);
    try {
      await receivePurchase(purchaseId);
      toast.success("Mercadería recibida en bodega");
      setReceiveOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setSubmitting(true);
    try {
      await cancelPurchase(purchaseId);
      toast.success("Orden cancelada");
      setCancelOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setReceiveOpen(true)}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Recibir mercadería
        </Button>
        <Button variant="outline" onClick={() => setCancelOpen(true)}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Recibir mercadería?</DialogTitle>
            <DialogDescription>
              Se sumará el stock a la bodega y se actualizarán los precios de costo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleReceive} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar orden?</DialogTitle>
            <DialogDescription>
              La orden se marcará como cancelada. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={submitting}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
