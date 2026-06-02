"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, verifySession } from "@/lib/dal";
import { createAuditLog } from "@/lib/audit";

const SupplierSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;

const PurchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0),
});

const CreatePurchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  notes: z.string().optional().nullable(),
  items: z.array(PurchaseItemSchema).min(1, "Agrega al menos un producto"),
});

export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;

// ==================== PROVEEDORES ====================

export async function getSuppliers() {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  return prisma.supplier.findMany({
    where: { active: true },
    include: { _count: { select: { purchases: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  return prisma.supplier.findUnique({
    where: { id },
    include: { purchases: { take: 20, orderBy: { createdAt: "desc" } } },
  });
}

export async function createSupplier(data: SupplierInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = SupplierSchema.parse(data);
  const supplier = await prisma.supplier.create({
    data: {
      ...validated,
      email: validated.email || null,
    },
  });
  revalidatePath("/proveedores");
  return supplier;
}

export async function updateSupplier(id: string, data: SupplierInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = SupplierSchema.parse(data);
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { ...validated, email: validated.email || null },
  });
  revalidatePath("/proveedores");
  return supplier;
}

export async function deleteSupplier(id: string) {
  await requireRole(["ADMIN"]);
  await prisma.supplier.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/proveedores");
  return { success: true };
}

// ==================== COMPRAS ====================

export async function getPurchases({
  page = 1,
  pageSize = 20,
  status,
  supplierId,
}: { page?: number; pageSize?: number; status?: string; supplierId?: string } = {}) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);

  const where: any = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchase.count({ where }),
  ]);

  return { purchases, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getPurchaseById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      user: { select: { name: true } },
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
  });
}

export async function createPurchase(data: CreatePurchaseInput) {
  const session = await verifySession();
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = CreatePurchaseSchema.parse(data);

  const total = validated.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        supplierId: validated.supplierId,
        warehouseId: validated.warehouseId,
        total,
        status: "PENDING",
        notes: validated.notes || null,
        userId: session.userId,
        items: {
          create: validated.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            subtotal: i.quantity * i.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    return newPurchase;
  });

  await createAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "Purchase",
    entityId: purchase.id,
    details: `Creó orden de compra por $${total}`,
  });

  revalidatePath("/compras");
  return purchase;
}

export async function receivePurchase(id: string) {
  const session = await verifySession();
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!purchase) throw new Error("Compra no encontrada");
  if (purchase.status === "RECEIVED") throw new Error("Ya fue recibida");

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id },
      data: { status: "RECEIVED" },
    });

    for (const item of purchase.items) {
      // Sumar al stock
      const existing = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: purchase.warehouseId,
          },
        },
      });

      if (existing) {
        await tx.stock.update({
          where: { id: existing.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: item.productId,
            warehouseId: purchase.warehouseId,
            quantity: item.quantity,
          },
        });
      }

      // Movimiento de entrada
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: purchase.warehouseId,
          type: "ENTRADA",
          quantity: item.quantity,
          reason: `Recepción de compra #${id.slice(0, 8)}`,
          referenceId: id,
          userId: session.userId,
        },
      });

      // Actualizar precio de costo
      await tx.product.update({
        where: { id: item.productId },
        data: { priceCost: item.unitCost },
      });
    }
  });

  await createAuditLog({
    userId: session.userId,
    action: "RECEIVE",
    entity: "Purchase",
    entityId: id,
    details: `Recibió orden de compra`,
  });

  revalidatePath("/compras");
  revalidatePath(`/compras/${id}`);
  revalidatePath("/inventario");
  revalidatePath("/bodegas");
  return { success: true };
}

export async function cancelPurchase(id: string) {
  const session = await verifySession();
  await requireRole(["ADMIN", "SUPERVISOR"]);

  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) throw new Error("Compra no encontrada");
  if (purchase.status === "RECEIVED") throw new Error("No se puede cancelar una compra ya recibida");

  await prisma.purchase.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await createAuditLog({
    userId: session.userId,
    action: "CANCEL",
    entity: "Purchase",
    entityId: id,
    details: `Canceló orden de compra`,
  });

  revalidatePath("/compras");
  return { success: true };
}
