"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCLP } from "@/lib/format";

const COLORS = ["#16a34a", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#06b6d4", "#eab308", "#6b7280"];

export function CategoryValuationChart({
  data,
}: {
  data: { name: string; valueCost: number; valueSale: number; units: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sin stock</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
          className="text-xs"
          stroke="currentColor"
        />
        <YAxis
          type="category"
          dataKey="name"
          className="text-xs"
          stroke="currentColor"
          width={100}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border border-border bg-background p-2 text-xs shadow-md">
                <p className="font-semibold mb-1">{d.name}</p>
                <p>A costo: <span className="font-semibold">{formatCLP(d.valueCost)}</span></p>
                <p>A venta: <span className="font-semibold text-primary">{formatCLP(d.valueSale)}</span></p>
                <p className="text-muted-foreground">{d.units} unidades</p>
              </div>
            );
          }}
        />
        <Bar dataKey="valueCost" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
