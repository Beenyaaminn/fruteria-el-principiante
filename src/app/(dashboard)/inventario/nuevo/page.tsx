import { getCategories } from "@/lib/actions/categories";
import { ProductForm } from "../product-form";

export default async function NuevoProductoPage() {
  const categories = await getCategories();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo producto</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo producto al catálogo
        </p>
      </div>
      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
