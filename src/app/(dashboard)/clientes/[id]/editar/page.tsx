import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getCustomerById } from "@/lib/actions/customers";
import { CustomerForm } from "../../customer-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const initialData = {
    id: customer.id,
    name: customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    creditLimit: customer.creditLimit,
    creditDays: customer.creditDays,
    notes: customer.notes || "",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href={`/clientes/${customer.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Editar cliente</h1>
      </div>
      <CustomerForm mode="edit" initialData={initialData} />
    </div>
  );
}
