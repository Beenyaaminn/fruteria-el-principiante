"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { toast } from "sonner";

type SupplierData = {
  id?: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
};

export function SupplierForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: SupplierData;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SupplierData>(
    initialData || {
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
    }
  );

  function update<K extends keyof SupplierData>(key: K, value: SupplierData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        await createSupplier(form);
        toast.success("Proveedor creado");
      } else {
        await updateSupplier(form.id!, form);
        toast.success("Proveedor actualizado");
      }
      router.push("/proveedores");
    } catch (err: any) {
      setError(err.message || "Error");
      toast.error(err.message || "Error");
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
          <CardTitle className="text-base">Datos del proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Persona de contacto</Label>
            <Input id="contactName" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button asChild variant="outline" type="button">
          <Link href="/proveedores">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === "create" ? "Crear proveedor" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
