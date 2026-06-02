"use client";

import { Badge } from "@/components/ui/badge";
import { formatCLP, formatNumber } from "@/lib/format";

const unitLabels: Record<string, string> = {
  UNIDAD: "un", KILO: "kg", GRAMO: "g", LITRO: "L",
  PACK: "pack", CAJA: "cja", MANOJO: "manojo", MALLA: "malla",
};

export function TopProductsTable({
  data,
}: {
  data: {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sin ventas en el período</p>;
  }
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="divide-y">
      {data.map((p, idx) => (
        <div key={p.productId} className="p-4 hover:bg-muted/30">
          <div className="flex items-start gap-3">
            <Badge
              variant={idx < 3 ? "default" : "outline"}
              className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? "bg-yellow-500 text-white" :
                idx === 1 ? "bg-zinc-400 text-white" :
                idx === 2 ? "bg-amber-700 text-white" : ""
              }`}
            >
              {idx + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(p.quantity, 2)} {unitLabels[p.unit] || p.unit} vendidos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCLP(p.revenue)}</p>
                  <p className="text-xs text-green-600">+{formatCLP(p.profit)}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
