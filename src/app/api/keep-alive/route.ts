import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$transaction([
      prisma.$queryRaw`SELECT 1`,
      prisma.user.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.category.count({ where: { active: true } }),
    ]);
    return Response.json({ status: "ok", time: new Date().toISOString() });
  } catch {
    return new Response("db unreachable", { status: 500 });
  }
}
