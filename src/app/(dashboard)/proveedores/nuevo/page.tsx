import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";
import { SupplierForm } from "../supplier-form";

export default function NuevoProveedorPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/proveedores">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-7 w-7 text-primary" />
          Nuevo proveedor
        </h1>
      </div>
      <SupplierForm mode="create" />
    </div>
  );
}
