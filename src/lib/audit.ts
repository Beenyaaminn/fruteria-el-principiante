import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details },
    });
  } catch (err) {
    // No fallar la operación principal por un error de auditoría
    console.error("Error creando audit log:", err);
  }
}
