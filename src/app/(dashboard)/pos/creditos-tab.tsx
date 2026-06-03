"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, Users, TrendingDown, ArrowDownCircle, Loader2, AlertTriangle, Search,
} from "lucide-react";
import { formatCLP, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { registerCustomerPayment } from "@/lib/actions/customers";
import {
  getCreditSummary, getDebtors, getCreditPayments, getCreditSales,
  type CreditClient, type CreditPayment, type CreditSale,
} from "@/lib/actions/credit";

export function CreditosTab() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalDebt: 0, clientsWithDebt: 0, paymentsToday: 0, activeClients: 0 });
  const [debtors, setDebtors] = useState<CreditClient[]>([]);
  const [payments, setPayments] = useState<CreditPayment[]>([]);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditClient | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, d, p, cs] = await Promise.all([
        getCreditSummary(),
        getDebtors(),
        getCreditPayments(50),
        getCreditSales(50),
      ]);
      setSummary(s);
      setDebtors(d);
      setPayments(p);
      setCreditSales(cs);
    } catch (err: any) {
      toast.error("Error al cargar datos de crédito");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!selectedCustomer) return;
    const amount = parseInt(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (amount > selectedCustomer.balance) {
      toast.error(`El monto no puede superar la deuda (${formatCLP(selectedCustomer.balance)})`);
      return;
    }
    setSubmitting(true);
    try {
      await registerCustomerPayment({
        customerId: selectedCustomer.id,
        amount,
        notes: paymentNotes || null,
      });
      toast.success(`Abono de ${formatCLP(amount)} registrado para ${selectedCustomer.name}`);
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar abono");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = search
    ? debtors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : debtors;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border-b border-border bg-card shrink-0">
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Deuda total</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-lg font-bold text-red-600">{formatCLP(summary.totalDebt)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Clientes con deuda</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-lg font-bold">{summary.clientsWithDebt} <span className="text-xs font-normal text-muted-foreground">/ {summary.activeClients}</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Abonos hoy</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-lg font-bold text-green-600">{formatCLP(summary.paymentsToday)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Ventas a crédito</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-lg font-bold">{creditSales.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
        {/* Deudores */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-border">
          <div className="p-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">{search ? "Sin resultados" : "Sin clientes con deuda"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Deuda</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Límite</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Ventas</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const overLimit = d.creditLimit && d.balance > d.creditLimit;
                    return (
                      <TableRow key={d.id} className="group">
                        <TableCell>
                          <p className="font-medium text-sm">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Última venta: {d.lastSaleDate ? formatDateTime(d.lastSaleDate) : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-semibold text-sm", overLimit ? "text-red-600" : "text-foreground")}>
                            {formatCLP(d.balance)}
                          </span>
                          {d.creditLimit && (
                            <div className="w-full bg-muted rounded-full h-1 mt-0.5 hidden sm:block">
                              <div
                                className={cn("h-1 rounded-full", overLimit ? "bg-red-500" : d.balance / d.creditLimit > 0.7 ? "bg-orange-500" : "bg-green-500")}
                                style={{ width: `${Math.min(100, (d.balance / d.creditLimit) * 100)}%` }}
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                          {d.creditLimit ? formatCLP(d.creditLimit) : "—"}
                        </TableCell>
                        <TableCell className="text-center text-xs hidden md:table-cell">{d.salesCount}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCustomer(d);
                              setPaymentAmount("");
                              setPaymentNotes("");
                              setPaymentOpen(true);
                            }}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            Abonar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Panel derecho: historial de pagos + ventas a crédito */}
        <div className="lg:w-80 border-t lg:border-t-0 border-border bg-card flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                Últimos abonos
              </h3>
            </div>
            {payments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">Sin abonos registrados</p>
            ) : (
              <div className="divide-y">
                {payments.slice(0, 20).map((p) => (
                  <div key={p.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(p.createdAt)} · {p.userName}
                        </p>
                        {p.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{p.notes}</p>}
                      </div>
                      <span className="text-sm font-semibold text-green-600 ml-2 shrink-0">{formatCLP(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 border-b border-border mt-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Últimas ventas a crédito
              </h3>
            </div>
            {creditSales.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">Sin ventas a crédito</p>
            ) : (
              <div className="divide-y">
                {creditSales.slice(0, 20).map((s) => (
                  <div key={s.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          #{s.ticketNumber.toString().padStart(6, "0")} · {formatDateTime(s.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-red-600 ml-2 shrink-0">{formatCLP(s.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Diálogo de abono */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar abono</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} · Deuda actual: {selectedCustomer ? formatCLP(selectedCustomer.balance) : ""}
              {selectedCustomer?.creditLimit && selectedCustomer.balance > selectedCustomer.creditLimit && (
                <span className="block mt-1 text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Excede límite de crédito
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Monto del abono</Label>
              <Input
                type="number"
                min="1"
                max={selectedCustomer?.balance || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ej: Abono factura #123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handlePayment} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
