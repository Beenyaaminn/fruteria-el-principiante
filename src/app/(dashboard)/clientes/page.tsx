import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  CreditCard,
  Eye,
  TrendingUp,
} from "lucide-react";
import { getCustomers } from "@/lib/actions/customers";
import { formatCLP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers(params.q);

  const totalDebt = customers.reduce((sum, c) => sum + c.balance, 0);
  const withDebt = customers.filter((c) => c.balance > 0).length;
  const overLimit = customers.filter((c) => c.creditLimit && c.balance > (c.creditLimit || 0)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            {customers.length} clientes · {withDebt} con deuda · Deuda total: {formatCLP(totalDebt)}
          </p>
        </div>
        <Button asChild>
          <Link href="/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      {overLimit > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-destructive" />
            <p className="text-sm">
              <strong>{overLimit} clientes</strong> han sobrepasado su límite de crédito.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtro */}
      <Card>
        <CardContent className="p-4">
          <form>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={params.q}
                placeholder="Buscar por nombre, teléfono o email..."
                className="pl-10"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay clientes</p>
              <Button asChild className="mt-4">
                <Link href="/clientes/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer cliente
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Límite</TableHead>
                    <TableHead className="text-right">Deuda</TableHead>
                    <TableHead className="text-center">Ventas</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => {
                    const isOverLimit = c.creditLimit && c.balance > (c.creditLimit || 0);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium">{c.name}</p>
                          {c.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {c.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.phone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {c.phone}
                            </p>
                          )}
                          {c.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {c.creditLimit ? formatCLP(c.creditLimit) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.balance > 0 ? (
                            <Badge variant={isOverLimit ? "destructive" : "default"} className={!isOverLimit ? "bg-orange-500/10 text-orange-700" : ""}>
                              {formatCLP(c.balance)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">$0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{c._count.sales}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button asChild size="icon-sm" variant="ghost">
                            <Link href={`/clientes/${c.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
