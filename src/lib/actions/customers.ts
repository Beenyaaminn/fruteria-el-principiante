"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, verifySession } from "@/lib/dal";

const CustomerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  creditDays: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

const PaymentSchema = z.object({
  customerId: z.string().min(1),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  saleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function getCustomers(search?: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);
  const where: any = { active: true };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }
  return prisma.customer.findMany({
    where,
    include: {
      _count: { select: { sales: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);
  return prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          ticketNumber: true,
          total: true,
          createdAt: true,
          paymentMethod: true,
          status: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });
}

export async function createCustomer(data: CustomerInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);
  const validated = CustomerSchema.parse(data);
  const customer = await prisma.customer.create({
    data: {
      ...validated,
      email: validated.email || null,
      creditLimit: validated.creditLimit || null,
      creditDays: validated.creditDays || null,
    },
  });
  revalidatePath("/clientes");
  return customer;
}

export async function updateCustomer(id: string, data: CustomerInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO"]);
  const validated = CustomerSchema.parse(data);
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...validated,
      email: validated.email || null,
      creditLimit: validated.creditLimit || null,
      creditDays: validated.creditDays || null,
    },
  });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return customer;
}

export async function deleteCustomer(id: string) {
  await requireRole(["ADMIN"]);
  await prisma.customer.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/clientes");
  return { success: true };
}

export async function registerCustomerPayment(data: z.infer<typeof PaymentSchema>) {
  const session = await verifySession();
  const validated = PaymentSchema.parse(data);

  const customer = await prisma.customer.findUnique({ where: { id: validated.customerId } });
  if (!customer) throw new Error("Cliente no encontrado");

  await prisma.$transaction(async (tx) => {
    // Registrar pago
    await tx.customerPayment.create({
      data: {
        customerId: validated.customerId,
        amount: validated.amount,
        saleId: validated.saleId || null,
        userId: session.userId,
        notes: validated.notes || null,
      },
    });
    // Reducir deuda
    await tx.customer.update({
      where: { id: validated.customerId },
      data: { balance: { decrement: validated.amount } },
    });
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${validated.customerId}`);
  return { success: true };
}
