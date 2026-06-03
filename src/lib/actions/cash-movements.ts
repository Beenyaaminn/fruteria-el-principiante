"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { revalidatePath } from "next/cache";

const CashMovementSchema = z.object({
  cashSessionId: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
  reason: z.string().optional().nullable(),
});

export async function createCashMovement(data: z.infer<typeof CashMovementSchema>) {
  const session = await verifySession();
  const validated = CashMovementSchema.parse(data);

  const cashSession = await prisma.cashSession.findUnique({
    where: { id: validated.cashSessionId },
  });

  if (!cashSession) throw new Error("Sesión de caja no encontrada");
  if (cashSession.status !== "OPEN") throw new Error("La caja ya está cerrada");
  if (cashSession.userId !== session.userId) throw new Error("No puedes modificar una caja de otro usuario");

  const movement = await prisma.cashMovement.create({
    data: {
      cashSessionId: validated.cashSessionId,
      userId: session.userId,
      type: validated.type,
      amount: validated.amount,
      reason: validated.reason || null,
    },
  });

  revalidatePath("/cierre-caja");
  return movement;
}

export async function getCashMovements(cashSessionId: string) {
  await verifySession();

  return prisma.cashMovement.findMany({
    where: { cashSessionId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
