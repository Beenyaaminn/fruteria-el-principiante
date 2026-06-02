import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Truck, Mail, Phone, MapPin, Eye } from "lucide-react";
import { getSuppliers } from "@/lib/actions/suppliers";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">{suppliers.length} proveedores activos</p>
        </div>
        <Button asChild>
          <Link href="/proveedores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proveedor
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay proveedores</p>
              <Button asChild className="mt-4">
                <Link href="/proveedores/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer proveedor
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {s.contactName && <p className="text-xs text-muted-foreground">{s.contactName}</p>}
                  </div>
                  <Button asChild size="icon-sm" variant="ghost">
                    <Link href={`/proveedores/${s.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-1.5 text-sm">
                  {s.phone && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {s.phone}
                    </p>
                  )}
                  {s.email && (
                    <p className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Mail className="h-3 w-3" /> {s.email}
                    </p>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-2 text-muted-foreground text-xs">
                      <MapPin className="h-3 w-3" /> {s.address}
                    </p>
                  )}
                </div>
                <Badge variant="outline">{s._count.purchases} compras</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
