"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Receipt, Calculator, Save, Loader2, AlertCircle } from "lucide-react";
import { updateStoreConfig, type ConfigInput } from "@/lib/actions/settings";
import { toast } from "sonner";

export function ConfigForm({ initialData }: { initialData: ConfigInput }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ConfigInput>(initialData);

  function update<K extends keyof ConfigInput>(key: K, value: ConfigInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateStoreConfig(form);
      toast.success("Configuración guardada");
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
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Datos de la empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del negocio *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxId">RUT / NIF</Label>
              <Input
                id="taxId"
                value={form.taxId || ""}
                onChange={(e) => update("taxId", e.target.value)}
                placeholder="12.345.678-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address || ""}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                value={form.website || ""}
                onChange={(e) => update("website", e.target.value)}
                placeholder="www.mitienda.cl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Moneda e impuestos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Código moneda</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currencySymbol">Símbolo</Label>
              <Input
                id="currencySymbol"
                value={form.currencySymbol}
                onChange={(e) => update("currencySymbol", e.target.value)}
                maxLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ivaRate">Tasa IVA (%)</Label>
              <Input
                id="ivaRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.ivaRate}
                onChange={(e) => update("ivaRate", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Ticket de venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ticketHeader">Encabezado del ticket</Label>
            <Textarea
              id="ticketHeader"
              value={form.ticketHeader || ""}
              onChange={(e) => update("ticketHeader", e.target.value)}
              rows={2}
              placeholder="¡Gracias por su compra!"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticketFooter">Pie del ticket</Label>
            <Textarea
              id="ticketFooter"
              value={form.ticketFooter || ""}
              onChange={(e) => update("ticketFooter", e.target.value)}
              rows={2}
              placeholder="Vuelva pronto"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
