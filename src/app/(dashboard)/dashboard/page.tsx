import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  Receipt,
  Warehouse,
} from "lucide-react";
import { formatCLP } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todaySales,
    todaySalesCount,
    totalProducts,
    lowStockCount,
    totalCustomers,
    totalSales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { total: true },
    }),
    prisma.sale.count({
      where: {
        status: "COMPLETED",
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.stock.count({
      where: {
        quantity: { lte: 0 },
        product: { active: true },
      },
    }),
    prisma.customer.count({ where: { active: true } }),
    prisma.sale.count(),
  ]);

  return {
    todayTotal: todaySales._sum.total || 0,
    todaySalesCount,
    totalProducts,
    lowStockCount,
    totalCustomers,
    totalSales,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await getStats();

  const statsCards = [
    {
      title: "Ventas hoy",
      value: formatCLP(stats.todayTotal),
      subtitle: `${stats.todaySalesCount} ventas`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      title: "Productos",
      value: stats.totalProducts.toString(),
      subtitle: "Activos en catálogo",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Clientes",
      value: stats.totalCustomers.toString(),
      subtitle: "Registrados",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      title: "Alertas stock",
      value: stats.lowStockCount.toString(),
      subtitle: "Productos agotados",
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.name}. Aquí está el resumen de tu frutería.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Receipt className="mr-1 h-3 w-3" />
            {stats.totalSales} ventas totales
          </Badge>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions and info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acciones rápidas
            </CardTitle>
            <CardDescription>
              Comienza a operar tu frutería con estas opciones
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <a
              href="/pos"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Nueva venta</p>
                <p className="text-xs text-muted-foreground">
                  Abrir punto de venta
                </p>
              </div>
            </a>
            <a
              href="/inventario"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="rounded-lg bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Ver inventario</p>
                <p className="text-xs text-muted-foreground">
                  Productos y stock
                </p>
              </div>
            </a>
            <a
              href="/bodegas"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="rounded-lg bg-orange-500/10 p-2.5 group-hover:bg-orange-500/20">
                <Warehouse className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Bodegas</p>
                <p className="text-xs text-muted-foreground">
                  2 bodegas registradas
                </p>
              </div>
            </a>
            <a
              href="/cierre-caja"
              className="group flex items-center gap-3 rounded-lg border border-border p-4 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="rounded-lg bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Cierre de caja</p>
                <p className="text-xs text-muted-foreground">
                  Ver turno actual
                </p>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del sistema</CardTitle>
            <CardDescription>Información del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base de datos</span>
              <Badge variant="default" className="bg-green-500/10 text-green-700">
                Conectada
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sesión activa</span>
              <Badge variant="default" className="bg-green-500/10 text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                En línea
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuario</span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rol</span>
              <Badge variant="outline">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
