import { NextRequest, NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/session";

const protectedRoutes = [
  "/dashboard",
  "/pos",
  "/ventas",
  "/inventario",
  "/bodegas",
  "/compras",
  "/proveedores",
  "/clientes",
  "/reportes",
  "/cierre-caja",
  "/usuarios",
  "/configuracion",
  "/auditoria",
];
const publicRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(
    (r) => path === r || path.startsWith(r + "/")
  );
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  // Redirigir a login si no hay sesión en rutas protegidas
  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL("/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Redirigir a dashboard si ya hay sesión en rutas públicas
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirigir raíz al destino correcto
  if (path === "/") {
    if (session?.userId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
