"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { closeCashSession } from "@/lib/actions/cash-sessions";
import { toast } from "sonner";
import { formatCLP } from "@/lib/format";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CloseSessionForm({
  sessionId,
  expectedCash,
}: {
  sessionId: string;
  expectedCash: number;
}) {
  const router = useRouter();
  const [closeAmount, setCloseAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeNumber = parseFloat(closeAmount) || 0;
  const diff = closeNumber - expectedCash;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isNaN(closeNumber) || closeNumber < 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      await closeCashSession({
        sessionId,
        closeAmount: closeNumber,
        notes: notes || null,
      });
      toast.success("Caja cerrada");
      router.push("/cierre-caja");
    } catch (err: any) {
      setError(err.message || "Error al cerrar");
      toast.error(err.message || "Error al cerrar");
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
          <CardTitle className="text-base">Conteo final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Efectivo contado en caja</Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                value={closeAmount}
                onChange={(e) => setCloseAmount(e.target.value)}
                placeholder="0"
                className="pl-10 h-12 text-lg"
                autoFocus
                required
              />
            </div>
          </div>

          {closeNumber > 0 && (
            <div
              className={cn(
                "rounded-lg p-3 text-center",
                diff === 0 && "bg-green-500/10 border border-green-500/20",
                diff > 0 && "bg-blue-500/10 border border-blue-500/20",
                diff < 0 && "bg-destructive/10 border border-destructive/20"
              )}
            >
              {diff === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-sm font-medium text-green-700">Cuadre exacto</p>
                </>
              ) : diff > 0 ? (
                <>
                  <p className="text-xs text-blue-700">Sobrante en caja</p>
                  <p className="text-2xl font-bold text-blue-700">+{formatCLP(diff)}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-destructive">Faltante en caja</p>
                  <p className="text-2xl font-bold text-destructive">{formatCLP(diff)}</p>
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas / Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: Turno tranquilo, sin novedades"
            />
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
          Confirmar cierre
        </Button>
      </div>
    </form>
  );
}
