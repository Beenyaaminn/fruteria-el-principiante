import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "SUPERVISOR" | "CAJERO" | "BODEGUERO";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  return user;
});

export async function requireRole(allowedRoles: Role[]) {
  const session = await verifySession();
  if (!allowedRoles.includes(session.role as Role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return session;
}

export function hasRole(role: string | undefined, allowed: Role[]) {
  if (!role) return false;
  return allowed.includes(role as Role);
}
