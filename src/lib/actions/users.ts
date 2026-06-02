"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createAuditLog } from "@/lib/audit";

const UserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  pin: z.string().regex(/^\d{4}$/, "PIN debe ser 4 dígitos").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"]),
});

export type UserInput = z.infer<typeof UserSchema>;

export async function getUsers() {
  const session = await verifySession();
  if (session.role !== "ADMIN") throw new Error("Solo administradores");

  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sales: true, cashSessions: true } },
    },
  });
}

export async function getUserById(id: string) {
  const session = await verifySession();
  if (session.role !== "ADMIN") throw new Error("Solo administradores");
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: UserInput) {
  const session = await verifySession();
  if (session.role !== "ADMIN") throw new Error("Solo administradores");

  const validated = UserSchema.parse(data);
  if (!validated.password) throw new Error("Contraseña es obligatoria para nuevos usuarios");

  const hashed = await bcrypt.hash(validated.password, 10);
  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashed,
      role: validated.role,
      pin: validated.pin || null,
    },
  });

  await createAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    details: `Creó usuario ${user.email} (${user.role})`,
  });

  revalidatePath("/usuarios");
  return user;
}

export async function updateUser(id: string, data: UserInput) {
  const session = await verifySession();
  if (session.role !== "ADMIN") throw new Error("Solo administradores");

  const validated = UserSchema.parse(data);

  const updateData: any = {
    name: validated.name,
    email: validated.email,
    role: validated.role,
    pin: validated.pin || null,
  };
  if (validated.password) {
    updateData.password = await bcrypt.hash(validated.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  await createAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    details: `Actualizó usuario ${user.email}`,
  });

  revalidatePath("/usuarios");
  return user;
}

export async function toggleUserActive(id: string) {
  const session = await verifySession();
  if (session.role !== "ADMIN") throw new Error("Solo administradores");
  if (id === session.userId) throw new Error("No puedes desactivarte a ti mismo");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Usuario no encontrado");

  const updated = await prisma.user.update({
    where: { id },
    data: { active: !user.active },
  });

  await createAuditLog({
    userId: session.userId,
    action: "TOGGLE_ACTIVE",
    entity: "User",
    entityId: user.id,
    details: `${updated.active ? "Activó" : "Desactivó"} usuario ${user.email}`,
  });

  revalidatePath("/usuarios");
  return updated;
}
