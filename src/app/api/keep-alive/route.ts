import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("db unreachable", { status: 500 });
  }
}
