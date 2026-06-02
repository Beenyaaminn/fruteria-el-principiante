import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users, Boxes, ChevronRight, Calendar } from "lucide-react";
import { getSalesByDay, getTopProducts, getSalesByPaymentMethod, getReportsSummary, getInventoryValuation, getCashierPerformance } from "@/lib/actions/reports";
import { formatCLP, formatNumber } from "@/lib/format";
import { SalesChart } from "./charts/sales-chart";
import { PaymentMethodsChart } from "./charts/payment-methods-chart";
import { TopProductsTable } from "./charts/top-products";
import { CategoryValuationChart } from "./charts/category-valuation";

export const dynamic = "force-dynamic";

type PeriodKey = "7d" | "30d" | "90d" | "month" | "year";
const periodLabels: Record<PeriodKey, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "month": "Este mes",
  "year": "Este año",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period as PeriodKey) || "30d";

  const [summary, byDay, topProducts, byPayment, inventory, cashiers] = await Promise.all([
    getReportsSummary(period),
    getSalesByDay(period),
    getTopProducts(period, 10),
    getSalesByPaymentMethod(period),
    getInventoryValuation(),
    getCashierPerformance(period),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Reportes
          </h1>
          <p className="text-muted-foreground">Análisis del negocio</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(periodLabels) as PeriodKey[]).map((p) => (
            <Button
              key={p}
              asChild={p !== period}
              variant={p === period ? "default" : "outline"}
              size="sm"
            >
              {p === period ? (
                <span>{periodLabels[p]}</span>
              ) : (
                <Link href={{ pathname: "/reportes", query: { period: p } }}>{periodLabels[p]}</Link>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventas totales</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
              <DollarSign className="h-5 w-5" />
              {formatCLP(summary.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>N° de ventas</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
              {summary.totalSales}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket promedio</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2 text-purple-600">
              <TrendingUp className="h-5 w-5" />
              {formatCLP(summary.avgTicket)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Items vendidos</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-orange-600">
              <Package className="h-5 w-5" />
              {formatNumber(summary.totalItems, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>IVA recaudado</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2 text-muted-foreground">
              {formatCLP(summary.totalTax)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ventas por día</CardTitle>
            <CardDescription>{periodLabels[period]}</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={byDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por método de pago</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodsChart data={byPayment} />
          </CardContent>
        </Card>
      </div>

      {/* Top productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos más vendidos</CardTitle>
          <CardDescription>Top 10 del período seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TopProductsTable data={topProducts} />
        </CardContent>
      </Card>

      {/* Valorización + Cajeros */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Valorización de inventario por categoría
            </CardTitle>
            <CardDescription>Total: {formatCLP(inventory.totalCost)} a costo · {formatCLP(inventory.totalSale)} a venta</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryValuationChart data={inventory.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rendimiento por cajero
            </CardTitle>
            <CardDescription>Período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            {cashiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin ventas</p>
            ) : (
              <div className="space-y-3">
                {cashiers.map((c) => (
                  <div key={c.userId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{c.sales} ventas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-primary">{formatCLP(c.total)}</p>
                      <p className="text-xs text-muted-foreground">Promedio: {formatCLP(c.avgTicket)}</p>
                    </div>
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
