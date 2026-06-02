"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const OpenSessionSchema = z.object({
  openAmount: z.coerce.number().min(0, "El monto inicial debe ser mayor o igual a 0"),
});

const CloseSessionSchema = z.object({
  sessionId: z.string().min(1),
  closeAmount: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export async function getCurrentCashSession() {
  const session = await verifySession();

  const cashSession = await prisma.cashSession.findFirst({
    where: {
      userId: session.userId,
      status: "OPEN",
    },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        select: { id: true, total: true, paymentMethod: true, ticketNumber: true, createdAt: true, cashReceived: true, cashChange: true },
      },
    },
    orderBy: { openedAt: "desc" },
  });

  return cashSession;
}

export async function getCashSessionSummary(sessionId: string) {
  const session = await verifySession();

  const cashSession = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true } },
      sales: {
        where: { status: "COMPLETED" },
        select: {
          id: true,
          ticketNumber: true,
          total: true,
          paymentMethod: true,
          cashReceived: true,
          cashChange: true,
          createdAt: true,
        },
      },
    },
  });

  if (!cashSession) return null;

  // Calcular totales por método de pago
  const byPayment: Record<string, { count: number; total: number }> = {
    EFECTIVO: { count: 0, total: 0 },
    DEBITO: { count: 0, total: 0 },
    CREDITO: { count: 0, total: 0 },
    TRANSFERENCIA: { count: 0, total: 0 },
    CREDITO_CLIENTE: { count: 0, total: 0 },
    MIXTO: { count: 0, total: 0 },
  };
  for (const sale of cashSession.sales) {
    if (!byPayment[sale.paymentMethod]) {
      byPayment[sale.paymentMethod] = { count: 0, total: 0 };
    }
    byPayment[sale.paymentMethod].count++;
    byPayment[sale.paymentMethod].total += sale.total;
  }

  const totalSales = cashSession.sales.reduce((sum, s) => sum + s.total, 0);
  const totalCashSales = byPayment.EFECTIVO.total;
  const totalCashReceived = cashSession.sales.reduce((sum, s) => sum + (s.cashReceived || 0), 0);
  const totalChange = cashSession.sales.reduce((sum, s) => sum + (s.cashChange || 0), 0);
  const expectedCash = cashSession.openAmount + totalCashReceived - totalChange;

  return {
    ...cashSession,
    byPayment,
    totalSales,
    totalCashSales,
    expectedCash,
  };
}

export async function openCashSession(data: z.infer<typeof OpenSessionSchema>) {
  const session = await verifySession();
  const validated = OpenSessionSchema.parse(data);

  // Verificar que no haya una sesión abierta
  const existing = await prisma.cashSession.findFirst({
    where: { userId: session.userId, status: "OPEN" },
  });
  if (existing) {
    throw new Error("Ya tienes una sesión de caja abierta");
  }

  const newSession = await prisma.cashSession.create({
    data: {
      userId: session.userId,
      openAmount: validated.openAmount,
      status: "OPEN",
    },
  });

  revalidatePath("/cierre-caja");
  revalidatePath("/dashboard");
  return newSession;
}

export async function closeCashSession(data: z.infer<typeof CloseSessionSchema>) {
  const session = await verifySession();
  const validated = CloseSessionSchema.parse(data);

  const cashSession = await prisma.cashSession.findUnique({
    where: { id: validated.sessionId },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        select: { cashReceived: true, cashChange: true, paymentMethod: true },
      },
    },
  });

  if (!cashSession) throw new Error("Sesión no encontrada");
  if (cashSession.status === "CLOSED") throw new Error("La sesión ya está cerrada");
  if (cashSession.userId !== session.userId) {
    throw new Error("No puedes cerrar una sesión de otro usuario");
  }

  // Calcular efectivo esperado
  const totalCashReceived = cashSession.sales.reduce((sum, s) => sum + (s.cashReceived || 0), 0);
  const totalChange = cashSession.sales.reduce((sum, s) => sum + (s.cashChange || 0), 0);
  const expectedCash = cashSession.openAmount + totalCashReceived - totalChange;
  const difference = validated.closeAmount - expectedCash;

  const closed = await prisma.cashSession.update({
    where: { id: validated.sessionId },
    data: {
      status: "CLOSED",
      closeAmount: validated.closeAmount,
      expectedAmount: expectedCash,
      difference,
      notes: validated.notes || null,
      closedAt: new Date(),
    },
  });

  revalidatePath("/cierre-caja");
  revalidatePath("/dashboard");
  return closed;
}

export async function getCashSessionHistory({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
  const session = await verifySession();

  const [sessions, total] = await Promise.all([
    prisma.cashSession.findMany({
      where: { userId: session.userId },
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashSession.count({ where: { userId: session.userId } }),
  ]);

  return { sessions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
