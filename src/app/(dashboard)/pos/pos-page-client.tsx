"use client";

import { useState } from "react";
import { POSClient } from "./pos-client";
import { ProductosTab } from "./productos-tab";
import { POSTabs, TabId } from "./pos-tabs";

type POSProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  price: number;
  priceWholesale?: number | null;
  wholesaleMinQty?: number | null;
  taxRate: number;
  totalStock: number;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
  wholesaleMinQty?: number | null;
  taxRate: number;
  minStock: number;
  maxStock?: number | null;
  totalStock: number;
};

type Category = { id: string; name: string; description?: string | null; _count?: { products: number } };
type Customer = { id: string; name: string; balance: number };

export function POSPageClient({
  posProducts,
  allProducts,
  categories,
  customers,
  cashSession,
}: {
  posProducts: POSProduct[];
  allProducts: Product[];
  categories: Category[];
  customers: Customer[];
  cashSession: { id: string; openAmount: number; openedAt: string } | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("ventas");

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 lg:-m-8 h-[calc(100dvh-3rem)] md:h-[calc(100dvh-4rem)] pb-12 lg:pb-0">
      <POSTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ventasContent={
          <POSClient
            products={posProducts}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            customers={customers}
            cashSession={cashSession}
          />
        }
        productosContent={
          <ProductosTab products={allProducts} categories={categories} />
        }
      />
    </div>
  );
}
