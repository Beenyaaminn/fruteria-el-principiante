"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, BellOff, Search, User as UserIcon, LogOut, AlertTriangle, Package, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/actions";
import { getProducts } from "@/lib/actions/products";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
} | null;

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  SUPERVISOR: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  CAJERO: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  BODEGUERO: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  CAJERO: "Cajero",
  BODEGUERO: "Bodeguero",
};

export function Header({ user }: { user: User }) {
  const [time, setTime] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<{ name: string; stock: number; minStock: number; unit: string }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Reloj
  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar alertas de stock bajo
  useEffect(() => {
    async function loadAlerts() {
      try {
        const products = await getProducts();
        const low = products
          .filter((p) => p.totalStock <= p.minStock)
          .map((p) => ({
            name: p.name,
            stock: p.totalStock,
            minStock: p.minStock,
            unit: p.unit,
          }))
          .slice(0, 10);
        setAlerts(low);
      } catch {}
    }
    loadAlerts();
  }, []);

  // Clic fuera - cierra dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos, ventas, clientes..."
            className="pl-10 h-9 bg-muted/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-mono">{time}</span>
        </div>

        {/* Notificaciones */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors"
          >
            {alerts.length > 0 ? (
              <>
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                  {alerts.length}
                </span>
              </>
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-popover shadow-lg">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Alertas de stock bajo
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Todo en orden</p>
                    <p className="text-xs mt-1">No hay productos con stock bajo</p>
                  </div>
                ) : (
                  <div>
                    {alerts.map((a) => (
                      <Link
                        key={a.name}
                        href={`/bodegas/entradas?producto=${encodeURIComponent(a.name)}`}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock: {a.stock} / mín: {a.minStock}
                          </p>
                        </div>
                        <Badge
                          variant={a.stock <= 0 ? "destructive" : "outline"}
                          className={a.stock > 0 ? "bg-orange-500/10 text-orange-700 shrink-0 ml-2" : "shrink-0 ml-2"}
                        >
                          {a.stock <= 0 ? "Agotado" : "Bajo"}
                        </Badge>
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {alerts.length > 0 && (
                <>
                  <Separator />
                  <div className="p-1">
                    <Link
                      href="/inventario"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-muted transition-colors"
                    >
                      Ver inventario completo
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium leading-tight">
                {user?.name || "Usuario"}
              </span>
              {user?.role && (
                <Badge
                  variant="outline"
                  className={`h-4 px-1 text-[10px] ${roleColors[user.role] || ""}`}
                >
                  {roleLabels[user.role] || user.role}
                </Badge>
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-popover shadow-lg">
              <div className="p-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Separator />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Mi perfil
                </button>
              </div>
              <Separator />
              <div className="p-1">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
