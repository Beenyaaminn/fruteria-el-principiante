"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Pencil } from "lucide-react";
import { createStockAdjustment } from "@/lib/actions/warehouses";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";

export function StockAdjustForm({
  productId,
  warehouseId,
  warehouseName,
  currentStock,
}: {
  productId: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
}) {
  const [open, setOpen] = useState(false);
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("Ajuste de inventario");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty < 0) {
      setError("Ingresa una cantidad válida");
      return;
    }
    if (!reason.trim()) {
      setError("Indica el motivo");
      return;
    }
    setSubmitting(true);
    try {
      await createStockAdjustment({
        productId,
        warehouseId,
        newQuantity: qty,
        reason: reason.trim(),
      });
      toast.success(`Stock ajustado a ${formatNumber(qty, 2)} en ${warehouseName}`);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al ajustar");
      toast.error(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md h-7 px-2 text-xs font-medium border border-input bg-background hover:bg-muted transition-colors">
        <Pencil className="mr-1 h-3 w-3" />
        Ajustar
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              {warehouseName} — Actual: {formatNumber(currentStock, 2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="newQty">Nuevo stock</Label>
              <Input
                id="newQty"
                type="number"
                min="0"
                step="any"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="0"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Actual: {formatNumber(currentStock, 2)} →
                {newQty && !isNaN(parseFloat(newQty))
                  ? ` ${formatNumber(parseFloat(newQty), 2)} (${parseFloat(newQty) > currentStock ? "+" : ""}${formatNumber(parseFloat(newQty) - currentStock, 2)})`
                  : ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !newQty}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
