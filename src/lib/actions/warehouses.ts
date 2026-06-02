"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, verifySession } from "@/lib/dal";

const EntryItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.coerce.number().positive("Cantidad debe ser mayor a 0"),
  unitCost: z.coerce.number().min(0).default(0),
});

const CreateEntrySchema = z.object({
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  supplierId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(EntryItemSchema).min(1, "Agrega al menos un producto"),
});

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

const TransferSchema = z.object({
  productId: z.string().min(1),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  notes: z.string().optional().nullable(),
});

const WasteSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(1, "Indica el motivo"),
});

const AdjustmentSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  newQuantity: z.coerce.number().min(0),
  reason: z.string().min(1, "Indica el motivo"),
});

// ==================== WAREHOUSES ====================

export async function getWarehouses() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);

  const warehouses = await prisma.warehouse.findMany({
    where: { active: true },
    include: {
      stocks: {
        include: { product: { select: { priceCost: true, priceSale: true, minStock: true, active: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return warehouses.map((w) => {
    const activeStocks = w.stocks.filter((s) => s.product.active);
    const totalProducts = activeStocks.length;
    const totalUnits = activeStocks.reduce((sum, s) => sum + s.quantity, 0);
    const totalValue = activeStocks.reduce(
      (sum, s) => sum + s.quantity * s.product.priceCost,
      0
    );
    const totalSaleValue = activeStocks.reduce(
      (sum, s) => sum + s.quantity * s.product.priceSale,
      0
    );
    const lowStock = activeStocks.filter(
      (s) => s.quantity > 0 && s.quantity <= (s.minStock || 0)
    ).length;
    const outOfStock = activeStocks.filter((s) => s.quantity <= 0).length;

    return {
      id: w.id,
      name: w.name,
      location: w.location,
      totalProducts,
      totalUnits,
      totalValue,
      totalSaleValue,
      lowStock,
      outOfStock,
    };
  });
}

export async function getWarehouseById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  return prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { stocks: true } },
    },
  });
}

export async function getWarehouseStock(
  warehouseId: string,
  search?: string,
  lowStockOnly?: boolean
) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);

  const where: any = { warehouseId, product: { active: true } };
  if (search) {
    where.product = {
      active: true,
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ],
    };
  }

  const stocks = await prisma.stock.findMany({
    where,
    include: {
      product: {
        include: { category: { select: { name: true } } },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  let result = stocks.map((s) => ({
    id: s.id,
    productId: s.productId,
    name: s.product.name,
    sku: s.product.sku,
    barcode: s.product.barcode,
    categoryName: s.product.category.name,
    unit: s.product.unit,
    priceCost: s.product.priceCost,
    priceSale: s.product.priceSale,
    minStock: s.minStock ?? s.product.minStock,
    quantity: s.quantity,
    value: s.quantity * s.product.priceCost,
  }));

  if (lowStockOnly) {
    result = result.filter((r) => r.quantity <= r.minStock);
  }

  return result;
}

// ==================== STOCK MOVEMENTS ====================

export async function createStockEntry(data: CreateEntryInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = CreateEntrySchema.parse(data);
  const session = await verifySession();

  await prisma.$transaction(async (tx) => {
    for (const item of validated.items) {
      // Incrementar stock
      const existing = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: validated.warehouseId,
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
            warehouseId: validated.warehouseId,
            quantity: item.quantity,
          },
        });
      }

      // Registrar movimiento
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: validated.warehouseId,
          type: "ENTRADA",
          quantity: item.quantity,
          reason: validated.notes || "Entrada de mercadería",
          userId: session.userId,
        },
      });

      // Actualizar precio costo si se proporcionó
      if (item.unitCost > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { priceCost: item.unitCost },
        });
      }
    }
  });

  revalidatePath("/bodegas");
  revalidatePath(`/bodegas/${validated.warehouseId}`);
  revalidatePath("/inventario");
  return { success: true };
}

export async function createStockTransfer(data: z.infer<typeof TransferSchema>) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = TransferSchema.parse(data);

  if (validated.fromWarehouseId === validated.toWarehouseId) {
    throw new Error("Las bodegas de origen y destino deben ser diferentes");
  }

  const session = await verifySession();

  // Verificar stock suficiente
  const sourceStock = await prisma.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId: validated.productId,
        warehouseId: validated.fromWarehouseId,
      },
    },
  });
  if (!sourceStock || sourceStock.quantity < validated.quantity) {
    throw new Error("Stock insuficiente en la bodega de origen");
  }

  await prisma.$transaction(async (tx) => {
    // Descontar origen
    await tx.stock.update({
      where: { id: sourceStock.id },
      data: { quantity: { decrement: validated.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId: validated.productId,
        warehouseId: validated.fromWarehouseId,
        type: "TRASPASO",
        quantity: -validated.quantity,
        reason: `Traspaso hacia bodega destino${validated.notes ? `: ${validated.notes}` : ""}`,
        userId: session.userId,
      },
    });

    // Sumar destino
    const destStock = await tx.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: validated.productId,
          warehouseId: validated.toWarehouseId,
        },
      },
    });
    if (destStock) {
      await tx.stock.update({
        where: { id: destStock.id },
        data: { quantity: { increment: validated.quantity } },
      });
    } else {
      await tx.stock.create({
        data: {
          productId: validated.productId,
          warehouseId: validated.toWarehouseId,
          quantity: validated.quantity,
        },
      });
    }
    await tx.stockMovement.create({
      data: {
        productId: validated.productId,
        warehouseId: validated.toWarehouseId,
        type: "ENTRADA",
        quantity: validated.quantity,
        reason: `Traspaso desde bodega origen${validated.notes ? `: ${validated.notes}` : ""}`,
        userId: session.userId,
      },
    });
  });

  revalidatePath("/bodegas");
  revalidatePath(`/bodegas/${validated.fromWarehouseId}`);
  revalidatePath(`/bodegas/${validated.toWarehouseId}`);
  revalidatePath("/inventario");
  return { success: true };
}

export async function createStockWaste(data: z.infer<typeof WasteSchema>) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = WasteSchema.parse(data);
  const session = await verifySession();

  const stock = await prisma.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId: validated.productId,
        warehouseId: validated.warehouseId,
      },
    },
  });
  if (!stock || stock.quantity < validated.quantity) {
    throw new Error("Stock insuficiente para registrar la merma");
  }

  await prisma.$transaction(async (tx) => {
    await tx.stock.update({
      where: { id: stock.id },
      data: { quantity: { decrement: validated.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId: validated.productId,
        warehouseId: validated.warehouseId,
        type: "MERMA",
        quantity: -validated.quantity,
        reason: validated.reason,
        userId: session.userId,
      },
    });
  });

  revalidatePath("/bodegas");
  revalidatePath(`/bodegas/${validated.warehouseId}`);
  revalidatePath("/inventario");
  return { success: true };
}

export async function createStockAdjustment(data: z.infer<typeof AdjustmentSchema>) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = AdjustmentSchema.parse(data);
  const session = await verifySession();

  const stock = await prisma.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId: validated.productId,
        warehouseId: validated.warehouseId,
      },
    },
  });

  const diff = validated.newQuantity - (stock?.quantity || 0);

  await prisma.$transaction(async (tx) => {
    if (stock) {
      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: validated.newQuantity },
      });
    } else {
      await tx.stock.create({
        data: {
          productId: validated.productId,
          warehouseId: validated.warehouseId,
          quantity: validated.newQuantity,
        },
      });
    }
    await tx.stockMovement.create({
      data: {
        productId: validated.productId,
        warehouseId: validated.warehouseId,
        type: "AJUSTE",
        quantity: diff,
        reason: validated.reason,
        userId: session.userId,
      },
    });
  });

  revalidatePath("/bodegas");
  revalidatePath(`/bodegas/${validated.warehouseId}`);
  revalidatePath("/inventario");
  return { success: true };
}

export async function getStockMovements({
  warehouseId,
  productId,
  type,
  startDate,
  endDate,
  page = 1,
  pageSize = 30,
}: {
  warehouseId?: string;
  productId?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
} = {}) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);

  const where: any = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, unit: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
