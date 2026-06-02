import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getCustomers } from "@/lib/actions/customers";
import { POSClient } from "./pos-client";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const [products, categories, customers] = await Promise.all([
    getProducts(),
    getCategories(),
    getCustomers(),
  ]);

  // Solo datos necesarios para el POS (optimizar payload)
  const posProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    unit: p.unit,
    price: p.priceSale,
    totalStock: p.totalStock,
  }));

  return (
    <POSClient
      products={posProducts}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, balance: c.balance }))}
    />
  );
}
