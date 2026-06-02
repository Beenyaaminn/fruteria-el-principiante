import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { UserForm } from "../user-form";

export default function NuevoUsuarioPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/usuarios">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-primary" />
          Nuevo usuario
        </h1>
        <p className="text-muted-foreground">Crea una cuenta para un nuevo miembro del equipo</p>
      </div>
      <UserForm mode="create" />
    </div>
  );
}
