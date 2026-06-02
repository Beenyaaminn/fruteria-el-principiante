"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCLP } from "@/lib/format";

const COLORS: Record<string, string> = {
  EFECTIVO: "#16a34a",
  DEBITO: "#3b82f6",
  CREDITO: "#a855f7",
  TRANSFERENCIA: "#f97316",
  CREDITO_CLIENTE: "#ec4899",
  MIXTO: "#6b7280",
};

const LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  CREDITO_CLIENTE: "Crédito cliente",
  MIXTO: "Mixto",
};

export function PaymentMethodsChart({ data }: { data: { method: string; count: number; total: number }[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sin datos en el período</p>;
  }
  const filtered = data.filter((d) => d.count > 0);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="total"
          nameKey="method"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ method, percent }) => `${LABELS[method as string] || method} ${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {filtered.map((entry) => (
            <Cell key={entry.method} fill={COLORS[entry.method] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border border-border bg-background p-2 text-xs shadow-md">
                <p className="font-semibold">{LABELS[d.method] || d.method}</p>
                <p>Total: <span className="font-semibold text-primary">{formatCLP(d.total)}</span></p>
                <p className="text-muted-foreground">{d.count} ventas</p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
