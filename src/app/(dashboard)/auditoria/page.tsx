import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollText, User, Filter, X } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/audit";
import { getUsers } from "@/lib/actions/users";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const actionConfig: Record<string, { label: string; className: string }> = {
  CREATE: { label: "Creación", className: "bg-green-500/10 text-green-700" },
  UPDATE: { label: "Modificación", className: "bg-blue-500/10 text-blue-700" },
  TOGGLE_ACTIVE: { label: "Activación", className: "bg-orange-500/10 text-orange-700" },
  CANCEL: { label: "Cancelación", className: "bg-destructive/10 text-destructive" },
  RECEIVE: { label: "Recepción", className: "bg-purple-500/10 text-purple-700" },
};

const entityLabels: Record<string, string> = {
  User: "Usuario",
  Purchase: "Compra",
  Sale: "Venta",
  Product: "Producto",
  Customer: "Cliente",
  Warehouse: "Bodega",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; userId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [data, users] = await Promise.all([
    getAuditLogs({
      action: params.action,
      entity: params.entity,
      userId: params.userId,
      page: parseInt(params.page || "1"),
    }),
    getUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-primary" />
          Auditoría
        </h1>
        <p className="text-muted-foreground">Registro de todas las operaciones del sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Acción</label>
              <select name="action" defaultValue={params.action || ""} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Todas</option>
                {Object.entries(actionConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Entidad</label>
              <select name="entity" defaultValue={params.entity || ""} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Todas</option>
                {Object.entries(entityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Usuario</label>
              <select name="userId" defaultValue={params.userId || ""} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">Aplicar</Button>
            {(params.action || params.entity || params.userId) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/auditoria">
                  <X className="mr-1 h-3 w-3" />
                  Limpiar
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.total} eventos registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">Sin eventos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => {
                    const action = actionConfig[log.action];
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          {action && <Badge className={action.className}>{action.label}</Badge>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {entityLabels[log.entity] || log.entity}
                          </span>
                          {log.entityId && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.entityId.slice(0, 12)}...
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {log.details || "—"}
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

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              asChild
              variant={p === data.page ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={{
                  pathname: "/auditoria",
                  query: { ...params, page: p.toString() },
                }}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
