import { notFound } from "next/navigation";
import { getProductById } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { ProductForm } from "../product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    categoryId: product.categoryId,
    unit: product.unit as any,
    priceCost: product.priceCost,
    priceSale: product.priceSale,
    priceWholesale: product.priceWholesale || undefined,
    wholesaleMinQty: product.wholesaleMinQty || undefined,
    taxRate: product.taxRate,
    minStock: product.minStock,
    maxStock: product.maxStock || undefined,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar producto</h1>
        <p className="text-muted-foreground">
          Modifica los datos del producto
        </p>
      </div>
      <ProductForm categories={categories} initialData={initialData} mode="edit" />
    </div>
  );
}
