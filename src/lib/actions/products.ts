"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const ProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  unit: z.enum(["UNIDAD", "KILO", "GRAMO", "LITRO", "PACK", "CAJA", "MANOJO", "MALLA"]),
  priceCost: z.coerce.number().min(0).default(0),
  priceSale: z.coerce.number().min(0, "El precio de venta debe ser mayor o igual a 0"),
  priceWholesale: z.coerce.number().optional().nullable(),
  wholesaleMinQty: z.coerce.number().int().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().optional().nullable(),
  initialStock: z.coerce.number().min(0).optional(),
  image: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export async function getProducts() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: { select: { id: true, name: true } },
      stocks: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      unit: p.unit,
      priceCost: p.priceCost,
      priceSale: p.priceSale,
      priceWholesale: p.priceWholesale,
      wholesaleMinQty: p.wholesaleMinQty,
      taxRate: p.taxRate,
      minStock: p.minStock,
      maxStock: p.maxStock,
      image: p.image,
      totalStock,
      stocks: p.stocks.map((s) => ({
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        quantity: s.quantity,
      })),
    };
  });
}

export async function getProductById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      stocks: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getProductByBarcode(barcode: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  return prisma.product.findFirst({
    where: { barcode, active: true },
    include: {
      category: { select: { id: true, name: true } },
      stocks: true,
    },
  });
}

export async function createProduct(data: ProductInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = ProductSchema.parse(data);

  const product = await prisma.product.create({
    data: {
      ...validated,
      priceWholesale: validated.priceWholesale || null,
      wholesaleMinQty: validated.wholesaleMinQty || null,
      maxStock: validated.maxStock || null,
    },
  });

  // Asignar stock inicial en bodega principal
  const mainWarehouse = await prisma.warehouse.findFirst();
  if (mainWarehouse) {
    await prisma.stock.create({
      data: {
        productId: product.id,
        warehouseId: mainWarehouse.id,
        quantity: validated.initialStock || 0,
        minStock: validated.minStock,
      },
    });
  }

  revalidatePath("/inventario");
  revalidatePath("/pos");
  return product;
}

export async function updateProduct(id: string, data: ProductInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = ProductSchema.parse(data);

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...validated,
      priceWholesale: validated.priceWholesale || null,
      wholesaleMinQty: validated.wholesaleMinQty || null,
      maxStock: validated.maxStock || null,
    },
  });

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${id}`);
  revalidatePath("/pos");
  return product;
}

export async function deleteProduct(id: string) {
  await requireRole(["ADMIN"]);
  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/inventario");
  return { success: true };
}
