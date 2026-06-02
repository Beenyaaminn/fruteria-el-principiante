import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Tags, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { getCategories } from "@/lib/actions/categories";
import { CategoryActions } from "./category-actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/inventario">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a inventario
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Tags className="h-7 w-7 text-primary" />
              Categorías
            </h1>
            <p className="text-muted-foreground">
              Organiza tus productos por categorías
            </p>
          </div>
          <CategoryActions mode="create" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Tags className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay categorías</p>
              <div className="mt-4">
                <CategoryActions mode="create" />
              </div>
            </CardContent>
          </Card>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    {cat.description && (
                      <CardDescription className="mt-1">
                        {cat.description}
                      </CardDescription>
                    )}
                  </div>
                  <CategoryActions
                    mode="edit"
                    category={{
                      id: cat.id,
                      name: cat.name,
                      description: cat.description || "",
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  {cat._count.products} productos
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
