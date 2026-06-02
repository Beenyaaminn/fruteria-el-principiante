"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, Loader2, Save, AlertCircle } from "lucide-react";
import { openCashSession } from "@/lib/actions/cash-sessions";
import { toast } from "sonner";
import { formatCLP } from "@/lib/format";

export function OpenSessionForm() {
  const router = useRouter();
  const [openAmount, setOpenAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAmounts = [0, 5000, 10000, 20000, 50000, 100000];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(openAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      await openCashSession({ openAmount: amount });
      toast.success("Caja abierta");
      router.push("/cierre-caja");
    } catch (err: any) {
      setError(err.message || "Error al abrir caja");
      toast.error(err.message || "Error al abrir caja");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monto inicial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Efectivo en caja al inicio</Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                value={openAmount}
                onChange={(e) => setOpenAmount(e.target.value)}
                placeholder="0"
                className="pl-10 h-12 text-lg"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Montos rápidos</p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenAmount(amt.toString())}
                >
                  {amt === 0 ? "Sin efectivo" : formatCLP(amt)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button asChild variant="outline" type="button">
          <Link href="/cierre-caja">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Abrir caja
        </Button>
      </div>
    </form>
  );
}
