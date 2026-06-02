"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, AlertCircle, Info } from "lucide-react";
import { createUser, updateUser } from "@/lib/actions/users";
import { toast } from "sonner";

type UserData = {
  id?: string;
  name: string;
  email: string;
  password: string;
  pin: string;
  role: "ADMIN" | "SUPERVISOR" | "CAJERO" | "BODEGUERO";
};

const roles = [
  { value: "ADMIN", label: "Administrador", desc: "Control total del sistema" },
  { value: "SUPERVISOR", label: "Supervisor", desc: "Reportes, ventas, anulaciones" },
  { value: "CAJERO", label: "Cajero", desc: "POS, ventas, cierre de caja" },
  { value: "BODEGUERO", label: "Bodeguero", desc: "Inventario, bodegas, mermas" },
];

export function UserForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: UserData;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UserData>(
    initialData || {
      name: "",
      email: "",
      password: "",
      pin: "",
      role: "CAJERO",
    }
  );

  function update<K extends keyof UserData>(key: K, value: UserData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        if (!form.password) {
          setError("La contraseña es obligatoria");
          setSubmitting(false);
          return;
        }
        await createUser(form);
        toast.success("Usuario creado");
      } else {
        await updateUser(form.id!, form);
        toast.success("Usuario actualizado");
      }
      router.push("/usuarios");
    } catch (err: any) {
      setError(err.message || "Error al guardar");
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">
                Contraseña {mode === "edit" && <span className="text-xs text-muted-foreground">(dejar vacía para no cambiar)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                minLength={6}
                required={mode === "create"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN (4 dígitos, login rápido)</Label>
              <Input
                id="pin"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={form.pin}
                onChange={(e) => update("pin", e.target.value)}
                placeholder="0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rol del usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => {
              const selected = form.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update("role", r.value as any)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/usuarios">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
