"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { subDays, startOfDay, endOfDay, startOfMonth, startOfYear, subMonths } from "date-fns";

type PeriodKey = "7d" | "30d" | "90d" | "month" | "year";

function getRange(period: PeriodKey) {
  const now = new Date();
  switch (period) {
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "90d":
      return { from: subDays(now, 90), to: now };
    case "month":
      return { from: startOfMonth(now), to: now };
    case "year":
      return { from: startOfYear(now), to: now };
  }
}

// ============== VENTAS POR DÍA ==============
export async function getSalesByDay(period: PeriodKey) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  const { from, to } = getRange(period);

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
    select: { createdAt: true, total: true, paymentMethod: true },
  });

  // Agrupar por día
  const byDay: Record<string, { date: string; total: number; count: number; cash: number; card: number; transfer: number }> = {};
  for (const sale of sales) {
    const key = sale.createdAt.toISOString().split("T")[0];
    if (!byDay[key]) {
      byDay[key] = { date: key, total: 0, count: 0, cash: 0, card: 0, transfer: 0 };
    }
    byDay[key].total += sale.total;
    byDay[key].count++;
    if (sale.paymentMethod === "EFECTIVO") byDay[key].cash += sale.total;
    else if (sale.paymentMethod === "DEBITO" || sale.paymentMethod === "CREDITO") byDay[key].card += sale.total;
    else if (sale.paymentMethod === "TRANSFERENCIA") byDay[key].transfer += sale.total;
  }

  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
}

// ============== TOP PRODUCTOS VENDIDOS ==============
export async function getTopProducts(period: PeriodKey, limit = 10) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  const { from, to } = getRange(period);

  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: "COMPLETED",
        createdAt: { gte: from, lte: to },
      },
    },
    include: {
      product: { select: { id: true, name: true, unit: true, priceCost: true } },
    },
  });

  // Agrupar por producto
  const byProduct: Record<string, {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }> = {};

  for (const item of items) {
    const key = item.productId;
    if (!byProduct[key]) {
      byProduct[key] = {
        productId: key,
        name: item.product.name,
        unit: item.product.unit,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
    }
    byProduct[key].quantity += item.quantity;
    byProduct[key].revenue += item.subtotal;
    byProduct[key].cost += item.quantity * item.product.priceCost;
  }

  for (const p of Object.values(byProduct)) {
    p.profit = p.revenue - p.cost;
  }

  return Object.values(byProduct)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ============== VENTAS POR MÉTODO DE PAGO ==============
export async function getSalesByPaymentMethod(period: PeriodKey) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  const { from, to } = getRange(period);

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
    select: { paymentMethod: true, total: true },
  });

  const byMethod: Record<string, { method: string; count: number; total: number }> = {};
  for (const sale of sales) {
    if (!byMethod[sale.paymentMethod]) {
      byMethod[sale.paymentMethod] = { method: sale.paymentMethod, count: 0, total: 0 };
    }
    byMethod[sale.paymentMethod].count++;
    byMethod[sale.paymentMethod].total += sale.total;
  }

  return Object.values(byMethod);
}

// ============== RESUMEN GENERAL ==============
export async function getReportsSummary(period: PeriodKey) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  const { from, to } = getRange(period);

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
    select: { total: true, taxTotal: true, paymentMethod: true },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.taxTotal, 0);
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalItems = await prisma.saleItem.count({
    where: {
      sale: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
    },
  });

  return {
    totalSales,
    totalRevenue,
    totalTax,
    avgTicket,
    totalItems,
  };
}

// ============== VALORIZACIÓN DE INVENTARIO ==============
export async function getInventoryValuation() {
  await requireRole(["ADMIN", "SUPERVISOR"]);

  const stocks = await prisma.stock.findMany({
    where: { product: { active: true } },
    include: {
      product: { select: { id: true, name: true, unit: true, priceCost: true, priceSale: true, category: { select: { name: true } } } },
      warehouse: { select: { id: true, name: true } },
    },
  });

  // Agrupar por categoría
  const byCategory: Record<string, { name: string; valueCost: number; valueSale: number; units: number }> = {};
  for (const s of stocks) {
    const cat = s.product.category.name;
    if (!byCategory[cat]) {
      byCategory[cat] = { name: cat, valueCost: 0, valueSale: 0, units: 0 };
    }
    byCategory[cat].valueCost += s.quantity * s.product.priceCost;
    byCategory[cat].valueSale += s.quantity * s.product.priceSale;
    byCategory[cat].units += s.quantity;
  }

  const totalCost = Object.values(byCategory).reduce((sum, c) => sum + c.valueCost, 0);
  const totalSale = Object.values(byCategory).reduce((sum, c) => sum + c.valueSale, 0);

  return {
    byCategory: Object.values(byCategory),
    totalCost,
    totalSale,
    totalProducts: new Set(stocks.map((s) => s.productId)).size,
  };
}

// ============== RENDIMIENTO POR CAJERO ==============
export async function getCashierPerformance(period: PeriodKey) {
  await requireRole(["ADMIN", "SUPERVISOR"]);
  const { from, to } = getRange(period);

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const byCashier: Record<string, { userId: string; name: string; sales: number; total: number; avgTicket: number }> = {};
  for (const s of sales) {
    if (!byCashier[s.userId]) {
      byCashier[s.userId] = { userId: s.userId, name: s.user.name, sales: 0, total: 0, avgTicket: 0 };
    }
    byCashier[s.userId].sales++;
    byCashier[s.userId].total += s.total;
  }
  for (const c of Object.values(byCashier)) {
    c.avgTicket = c.total / c.sales;
  }

  return Object.values(byCashier).sort((a, b) => b.total - a.total);
}
