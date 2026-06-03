"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const ConfigSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  subtitle: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  currency: z.string().default("CLP"),
  currencySymbol: z.string().default("$"),
  ticketHeader: z.string().optional().nullable(),
  ticketFooter: z.string().optional().nullable(),
  loginBackground: z.string().optional().nullable(),
  ivaRate: z.coerce.number().min(0).max(100).default(19),
  lowStockAlert: z.boolean().default(true),
});

export type ConfigInput = z.infer<typeof ConfigSchema>;

export async function getStoreConfig() {
  await requireRole(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]);
  let config = await prisma.storeConfig.findUnique({ where: { id: "default" } });
  if (!config) {
    config = await prisma.storeConfig.create({
      data: { id: "default", name: "Mi Tienda" },
    });
  }
  return config;
}

export async function updateStoreConfig(data: ConfigInput) {
  await requireRole(["ADMIN"]);
  const validated = ConfigSchema.parse(data);

  const config = await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: {
      ...validated,
      logo: validated.logo || null,
      subtitle: validated.subtitle || null,
      address: validated.address || null,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      taxId: validated.taxId || null,
      ticketHeader: validated.ticketHeader || null,
      ticketFooter: validated.ticketFooter || null,
      loginBackground: validated.loginBackground || null,
    },
    create: {
      id: "default",
      ...validated,
      logo: validated.logo || null,
      subtitle: validated.subtitle || null,
      address: validated.address || null,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      taxId: validated.taxId || null,
      ticketHeader: validated.ticketHeader || null,
      ticketFooter: validated.ticketFooter || null,
      loginBackground: validated.loginBackground || null,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/ticket/[ticketNumber]", "page");
  revalidatePath("/");
  return config;
}
