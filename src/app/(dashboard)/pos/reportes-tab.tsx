"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users, Boxes, Loader2,
} from "lucide-react";
import { formatCLP, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getSalesByDay, getTopProducts, getSalesByPaymentMethod,
  getReportsSummary, getInventoryValuation, getCashierPerformance,
} from "@/lib/actions/reports";
import { SalesChart } from "@/app/(dashboard)/reportes/charts/sales-chart";
import { PaymentMethodsChart } from "@/app/(dashboard)/reportes/charts/payment-methods-chart";
import { TopProductsTable } from "@/app/(dashboard)/reportes/charts/top-products";
import { CategoryValuationChart } from "@/app/(dashboard)/reportes/charts/category-valuation";

type PeriodKey = "7d" | "30d" | "90d" | "month" | "year";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "month", label: "Este mes" },
  { key: "year", label: "Este año" },
];

export function ReportesTab() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [byDay, setByDay] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [byPayment, setByPayment] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [cashiers, setCashiers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, bd, tp, bp, inv, cash] = await Promise.all([
        getReportsSummary(period),
        getSalesByDay(period),
        getTopProducts(period, 10),
        getSalesByPaymentMethod(period),
        getInventoryValuation(),
        getCashierPerformance(period),
      ]);
      setSummary(s);
      setByDay(bd);
      setTopProducts(tp);
      setByPayment(bp);
      setInventory(inv);
      setCashiers(cash);
    } catch (err: any) { toast.error("Error al cargar reportes"); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Reportes</h2>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button key={p.key} size="sm" variant={p.key === period ? "default" : "outline"} onClick={() => setPeriod(p.key)} className="text-xs h-7">
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Ventas</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-green-600">{formatCLP(summary?.totalRevenue || 0)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">N° ventas</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-blue-600">{summary?.totalSales || 0}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Ticket prom.</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-purple-600">{formatCLP(summary?.avgTicket || 0)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Items vendidos</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-orange-600">{formatNumber(summary?.totalItems || 0, 0)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">IVA</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold">{formatCLP(summary?.totalTax || 0)}</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader><CardTitle className="text-sm">Ventas por día</CardTitle><CardDescription>{PERIODS.find((p) => p.key === period)?.label}</CardDescription></CardHeader>
          <CardContent><SalesChart data={byDay} /></CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm">Por método de pago</CardTitle></CardHeader>
          <CardContent><PaymentMethodsChart data={byPayment} /></CardContent>
        </Card>
      </div>

      {/* Top productos */}
      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm">Productos más vendidos</CardTitle><CardDescription>Top 10 del período</CardDescription></CardHeader>
        <CardContent className="p-0"><TopProductsTable data={topProducts} /></CardContent>
      </Card>

      {/* Valorización + Cajeros */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Boxes className="h-4 w-4" />Valorización por categoría</CardTitle><CardDescription>Total: {formatCLP(inventory?.totalCost || 0)} costo · {formatCLP(inventory?.totalSale || 0)} venta</CardDescription></CardHeader>
          <CardContent><CategoryValuationChart data={inventory?.byCategory || []} /></CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Rendimiento por cajero</CardTitle><CardDescription>Período seleccionado</CardDescription></CardHeader>
          <CardContent>
            {cashiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin ventas</p>
            ) : (
              <div className="space-y-3">
                {cashiers.map((c: any) => (
                  <div key={c.userId} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.sales} ventas</span></div>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-primary">{formatCLP(c.total)}</p>
                      <p className="text-xs text-muted-foreground">Prom: {formatCLP(c.avgTicket)}</p>
                    </div>
                    <Separator className="mt-1" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
