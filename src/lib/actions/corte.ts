"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export type DailyReport = {
  totalSales: number;
  salesCount: number;
  byPayment: Record<string, { count: number; total: number }>;
  totalCashIn: number;
  totalCashOut: number;
  netCash: number;
};

export async function getDailyReport() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: today, lt: tomorrow },
    },
    select: { total: true, paymentMethod: true },
  });

  const byPayment: Record<string, { count: number; total: number }> = {};
  let totalSales = 0;
  for (const s of sales) {
    if (!byPayment[s.paymentMethod]) byPayment[s.paymentMethod] = { count: 0, total: 0 };
    byPayment[s.paymentMethod].count++;
    byPayment[s.paymentMethod].total += s.total;
    totalSales += s.total;
  }

  const movements = await prisma.cashMovement.findMany({
    where: { createdAt: { gte: today, lt: tomorrow } },
    select: { type: true, amount: true, reason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCashIn = movements.filter((m) => m.type === "IN").reduce((s, m) => s + m.amount, 0);
  const totalCashOut = movements.filter((m) => m.type === "OUT").reduce((s, m) => s + m.amount, 0);

  const cashSessions = await prisma.cashSession.findMany({
    where: { openedAt: { gte: today, lt: tomorrow } },
    select: { openAmount: true },
  });
  const totalOpenAmount = cashSessions.reduce((s, cs) => s + cs.openAmount, 0);

  const netCash = totalOpenAmount +
    (byPayment.EFECTIVO?.total || 0) +
    totalCashIn - totalCashOut;

  return {
    totalSales,
    salesCount: sales.length,
    byPayment,
    totalCashIn,
    totalCashOut,
    netCash,
    totalOpenAmount,
    movements: movements.map((m) => ({
      type: m.type,
      amount: m.amount,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
