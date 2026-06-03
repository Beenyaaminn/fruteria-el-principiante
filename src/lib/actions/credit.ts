"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export type CreditClient = {
  id: string;
  name: string;
  balance: number;
  creditLimit: number | null;
  creditDays: number | null;
  lastSaleDate: string | null;
  lastPaymentDate: string | null;
  totalSales: number;
  totalPayments: number;
  salesCount: number;
};

export type CreditPayment = {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  userName: string;
};

export type CreditSale = {
  id: string;
  ticketNumber: number;
  total: number;
  customerId: string;
  customerName: string;
  createdAt: string;
};

export async function getCreditSummary() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);

  const [customersWithDebt, totalDebt, paymentsToday] = await Promise.all([
    prisma.customer.count({ where: { balance: { gt: 0 }, active: true } }),
    prisma.customer.aggregate({
      _sum: { balance: true },
      where: { balance: { gt: 0 }, active: true },
    }),
    prisma.customerPayment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const activeCount = await prisma.customer.count({ where: { active: true } });

  return {
    totalDebt: totalDebt._sum.balance || 0,
    clientsWithDebt: customersWithDebt,
    paymentsToday: paymentsToday._sum.amount || 0,
    activeClients: activeCount,
  };
}

export async function getDebtors(): Promise<CreditClient[]> {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);

  const customers = await prisma.customer.findMany({
    where: { balance: { gt: 0 }, active: true },
    include: {
      sales: {
        where: { paymentMethod: "CREDITO_CLIENTE", status: "COMPLETED" },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      payments: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          sales: { where: { paymentMethod: "CREDITO_CLIENTE", status: "COMPLETED" } },
          payments: true,
        },
      },
    },
    orderBy: { balance: "desc" },
  });

  return customers.map((c) => {
    const totalSalesAgg = c.sales.length;
    const totalPaymentsAgg = c.payments.length;
    return {
      id: c.id,
      name: c.name,
      balance: c.balance,
      creditLimit: c.creditLimit,
      creditDays: c.creditDays,
      lastSaleDate: c.sales[0]?.createdAt?.toISOString() || null,
      lastPaymentDate: c.payments[0]?.createdAt?.toISOString() || null,
      totalSales: totalSalesAgg,
      totalPayments: totalPaymentsAgg,
      salesCount: c._count.sales,
    };
  });
}

export async function getCreditPayments(limit = 50): Promise<CreditPayment[]> {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);

  const payments = await prisma.customerPayment.findMany({
    include: {
      customer: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return payments.map((p) => ({
    id: p.id,
    customerId: p.customerId,
    customerName: p.customer.name,
    amount: p.amount,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    userName: p.user.name,
  }));
}

export async function getCreditSales(limit = 50): Promise<CreditSale[]> {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);

  const sales = await prisma.sale.findMany({
    where: { paymentMethod: "CREDITO_CLIENTE", status: "COMPLETED" },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return sales.map((s) => ({
    id: s.id,
    ticketNumber: s.ticketNumber,
    total: s.total,
    customerId: s.customerId || "",
    customerName: s.customer?.name || "—",
    createdAt: s.createdAt.toISOString(),
  }));
}
