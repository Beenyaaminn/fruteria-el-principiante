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
import { Plus, UserCog, Users, Receipt, Calculator, Shield } from "lucide-react";
import { getUsers } from "@/lib/actions/users";
import { formatDateTime } from "@/lib/format";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

const roleConfig: Record<string, { label: string; className: string; icon: any }> = {
  ADMIN: { label: "Administrador", className: "bg-red-500/10 text-red-700 border-red-500/20", icon: Shield },
  SUPERVISOR: { label: "Supervisor", className: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Shield },
  CAJERO: { label: "Cajero", className: "bg-green-500/10 text-green-700 border-green-500/20", icon: Calculator },
  BODEGUERO: { label: "Bodeguero", className: "bg-orange-500/10 text-orange-700 border-orange-500/20", icon: UserCog },
};

export default async function UsuariosPage() {
  const users = await getUsers();

  const active = users.filter((u) => u.active).length;
  const admins = users.filter((u) => u.role === "ADMIN" && u.active).length;
  const cashiers = users.filter((u) => u.role === "CAJERO" && u.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            {users.length} usuarios · {active} activos
          </p>
        </div>
        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total usuarios</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2"><Shield className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold">{admins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Calculator className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Cajeros</p>
              <p className="text-2xl font-bold">{cashiers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Ventas</TableHead>
                <TableHead className="text-center">Turnos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const role = roleConfig[u.role] || roleConfig.CAJERO;
                const Icon = role.icon;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      {u.pin && <p className="text-xs text-muted-foreground">PIN: ****</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={role.className}>
                        <Icon className="mr-1 h-3 w-3" />
                        {role.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{u._count.sales}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{u._count.cashSessions}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={u.active ? "bg-green-500/10 text-green-700" : "bg-muted"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <UserActions userId={u.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
