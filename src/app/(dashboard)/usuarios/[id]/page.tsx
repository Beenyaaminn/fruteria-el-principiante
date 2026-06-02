import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getUserById } from "@/lib/actions/users";
import { UserForm } from "../user-form";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const initialData = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: "",
    pin: user.pin || "",
    role: user.role as any,
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/usuarios">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Editar usuario</h1>
      </div>
      <UserForm mode="edit" initialData={initialData} />
    </div>
  );
}
