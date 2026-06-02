"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCLP, formatDate } from "@/lib/format";

export function SalesChart({ data }: { data: { date: string; total: number; count: number; cash: number; card: number; transfer: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sin datos en el período</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d)}
          className="text-xs"
          stroke="currentColor"
        />
        <YAxis
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
          className="text-xs"
          stroke="currentColor"
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const d = payload[0].payload as { total: number; count: number; cash: number; card: number; transfer: number };
            return (
              <div className="rounded-lg border border-border bg-background p-2 text-xs shadow-md">
                <p className="font-semibold mb-1">{formatDate(String(label))}</p>
                <p>Total: <span className="font-semibold text-primary">{formatCLP(d.total)}</span></p>
                <p className="text-muted-foreground">{d.count} ventas</p>
                <div className="border-t mt-1 pt-1 text-muted-foreground">
                  <p>Efectivo: {formatCLP(d.cash)}</p>
                  <p>Tarjeta: {formatCLP(d.card)}</p>
                  <p>Transferencia: {formatCLP(d.transfer)}</p>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="total" fill="oklch(0.55 0.18 145)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
