"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export async function getAuditLogs({
  page = 1,
  pageSize = 30,
  action,
  entity,
  userId,
}: {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
} = {}) {
  await requireRole(["ADMIN"]);

  const where: any = {};
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
