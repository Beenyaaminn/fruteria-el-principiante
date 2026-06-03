import { LoginForm } from "./login-form";
import { Apple, Cherry, Grape, Leaf } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Lado izquierdo - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-emerald-700 p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10">
            <Apple className="h-32 w-32" />
          </div>
          <div className="absolute top-40 right-20">
            <Cherry className="h-24 w-24" />
          </div>
          <div className="absolute bottom-32 left-20">
            <Grape className="h-28 w-28" />
          </div>
          <div className="absolute bottom-10 right-10">
            <Leaf className="h-20 w-20" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <Apple className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Frutería El Principiante</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Sistema Punto de Venta
          </h2>
          <p className="text-lg text-primary-foreground/90">
            Administra tu frutería, controla el inventario de tus 2 bodegas,
            gestiona ventas y emite tickets profesionales.
          </p>
          <div className="flex flex-wrap gap-2 pt-4">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              Ventas rápidas
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              Stock en tiempo real
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              Tickets profesionales
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              Reportes y estadísticas
            </span>
          </div>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} Frutería El Principiante
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary p-2">
              <Apple className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Frutería El Principiante</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
