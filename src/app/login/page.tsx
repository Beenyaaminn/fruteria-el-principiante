import { LoginForm } from "./login-form";
import { Apple, Cherry, Grape, Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const config = await prisma.storeConfig.findUnique({ where: { id: "default" } });
  const storeName = config?.name || "Frutería";
  const storeSubtitle = config?.subtitle || "El Principiante";
  const logoUrl = config?.logo;
  const bgStyleValue = config?.loginBackground || undefined;
  const isBgUrl = bgStyleValue?.startsWith("http");

  const bgClasses = !bgStyleValue
    ? "bg-gradient-to-br from-primary via-primary to-emerald-700"
    : "";
  const bgInline = bgStyleValue
    ? isBgUrl
      ? { backgroundImage: `url(${bgStyleValue})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }
      : { background: bgStyleValue }
    : {};

  const formBg = bgStyleValue ? "bg-background/95 backdrop-blur-sm lg:bg-background lg:backdrop-blur-none" : "bg-background";

  return (
    <div className={`min-h-screen w-full flex items-center justify-center lg:grid lg:grid-cols-2 relative ${bgClasses}`} style={bgInline}>
      {/* Overlay for background readability */}
      {bgStyleValue && <div className="absolute inset-0 bg-black/30 lg:hidden" />}

      {/* Mobile branding strip */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-10 p-4 flex items-center gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} crossOrigin="anonymous" className="h-10 w-10 object-cover rounded-lg bg-white/20 p-1 backdrop-blur-sm" />
          ) : (
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <Apple className="h-6 w-6" />
            </div>
          )}
          <div className="drop-shadow-sm">
            <h1 className="text-lg font-bold leading-tight text-white">{storeName}</h1>
            {storeSubtitle && <p className="text-xs text-white/70">{storeSubtitle}</p>}
          </div>
        </div>
      </div>

      {/* Lado izquierdo - Branding (desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        {!bgStyleValue && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10"><Apple className="h-32 w-32" /></div>
            <div className="absolute top-40 right-20"><Cherry className="h-24 w-24" /></div>
            <div className="absolute bottom-32 left-20"><Grape className="h-28 w-28" /></div>
            <div className="absolute bottom-10 right-10"><Leaf className="h-20 w-20" /></div>
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} crossOrigin="anonymous" className="h-10 w-10 object-cover rounded-lg" />
            ) : (
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                <Apple className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold leading-tight">{storeName}</h1>
              {storeSubtitle && <p className="text-sm text-primary-foreground/70">{storeSubtitle}</p>}
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Sistema Punto de Venta</h2>
          <p className="text-lg text-primary-foreground/90">
            Administra tu frutería, controla el inventario, gestiona ventas y emite tickets profesionales.
          </p>
          <div className="flex flex-wrap gap-2 pt-4">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">Ventas rápidas</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">Stock en tiempo real</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">Tickets profesionales</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">Reportes y estadísticas</span>
          </div>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} {storeName}
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className={`relative z-10 w-full max-w-md mx-auto p-6 sm:p-10 rounded-xl lg:rounded-none ${formBg} lg:h-full lg:flex lg:items-center lg:justify-center`}>
        <div className="w-full space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} crossOrigin="anonymous" className="h-20 w-20 object-contain rounded-xl" />
              ) : (
                <div className="rounded-xl bg-primary p-4">
                  <Apple className="h-12 w-12 text-primary-foreground" />
                </div>
              )}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
