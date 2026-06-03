"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { revalidatePath } from "next/cache";

const ImportRowSchema = z.object({
  name: z.string().min(1, "Nombre obligatorio"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  unit: z.string().optional().default("UNIDAD"),
  priceCost: z.coerce.number().min(0).default(0),
  priceSale: z.coerce.number().min(0).default(0),
  priceWholesale: z.coerce.number().optional().nullable(),
  wholesaleMinQty: z.coerce.number().int().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().optional().nullable(),
});

const ImportSchema = z.object({
  rows: z.array(ImportRowSchema).min(1, "El archivo no contiene productos válidos"),
});

export async function importProducts(data: z.infer<typeof ImportSchema>) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = ImportSchema.parse(data);

  const mainWarehouse = await prisma.warehouse.findFirst();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of validated.rows) {
    try {
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            ...(row.sku ? [{ sku: row.sku }] : []),
            ...(row.barcode ? [{ barcode: row.barcode }] : []),
          ],
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      let categoryId: string | null = null;
      if (row.categoryName) {
        let cat = await prisma.category.findFirst({
          where: { name: { equals: row.categoryName } },
        });
        if (!cat) {
          cat = await prisma.category.create({
            data: { name: row.categoryName },
          });
        }
        categoryId = cat.id;
      }

      if (!categoryId) {
        categoryId = (await prisma.category.findFirst())?.id || null;
      }

      if (!categoryId) {
        errors.push(`Fila ${created + skipped + 1}: Sin categoría disponible para "${row.name}"`);
        continue;
      }

      const unit = ["UNIDAD", "KILO", "GRAMO", "LITRO", "PACK", "CAJA", "MANOJO", "MALLA"].includes(row.unit)
        ? row.unit
        : "UNIDAD";

      await prisma.product.create({
        data: {
          name: row.name,
          sku: row.sku || null,
          barcode: row.barcode || null,
          categoryId,
          unit: unit as any,
          priceCost: row.priceCost,
          priceSale: row.priceSale,
          priceWholesale: row.priceWholesale || null,
          wholesaleMinQty: row.wholesaleMinQty || null,
          taxRate: row.taxRate,
          minStock: row.minStock,
          maxStock: row.maxStock || null,
        },
      });

      created++;
    } catch (err: any) {
      errors.push(`Error en "${row.name}": ${err.message}`);
    }
  }

  revalidatePath("/inventario");
  revalidatePath("/pos");

  return { created, skipped, errors };
}
