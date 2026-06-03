"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Calculator, Banknote, Coins, Loader2, Plus, Minus, ArrowDownToLine, ArrowUpFromLine,
  Wallet, TrendingUp,
} from "lucide-react";
import { formatCLP, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCurrentCashSession, getCashSessionSummary } from "@/lib/actions/cash-sessions";
import { createCashMovement } from "@/lib/actions/cash-movements";

type Denomination = { value: number; label: string; icon: typeof Banknote };

const BILLS: Denomination[] = [
  { value: 20000, label: "$20.000", icon: Banknote },
  { value: 10000, label: "$10.000", icon: Banknote },
  { value: 5000, label: "$5.000", icon: Banknote },
  { value: 2000, label: "$2.000", icon: Banknote },
  { value: 1000, label: "$1.000", icon: Banknote },
];

const COINS: Denomination[] = [
  { value: 500, label: "$500", icon: Coins },
  { value: 100, label: "$100", icon: Coins },
  { value: 50, label: "$50", icon: Coins },
  { value: 10, label: "$10", icon: Coins },
];

export function CorteTab() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openAmount, setOpenAmount] = useState(0);
  const [expectedCash, setExpectedCash] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [byPayment, setByPayment] = useState<Record<string, { count: number; total: number }>>({});
  const [openedAt, setOpenedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [cashMoveOpen, setCashMoveOpen] = useState(false);
  const [cashMoveType, setCashMoveType] = useState<"IN" | "OUT">("IN");
  const [cashMoveAmount, setCashMoveAmount] = useState("");
  const [cashMoveReason, setCashMoveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const session = await getCurrentCashSession();
      if (!session) {
        setSessionId(null);
        setLoading(false);
        return;
      }
      const summary = await getCashSessionSummary(session.id);
      setSessionId(session.id);
      setOpenAmount(session.openAmount);
      setOpenedAt(session.openedAt instanceof Date ? session.openedAt.toISOString() : String(session.openedAt));
      setExpectedCash(summary?.expectedCash ?? 0);
      setTotalSales(summary?.totalSales ?? 0);
      setSalesCount(session.sales?.length ?? 0);
      setByPayment(summary?.byPayment ?? {});
    } catch (err: any) {
      toast.error("Error al cargar caja");
    } finally {
      setLoading(false);
    }
  }

  function updateCount(value: number, cantidad: string) {
    setCounts((prev) => ({ ...prev, [value]: cantidad }));
  }

  function getCount(value: number): number {
    return parseInt(counts[value] || "0") || 0;
  }

  const billsTotal = BILLS.reduce((sum, b) => sum + b.value * getCount(b.value), 0);
  const coinsTotal = COINS.reduce((sum, c) => sum + c.value * getCount(c.value), 0);
  const countedTotal = billsTotal + coinsTotal;
  const difference = countedTotal - expectedCash;

  async function handleCashMovement() {
    const amount = parseInt(cashMoveAmount);
    if (!amount || amount <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!sessionId) { toast.error("No hay sesión de caja abierta"); return; }
    setSubmitting(true);
    try {
      await createCashMovement({ cashSessionId: sessionId, type: cashMoveType, amount, reason: cashMoveReason || null });
      toast.success(`${cashMoveType === "IN" ? "Entrada" : "Salida"} registrada`);
      setCashMoveOpen(false); setCashMoveAmount(""); setCashMoveReason("");
      loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-6"><svg className="h-16 w-16 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
        <h2 className="text-xl font-bold">Caja cerrada</h2>
        <p className="text-sm max-w-sm">Abre la caja desde la pestaña de Cierre de Caja o desde el Dashboard para empezar el turno.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Corte de caja
          </h2>
          <p className="text-xs text-muted-foreground">Turno abierto: {formatDateTime(openedAt)}</p>
        </div>
        <Badge className="bg-green-500/10 text-green-700">CAJA ABIERTA</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Apertura</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold">{formatCLP(openAmount)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Ventas</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold">{formatCLP(totalSales)}</p><p className="text-xs text-muted-foreground">{salesCount} ventas</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Efectivo esperado</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-primary">{formatCLP(expectedCash)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Contado</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className={cn("text-lg font-bold", countedTotal > 0 ? (difference >= 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground")}>{countedTotal > 0 ? formatCLP(countedTotal) : "—"}</p></CardContent></Card>
      </div>

      {/* Ventas por método de pago */}
      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ventas del turno ({salesCount})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { method: "EFECTIVO", label: "Efectivo", color: "text-green-600" },
            { method: "DEBITO", label: "Débito", color: "text-blue-600" },
            { method: "CREDITO", label: "Crédito", color: "text-purple-600" },
            { method: "TRANSFERENCIA", label: "Transferencia", color: "text-orange-600" },
            { method: "CREDITO_CLIENTE", label: "Crédito cliente", color: "text-pink-600" },
            { method: "MIXTO", label: "Mixto", color: "text-muted-foreground" },
          ].map((pm) => {
            const data = byPayment[pm.method];
            const total = data?.total || 0;
            const count = data?.count || 0;
            if (count === 0) return null;
            return (
              <div key={pm.method} className="flex items-center justify-between text-sm">
                <span className={pm.color}>{pm.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{count} ventas</span>
                  <span className="font-semibold">{formatCLP(total)}</span>
                </div>
              </div>
            );
          })}
          <Separator />
          <div className="flex justify-between text-sm font-bold">
            <span>Total ventas</span>
            <span className="text-primary">{formatCLP(totalSales)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Efectivo esperado en caja</span>
            <span className="font-semibold">{formatCLP(expectedCash)}</span>
          </div>
        </CardContent>
      </Card>

      {countedTotal > 0 && (
        <Card className={cn("shadow-none", difference === 0 ? "border-green-500/30 bg-green-500/5" : difference > 0 ? "border-blue-500/30 bg-blue-500/5" : "border-red-500/30 bg-red-500/5")}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-semibold">
              {difference === 0 ? "Cuadre perfecto" : difference > 0 ? `Sobrante: ${formatCLP(difference)}` : `Faltante: ${formatCLP(Math.abs(difference))}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conteo por denominación */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Banknote className="h-4 w-4" />Billetes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {BILLS.map((b) => {
            const qty = getCount(b.value);
            const total = b.value * qty;
            return (
              <div key={b.value} className="border border-border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{b.label}</span>
                  <span className="text-[10px] text-muted-foreground">x</span>
                </div>
                <Input type="number" min="0" placeholder="0" value={counts[b.value] || ""} onChange={(e) => updateCount(b.value, e.target.value)} className="h-7 text-sm" />
                {qty > 0 && <p className="text-[10px] text-muted-foreground text-right">{formatCLP(total)}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Coins className="h-4 w-4" />Monedas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COINS.map((c) => {
            const qty = getCount(c.value);
            const total = c.value * qty;
            return (
              <div key={c.value} className="border border-border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">x</span>
                </div>
                <Input type="number" min="0" placeholder="0" value={counts[c.value] || ""} onChange={(e) => updateCount(c.value, e.target.value)} className="h-7 text-sm" />
                {qty > 0 && <p className="text-[10px] text-muted-foreground text-right">{formatCLP(total)}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Totales del conteo */}
      {countedTotal > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Total billetes</span><span className="font-semibold">{formatCLP(billsTotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Total monedas</span><span className="font-semibold">{formatCLP(coinsTotal)}</span></div>
          <Separator />
          <div className="flex justify-between text-base font-bold"><span>Total contado</span><span className="text-primary">{formatCLP(countedTotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Efectivo esperado</span><span>{formatCLP(expectedCash)}</span></div>
          <div className={cn("flex justify-between text-sm font-semibold", difference === 0 ? "text-green-600" : difference > 0 ? "text-blue-600" : "text-red-600")}>
            <span>Diferencia</span><span>{difference > 0 ? "+" : ""}{formatCLP(difference)}</span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => { setCashMoveType("IN"); setCashMoveOpen(true); }}>
          <ArrowDownToLine className="h-3.5 w-3.5 mr-1 text-green-600" /> Entrada
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setCashMoveType("OUT"); setCashMoveOpen(true); }}>
          <ArrowUpFromLine className="h-3.5 w-3.5 mr-1 text-red-600" /> Salida
        </Button>
      </div>

      {/* Cash movement dialog */}
      <Dialog open={cashMoveOpen} onOpenChange={setCashMoveOpen}>
        <DialogContent className="sm:max-w-sm"><DialogHeader>
          <DialogTitle>{cashMoveType === "IN" ? "Entrada de dinero" : "Salida de dinero"}</DialogTitle>
          <DialogDescription>{cashMoveType === "IN" ? "Dinero que ingresa a la caja" : "Dinero que sale de la caja"}</DialogDescription>
        </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Monto</Label><Input type="number" min="1" value={cashMoveAmount} onChange={(e) => setCashMoveAmount(e.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label>Motivo (opcional)</Label><Input value={cashMoveReason} onChange={(e) => setCashMoveReason(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCashMoveOpen(false)} disabled={submitting}>Cancelar</Button><Button onClick={handleCashMovement} disabled={submitting} className={cashMoveType === "IN" ? "bg-green-600" : "bg-red-600"}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{cashMoveType === "IN" ? "Registrar entrada" : "Registrar salida"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
