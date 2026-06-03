"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { Prisma } from "@/generated/prisma/client";

export type KardexRow = {
  date: string;
  type: string;
  reference: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCostIn: number;
  totalCostOut: number;
  balanceQty: number;
  balanceValue: number;
};

export async function getProductKardex(
  productId: string,
  warehouseId: string,
  startDate: Date,
  endDate: Date
): Promise<{ rows: KardexRow[]; openingQty: number; openingValue: number; closingQty: number; closingValue: number; productName: string; productUnit: string; warehouseName: string }> {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, unit: true, priceCost: true },
  });
  if (!product) throw new Error("Producto no encontrado");

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { name: true },
  });
  if (!warehouse) throw new Error("Bodega no encontrada");

  const unitCost = product.priceCost;

  const previousMovements = await prisma.stockMovement.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      warehouseId,
      createdAt: { lt: startDate },
    },
  });
  const openingQty = previousMovements._sum.quantity || 0;
  const openingValue = openingQty * unitCost;

  const movements = await prisma.stockMovement.findMany({
    where: {
      productId,
      warehouseId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  let balanceQty = openingQty;
  let balanceValue = openingValue;
  const rows: KardexRow[] = [];

  const typeLabels: Record<string, string> = {
    ENTRADA: "Entrada",
    SALIDA: "Venta",
    MERMA: "Merma",
    TRASPASO: "Traspaso (salida)",
    AJUSTE: "Ajuste",
    DEVOLUCION: "Devolución",
  };

  for (const m of movements) {
    const isIn = m.type === "ENTRADA" || m.type === "DEVOLUCION";
    const qtyIn = isIn ? m.quantity : 0;
    const qtyOut = isIn ? 0 : Math.abs(m.quantity);
    const costIn = qtyIn * unitCost;
    const costOut = qtyOut * unitCost;

    balanceQty += m.quantity;
    balanceValue = balanceQty * unitCost;

    rows.push({
      date: m.createdAt.toISOString(),
      type: typeLabels[m.type] || m.type,
      reference: m.reason || m.referenceId || m.user.name || "",
      qtyIn,
      qtyOut,
      unitCost,
      totalCostIn: costIn,
      totalCostOut: costOut,
      balanceQty,
      balanceValue,
    });
  }

  rows.reverse();

  return {
    rows,
    openingQty,
    openingValue,
    closingQty: balanceQty,
    closingValue: balanceValue,
    productName: product.name,
    productUnit: product.unit,
    warehouseName: warehouse.name,
  };
}
