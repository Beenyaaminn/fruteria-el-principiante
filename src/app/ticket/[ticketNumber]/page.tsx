import { notFound } from "next/navigation";
import { getSaleById, getStoreConfig } from "@/lib/actions/sales";
import { formatCLP, formatDateTime } from "@/lib/format";
import { TicketActions } from "./ticket-actions";

const paymentLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  CREDITO_CLIENTE: "Crédito cliente",
  MIXTO: "Mixto",
};

const unitLabels: Record<string, string> = {
  UNIDAD: "un",
  KILO: "kg",
  GRAMO: "g",
  LITRO: "L",
  PACK: "pack",
  CAJA: "cja",
  MANOJO: "manojo",
  MALLA: "malla",
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketNumber: string }>;
}) {
  const { ticketNumber } = await params;
  const num = parseInt(ticketNumber);
  if (isNaN(num)) notFound();

  const [allSales, config] = await Promise.all([
    // Búsqueda simple: por ticketNumber
    import("@/lib/prisma").then(async ({ prisma }) => {
      return prisma.sale.findFirst({
        where: { ticketNumber: num },
        include: {
          items: {
            include: { product: { select: { name: true, unit: true } } },
          },
          user: { select: { name: true } },
          customer: { select: { name: true } },
        },
      });
    }),
    getStoreConfig(),
  ]);

  const sale = allSales;
  if (!sale) notFound();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @page {
          margin: 0;
          size: 80mm auto;
        }
      `}</style>

      <div className="min-h-screen bg-muted/30 py-6 print:bg-white print:py-0">
        <TicketActions />

        <div className="max-w-xs mx-auto bg-white shadow-lg print:shadow-none p-4 font-mono text-xs leading-tight">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="font-bold text-base uppercase">
              {config?.name || "Frutería El Principiante"}
            </h1>
            {config?.address && <p className="text-[10px]">{config.address}</p>}
            {config?.phone && <p className="text-[10px]">Tel: {config.phone}</p>}
            {config?.taxId && <p className="text-[10px]">RUT: {config.taxId}</p>}
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Datos ticket */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>TICKET:</span>
              <span className="font-bold">#{sale.ticketNumber.toString().padStart(6, "0")}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>CAJERO:</span>
              <span>{sale.user.name}</span>
            </div>
            {sale.customer?.name && (
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
            {sale.customer?.name && (
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Items */}
          <div className="space-y-1">
            {sale.items.map((item) => (
              <div key={item.id} className="text-[11px]">
                <p className="font-semibold uppercase">{item.product.name}</p>
                <div className="flex justify-between">
                  <span>
                    {item.quantity} {unitLabels[item.product.unit] || item.product.unit} × {formatCLP(item.unitPrice)}
                  </span>
                  <span className="font-semibold">{formatCLP(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Totales */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>SUBTOTAL</span>
              <span>{formatCLP(sale.subtotal)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between">
                <span>DESCUENTO</span>
                <span>-{formatCLP(sale.discountTotal)}</span>
              </div>
            )}
            {sale.taxTotal > 0 && (
              <div className="flex justify-between">
                <span>IVA 19%</span>
                <span>{formatCLP(sale.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{formatCLP(sale.total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Pago */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>MÉTODO:</span>
              <span className="font-semibold">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
            </div>
            {sale.cashReceived != null && (
              <div className="flex justify-between">
                <span>RECIBIDO:</span>
                <span>{formatCLP(sale.cashReceived)}</span>
              </div>
            )}
            {sale.cashChange != null && sale.cashChange > 0 && (
              <div className="flex justify-between">
                <span>VUELTO:</span>
                <span className="font-semibold">{formatCLP(sale.cashChange)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Footer */}
          {config?.ticketHeader && (
            <p className="text-center text-[10px]">{config.ticketHeader}</p>
          )}
          {config?.ticketFooter && (
            <p className="text-center text-[10px] mt-1">{config.ticketFooter}</p>
          )}
          <p className="text-center text-[9px] mt-2 opacity-70">
            www.fruteriaelprincipiante.cl
          </p>
        </div>
      </div>
    </>
  );
}
