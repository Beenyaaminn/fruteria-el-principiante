"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const CategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export async function getCategories() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryById(id: string) {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(data: CategoryInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = CategorySchema.parse(data);
  const category = await prisma.category.create({
    data: {
      ...validated,
      parentId: validated.parentId || null,
    },
  });
  revalidatePath("/inventario/categorias");
  revalidatePath("/pos");
  return category;
}

export async function updateCategory(id: string, data: CategoryInput) {
  await requireRole(["ADMIN", "SUPERVISOR", "BODEGUERO"]);
  const validated = CategorySchema.parse(data);
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...validated,
      parentId: validated.parentId || null,
    },
  });
  revalidatePath("/inventario/categorias");
  revalidatePath("/pos");
  return category;
}

export async function deleteCategory(id: string) {
  await requireRole(["ADMIN"]);
  await prisma.category.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/inventario/categorias");
  return { success: true };
}
