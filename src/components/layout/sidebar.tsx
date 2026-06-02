"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Receipt,
  Truck,
  UserCog,
  Settings,
  ScrollText,
  Calculator,
  BarChart3,
  LogOut,
  Apple,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/dal";
import { logoutAction } from "@/lib/logout-action";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string;
  shortcut?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"],
      },
      {
        href: "/pos",
        label: "Punto de Venta",
        icon: ShoppingCart,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO"],
        badge: "POS",
        shortcut: "F1",
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      {
        href: "/cierre-caja",
        label: "Cierre de Caja",
        icon: Calculator,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO"],
        shortcut: "F2",
      },
      {
        href: "/ventas",
        label: "Ventas",
        icon: Receipt,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO"],
      },
      {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO"],
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      {
        href: "/inventario",
        label: "Productos",
        icon: Package,
        roles: ["ADMIN", "SUPERVISOR", "CAJERO", "BODEGUERO"],
      },
      {
        href: "/bodegas",
        label: "Bodegas",
        icon: Warehouse,
        roles: ["ADMIN", "SUPERVISOR", "BODEGUERO"],
      },
      {
        href: "/compras",
        label: "Compras",
        icon: Truck,
        roles: ["ADMIN", "SUPERVISOR", "BODEGUERO"],
      },
      {
        href: "/proveedores",
        label: "Proveedores",
        icon: Truck,
        roles: ["ADMIN", "SUPERVISOR", "BODEGUERO"],
      },
    ],
  },
  {
    title: "Análisis",
    items: [
      {
        href: "/reportes",
        label: "Reportes",
        icon: BarChart3,
        roles: ["ADMIN", "SUPERVISOR"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        href: "/usuarios",
        label: "Usuarios",
        icon: UserCog,
        roles: ["ADMIN"],
      },
      {
        href: "/configuracion",
        label: "Configuración",
        icon: Settings,
        roles: ["ADMIN"],
      },
      {
        href: "/auditoria",
        label: "Auditoría",
        icon: ScrollText,
        roles: ["ADMIN"],
      },
    ],
  },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="rounded-lg bg-primary p-1.5">
          <Apple className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight">Frutería</span>
          <span className="text-xs text-sidebar-foreground/70 leading-tight">
            El Principiante
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role as Role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-6">
              <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="default"
                          className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.shortcut && !isActive && (
                        <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-sidebar-border bg-sidebar px-1.5 text-[10px] font-mono text-sidebar-foreground/60">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
