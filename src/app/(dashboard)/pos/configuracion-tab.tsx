"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Store, Ticket, CreditCard, DollarSign, Printer, QrCode, Monitor, Scale, Database, Upload, Shield, RefreshCw,
  Loader2, Save, User, Hash,
} from "lucide-react";
import { formatCLP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getStoreConfig, updateStoreConfig } from "@/lib/actions/settings";

type SubTab = "general" | "personalizacion" | "dispositivos" | "mantenimiento";

const SUB_TABS: { id: SubTab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "personalizacion", label: "Personalización", icon: Store },
  { id: "dispositivos", label: "Dispositivos", icon: Printer },
  { id: "mantenimiento", label: "Mantenimiento", icon: Shield },
];

export function ConfiguracionTab() {
  const [subTab, setSubTab] = useState<SubTab>("general");
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({});

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const c = await getStoreConfig();
      setConfig(c);
      setForm({
        name: c.name || "", logo: c.logo || "", address: c.address || "",
        phone: c.phone || "", email: c.email || "", website: c.website || "",
        taxId: c.taxId || "", currency: c.currency || "CLP",
        currencySymbol: c.currencySymbol || "$",
        ticketHeader: c.ticketHeader || "", ticketFooter: c.ticketFooter || "",
        ivaRate: c.ivaRate || 19, lowStockAlert: c.lowStockAlert ?? true,
      });
    } catch (err: any) { toast.error("Error al cargar configuración"); }
    finally { setLoading(false); }
  }

  function update(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    try {
      await updateStoreConfig({
        name: form.name, logo: form.logo || null, address: form.address || null,
        phone: form.phone || null, email: form.email || null, website: form.website || null,
        taxId: form.taxId || null, currency: form.currency, currencySymbol: form.currencySymbol,
        ticketHeader: form.ticketHeader || null, ticketFooter: form.ticketFooter || null,
        ivaRate: form.ivaRate, lowStockAlert: form.lowStockAlert,
      });
      toast.success("Configuración guardada"); loadConfig();
    } catch (err: any) { toast.error(err.message || "Error al guardar"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={cn(
              "py-2 px-3 text-xs font-semibold transition-colors relative whitespace-nowrap border-r border-border flex items-center gap-1.5",
              subTab === t.id ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}>
              <Icon className="h-3.5 w-3.5" />{t.label}
              {subTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {subTab === "general" && (
          <div className="max-w-lg space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4" />Opciones generales</h2>
            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Datos de la tienda</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5"><Label>Nombre de la tienda *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Sitio web</Label><Input value={form.website} onChange={(e) => update("website", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Opciones habilitadas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Alertas de stock bajo</p><p className="text-xs text-muted-foreground">Recibir alertas cuando el stock esté bajo el mínimo</p></div>
                  <Switch checked={form.lowStockAlert} onCheckedChange={(v) => update("lowStockAlert", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">IVA</p></div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" value={form.ivaRate} onChange={(e) => update("ivaRate", parseFloat(e.target.value) || 0)} className="w-20 h-7 text-sm" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4" />Modificar folios</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Los folios se generan automáticamente de forma secuencial. No se requiere modificación manual.</p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Cajeros</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Administra los usuarios y roles desde la sección <strong>Usuarios</strong> en el menú lateral.</p>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar configuración</>}
            </Button>
          </div>
        )}

        {subTab === "personalizacion" && (
          <div className="max-w-lg space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4" />Personalización</h2>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Logotipo</CardTitle><CardDescription>URL de la imagen del logo (ej: https://...)</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5"><Label>URL del logo</Label><Input value={form.logo} onChange={(e) => update("logo", e.target.value)} placeholder="https://ejemplo.com/logo.png" /></div>
                {form.logo && <img src={form.logo} alt="Logo" className="h-12 object-contain rounded border border-border p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Ticket className="h-4 w-4" />Ticket</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5"><Label>Encabezado del ticket</Label><Textarea value={form.ticketHeader} onChange={(e) => update("ticketHeader", e.target.value)} rows={2} placeholder="Texto que aparece arriba del ticket..." /></div>
                <div className="space-y-1.5"><Label>Pie del ticket</Label><Textarea value={form.ticketFooter} onChange={(e) => update("ticketFooter", e.target.value)} rows={2} placeholder="Texto que aparece abajo del ticket..." /></div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Símbolo de moneda</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Código moneda</Label><Input value={form.currency} onChange={(e) => update("currency", e.target.value)} placeholder="CLP" /></div>
                  <div className="space-y-1.5"><Label>Símbolo</Label><Input value={form.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} placeholder="$" /></div>
                </div>
                <p className="text-xs text-muted-foreground">Vista previa: {form.currencySymbol}1.000</p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />Formas de pago</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Actualmente habilitadas: Efectivo, Débito, Crédito, Transferencia, Crédito cliente, Mixto. La configuración avanzada estará disponible próximamente.</p>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar personalización</>}
            </Button>
          </div>
        )}

        {subTab === "dispositivos" && (
          <div className="max-w-lg space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Printer className="h-4 w-4" />Dispositivos</h2>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Printer className="h-4 w-4" />Impresora y tickets</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Configuración de impresora térmica disponible próximamente.</p></CardContent></Card>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><QrCode className="h-4 w-4" />Lector de códigos</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">El lector de código de barras funciona automáticamente al escanear en el campo de búsqueda del POS.</p></CardContent></Card>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4" />Cajón de dinero</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Configuración de cajón monedero disponible próximamente.</p></CardContent></Card>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4" />Báscula</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Conexión con báscula disponible próximamente.</p></CardContent></Card>
          </div>
        )}

        {subTab === "mantenimiento" && (
          <div className="max-w-lg space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" />Mantenimiento</h2>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Respaldo automático</CardTitle></CardHeader><CardContent>
              <p className="text-sm text-muted-foreground mb-3">Neon PostgreSQL realiza respaldos automáticos diarios. Los datos están seguros en la nube.</p>
              <Button size="sm" variant="outline" onClick={() => toast.info("La base de datos se respalda automáticamente en Neon. Contacta al administrador para restauraciones.")}>Ver información de respaldo</Button>
            </CardContent></Card>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" />Actualizaciones automáticas</CardTitle></CardHeader><CardContent>
              <p className="text-sm text-muted-foreground">El sistema se actualiza mediante despliegues en Vercel desde el repositorio GitHub. Las actualizaciones se aplican automáticamente al hacer push.</p>
            </CardContent></Card>
            <Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Licencias</CardTitle></CardHeader><CardContent>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">Sistema Frutería El Principiante v1.0</p>
                <p className="text-muted-foreground">Desplegado en Vercel (Hobby) · Base de datos Neon (Free)</p>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">Stack: Next.js 16 · Prisma · PostgreSQL · Turbopack · Tailwind CSS · Recharts · XLSX</p>
              </div>
            </CardContent></Card>
          </div>
        )}
      </div>
    </div>
  );
}
