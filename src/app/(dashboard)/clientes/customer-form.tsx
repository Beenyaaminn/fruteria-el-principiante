"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { toast } from "sonner";

type CustomerData = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number | null;
  creditDays: number | null;
  notes: string;
};

export function CustomerForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: CustomerData;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CustomerData>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
      creditLimit: null,
      creditDays: 30,
      notes: "",
    }
  );

  function update<K extends keyof CustomerData>(key: K, value: CustomerData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        await createCustomer(form);
        toast.success("Cliente creado");
      } else {
        await updateCustomer(form.id!, form);
        toast.success("Cliente actualizado");
      }
      router.push("/clientes");
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
          <CardTitle className="text-base">Datos del cliente</CardTitle>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Línea de crédito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Límite de crédito</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="any"
                value={form.creditLimit ?? ""}
                onChange={(e) =>
                  update("creditLimit", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="Sin límite"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditDays">Días de crédito</Label>
              <Input
                id="creditDays"
                type="number"
                min="0"
                value={form.creditDays ?? ""}
                onChange={(e) =>
                  update("creditDays", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="0 = sin plazo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/clientes">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === "create" ? "Crear cliente" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
