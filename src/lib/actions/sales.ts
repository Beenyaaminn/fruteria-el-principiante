"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const SaleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  warehouseId: z.string().optional().nullable(),
});

const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "Debe agregar al menos un producto"),
  paymentMethod: z.enum(["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA", "CREDITO_CLIENTE", "MIXTO"]),
  cashReceived: z.number().optional().nullable(),
  cashChange: z.number().optional().nullable(),
  discountTotal: z.number().min(0).default(0),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxTotal: z.number().min(0).default(0),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;

export async function createSale(data: CreateSaleInput) {
  const session = await verifySession();

  const validated = CreateSaleSchema.parse(data);

  // Calcular totales en el servidor (autoridad)
  const subtotal = validated.items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity - i.discount,
    0
  );
  const total = subtotal - validated.discountTotal + validated.taxTotal;

  // Obtener el siguiente número de ticket
  const lastSale = await prisma.sale.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const nextTicketNumber = (lastSale?.ticketNumber || 0) + 1;

  // Obtener bodega principal (por defecto)
  const defaultWarehouse = await prisma.warehouse.findFirst();
  if (!defaultWarehouse) {
    throw new Error("No hay bodegas configuradas");
  }

  // Verificar stock disponible
  for (const item of validated.items) {
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: item.warehouseId || defaultWarehouse.id,
        },
      },
    });
    if (!stock || stock.quantity < item.quantity) {
      throw new Error(`Stock insuficiente para uno o más productos`);
    }
  }

  // Crear venta con transacción
  const sale = await prisma.$transaction(async (tx) => {
    // 1. Crear la venta
    const newSale = await tx.sale.create({
      data: {
        ticketNumber: nextTicketNumber,
        subtotal,
        discountTotal: validated.discountTotal,
        taxTotal: validated.taxTotal,
        total,
        paymentMethod: validated.paymentMethod,
        cashReceived: validated.cashReceived || null,
        cashChange: validated.cashChange || null,
        customerId: validated.customerId || null,
        customerName: validated.customerName || null,
        notes: validated.notes || null,
        userId: session.userId,
        items: {
          create: validated.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            subtotal: i.unitPrice * i.quantity - i.discount,
            warehouseId: i.warehouseId || defaultWarehouse.id,
          })),
        },
      },
      include: { items: true },
    });

    // 2. Descontar del stock
    for (const item of validated.items) {
      const whId = item.warehouseId || defaultWarehouse.id;
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: whId,
          },
        },
        data: { quantity: { decrement: item.quantity } },
      });

      // 3. Registrar movimiento
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: whId,
          type: "SALIDA",
          quantity: item.quantity,
          reason: "Venta",
          referenceId: newSale.id,
          userId: session.userId,
        },
      });
    }

    // 4. Si es venta a crédito, actualizar balance del cliente
    if (validated.paymentMethod === "CREDITO_CLIENTE" && validated.customerId) {
      await tx.customer.update({
        where: { id: validated.customerId },
        data: { balance: { increment: total } },
      });
    }

    return newSale;
  });

  revalidatePath("/ventas");
  revalidatePath("/dashboard");
  revalidatePath("/inventario");
  revalidatePath("/reportes");

  return sale;
}

export async function getSales({
  page = 1,
  pageSize = 20,
  startDate,
  endDate,
  status,
  paymentMethod,
}: {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  paymentMethod?: string;
} = {}) {
  await verifySession();

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getSaleById(id: string) {
  await verifySession();
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { name: true, unit: true, sku: true } } },
      },
      user: { select: { name: true, email: true } },
      customer: true,
    },
  });
}

export async function getStoreConfig() {
  await verifySession();
  return prisma.storeConfig.findUnique({ where: { id: "default" } });
}

export async function cancelSale(id: string, reason: string) {
  const session = await verifySession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERVISOR")) {
    throw new Error("No tienes permisos para anular ventas");
  }

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) throw new Error("Venta no encontrada");
  if (sale.status === "CANCELLED") throw new Error("La venta ya está anulada");

  await prisma.$transaction(async (tx) => {
    // Marcar venta como anulada
    await tx.sale.update({
      where: { id },
      data: { status: "CANCELLED", cancelReason: reason },
    });

    // Devolver stock
    for (const item of sale.items) {
      if (!item.warehouseId) continue;
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: item.warehouseId,
          },
        },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: item.warehouseId,
          type: "DEVOLUCION",
          quantity: item.quantity,
          reason: `Anulación venta #${sale.ticketNumber}: ${reason}`,
          referenceId: sale.id,
          userId: session.userId,
        },
      });
    }
  });

  revalidatePath("/ventas");
  revalidatePath(`/ventas/${id}`);
  return { success: true };
}
