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
  Calculator, Banknote, Loader2, ArrowDownToLine, ArrowUpFromLine, Wallet,
  CreditCard, Smartphone, Receipt,
} from "lucide-react";
import { formatCLP, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDailyReport } from "@/lib/actions/corte";
import { getCurrentCashSession } from "@/lib/actions/cash-sessions";
import { createCashMovement } from "@/lib/actions/cash-movements";

const PAYMENT_METHODS = [
  { method: "EFECTIVO", label: "Efectivo", color: "text-green-600", bg: "bg-green-500/5" },
  { method: "DEBITO", label: "Débito", color: "text-blue-600", bg: "bg-blue-500/5" },
  { method: "CREDITO", label: "Crédito", color: "text-purple-600", bg: "bg-purple-500/5" },
  { method: "TRANSFERENCIA", label: "Transferencia", color: "text-orange-600", bg: "bg-orange-500/5" },
  { method: "CREDITO_CLIENTE", label: "A crédito", color: "text-pink-600", bg: "bg-pink-500/5" },
  { method: "MIXTO", label: "Mixto", color: "text-muted-foreground", bg: "bg-muted" },
];

export function CorteTab() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cashMoveOpen, setCashMoveOpen] = useState(false);
  const [cashMoveType, setCashMoveType] = useState<"IN" | "OUT">("IN");
  const [cashMoveAmount, setCashMoveAmount] = useState("");
  const [cashMoveReason, setCashMoveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [daily, session] = await Promise.all([
        getDailyReport(),
        getCurrentCashSession(),
      ]);
      setReport(daily);
      setSessionId(session?.id || null);
    } catch (err: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

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

  if (!report) return <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos del día</div>;

  const pmList = PAYMENT_METHODS.filter((pm) => (report.byPayment[pm.method]?.count || 0) > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Corte del día
          </h2>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex gap-1">
          {sessionId ? (
            <Badge className="bg-green-500/10 text-green-700">CAJA ABIERTA</Badge>
          ) : (
            <Badge variant="destructive">CAJA CERRADA</Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Ventas totales</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-primary">{formatCLP(report.totalSales)}</p><p className="text-xs text-muted-foreground">{report.salesCount} ventas</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Entradas</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-green-600">{formatCLP(report.totalCashIn)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Salidas</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-red-600">{formatCLP(report.totalCashOut)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Neto caja</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-green-600">{formatCLP(report.netCash)}</p></CardContent></Card>
      </div>

      {/* Ventas por método de pago */}
      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" />Ventas del día ({report.salesCount})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pmList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin ventas hoy</p>
          ) : (
            pmList.map((pm) => {
              const data = report.byPayment[pm.method];
              return (
                <div key={pm.method} className="flex items-center justify-between text-sm">
                  <span className={pm.color}>{pm.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{data.count}</Badge>
                    <span className="font-semibold">{formatCLP(data.total)}</span>
                  </div>
                </div>
              );
            })
          )}
          <Separator />
          <div className="flex justify-between text-sm font-bold">
            <span>Total ingresos del día</span>
            <span className="text-primary">{formatCLP(report.totalSales)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Movimientos de caja */}
      {report.movements && report.movements.length > 0 && (
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Movimientos de caja</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-64 overflow-y-auto">
              {report.movements.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {m.type === "IN" ? "Entrada" : "Salida"}
                      {m.reason && <span className="text-muted-foreground font-normal"> · {m.reason}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                  </div>
                  <span className={cn("font-semibold text-sm", m.type === "IN" ? "text-green-600" : "text-red-600")}>
                    {m.type === "IN" ? "+" : "-"}{formatCLP(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de efectivo en caja */}
      <Card className="shadow-none border-primary/20 bg-primary/5">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Efectivo que debe haber en caja</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Apertura</span><span>{formatCLP(report.totalOpenAmount || 0)}</span></div>
          <div className="flex justify-between"><span>+ Ventas en efectivo</span><span className="text-green-600">{formatCLP(report.byPayment?.EFECTIVO?.total || 0)}</span></div>
          <div className="flex justify-between"><span>+ Entradas de caja</span><span className="text-green-600">{formatCLP(report.totalCashIn || 0)}</span></div>
          <div className="flex justify-between"><span>− Salidas de caja</span><span className="text-red-600">{formatCLP(report.totalCashOut || 0)}</span></div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total efectivo</span>
            <span className="text-primary">{formatCLP(report.netCash)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      {sessionId && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { setCashMoveType("IN"); setCashMoveOpen(true); }}>
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1 text-green-600" /> Entrada
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCashMoveType("OUT"); setCashMoveOpen(true); }}>
            <ArrowUpFromLine className="h-3.5 w-3.5 mr-1 text-red-600" /> Salida
          </Button>
        </div>
      )}

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
