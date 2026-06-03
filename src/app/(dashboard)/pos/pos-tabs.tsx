"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "ventas", label: "Ventas" },
  { id: "creditos", label: "Créditos" },
  { id: "clientes", label: "Clientes" },
  { id: "productos", label: "Productos" },
  { id: "inventario", label: "Inventario" },
  { id: "compras", label: "Compras" },
  { id: "configuracion", label: "Configuración" },
  { id: "facturas", label: "Facturas" },
  { id: "corte", label: "Corte" },
  { id: "reportes", label: "Reportes" },
] as const;

export type TabId = (typeof tabs)[number]["id"];

export function POSTabs({
  ventasContent,
  productosContent,
  creditosContent,
  clientesContent,
  inventarioContent,
  activeTab,
  onTabChange,
}: {
  ventasContent: React.ReactNode;
  productosContent: React.ReactNode;
  creditosContent: React.ReactNode;
  clientesContent: React.ReactNode;
  inventarioContent: React.ReactNode;
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-2 px-3.5 text-sm font-semibold transition-colors relative whitespace-nowrap border-r border-border",
              activeTab === tab.id
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "ventas" && ventasContent}
        {activeTab === "productos" && productosContent}
        {activeTab === "creditos" && creditosContent}
        {activeTab === "clientes" && clientesContent}
        {activeTab === "inventario" && inventarioContent}
        {activeTab !== "ventas" && activeTab !== "productos" && activeTab !== "creditos" && activeTab !== "clientes" && activeTab !== "inventario" && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-xl font-semibold mb-1">{tabs.find((t) => t.id === activeTab)?.label}</p>
              <p className="text-sm">Próximamente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
