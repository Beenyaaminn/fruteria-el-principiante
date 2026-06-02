"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Loader2, AlertCircle } from "lucide-react";
import { registerCustomerPayment } from "@/lib/actions/customers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCLP } from "@/lib/format";

export function PaymentForm({
  customerId,
  currentBalance,
}: {
  customerId: string;
  currentBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Monto inválido");
      return;
    }
    if (numAmount > currentBalance) {
      setError(`El monto no puede ser mayor a la deuda (${formatCLP(currentBalance)})`);
      return;
    }
    setSubmitting(true);
    try {
      await registerCustomerPayment({
        customerId,
        amount: numAmount,
        notes: notes || null,
        saleId: null,
      });
      toast.success("Abono registrado");
      setAmount("");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Monto del abono</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="any"
            max={currentBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Opcional"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrar abono
      </Button>
    </form>
  );
}
