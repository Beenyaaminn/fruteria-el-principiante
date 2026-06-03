import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getCustomers } from "@/lib/actions/customers";
import { getCurrentCashSession } from "@/lib/actions/cash-sessions";
import { POSPageClient } from "./pos-page-client";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  let products, categories, customers;
  let cashSession: { openAmount: number; openedAt: string } | null = null;

  try {
    [products, categories, customers] = await Promise.all([
      getProducts(),
      getCategories(),
      getCustomers(),
    ]);
  } catch (err: any) {
    throw new Error("Error al cargar datos del POS: " + (err.message || "error desconocido"));
  }

  try {
    const session = await getCurrentCashSession();
    if (session) {
      cashSession = {
        openAmount: session.openAmount,
        openedAt: session.openedAt instanceof Date
          ? session.openedAt.toISOString()
          : String(session.openedAt),
      };
    }
  } catch (err: any) {
    // Si falla la sesión de caja, permitimos que el POS funcione igual
    // El frontend mostrará el bloqueo
    console.error("Error al verificar caja:", err.message);
    cashSession = null;
  }

  const posProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    unit: p.unit,
    price: p.priceSale,
    taxRate: p.taxRate,
    totalStock: p.totalStock,
  }));

  return (
    <POSPageClient
      posProducts={posProducts}
      allProducts={products}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        _count: c._count,
      }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, balance: c.balance }))}
      cashSession={cashSession}
    />
  );
}
