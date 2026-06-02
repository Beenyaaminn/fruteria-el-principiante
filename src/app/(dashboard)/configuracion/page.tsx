import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building2, Receipt, Calculator } from "lucide-react";
import { getStoreConfig } from "@/lib/actions/settings";
import { ConfigForm } from "./config-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const config = await getStoreConfig();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Personaliza los datos del negocio y el comportamiento del sistema
        </p>
      </div>

      <ConfigForm initialData={{
        name: config.name,
        logo: config.logo,
        address: config.address,
        phone: config.phone,
        email: config.email,
        website: config.website,
        taxId: config.taxId,
        currency: config.currency,
        currencySymbol: config.currencySymbol,
        ticketHeader: config.ticketHeader,
        ticketFooter: config.ticketFooter,
        ivaRate: config.ivaRate,
        lowStockAlert: config.lowStockAlert,
      }} />
    </div>
  );
}
